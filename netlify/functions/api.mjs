// JSON API behind /tags/. Roles are decided here, never in the browser:
// creator = item.creatorId, owner = item.ownerId, anyone else = viewer.
import {
  getJSON, putJSON, del, store, json, cookie, sign, randomId, currentUser, currentTap,
  hashPassword, checkPassword, SESSION_COOKIE, TAP_COOKIE,
} from "../lib/core.mjs";

const SESSION_DAYS = 60;
const CLAIM_DAYS = 7;
const now = () => new Date().toISOString();
const clean = (v, max = 4000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const nameCache = new Map();
async function nameOf(userId) {
  if (!userId) return null;
  if (!nameCache.has(userId)) nameCache.set(userId, (await getJSON(`users/${userId}`))?.name ?? "Unknown");
  return nameCache.get(userId);
}

function origin(req) {
  return (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
}

// Builds the item as the current person is allowed to see it.
async function itemView(req, item, user, tap) {
  const isCreator = !!user && user.id === item.creatorId;
  const isOwner = !!user && user.id === item.ownerId;
  const tappedThis = tap?.itemId === item.id;

  const view = {
    id: item.id,
    title: item.title,
    story: item.story,
    materials: item.materials,
    madeOn: item.madeOn,
    status: item.status,
    creatorName: await nameOf(item.creatorId),
    publicNote: item.ownerPublicNote || "",
    ownerCount: item.history.length,
    roles: { creator: isCreator, owner: isOwner, viewer: !isCreator && !isOwner },
    tap: tappedThis ? (tap.sun ? "verified" : "tapped") : null,
    signedIn: !!user,
  };

  if (isOwner) {
    const claim = item.pendingClaim && (await getJSON(`claims/${item.pendingClaim}`));
    view.owner = {
      privateNotes: item.ownerPrivateNotes || "",
      purchase: item.ownerPurchase || "",
      publicNote: item.ownerPublicNote || "",
      since: item.history.at(-1)?.from,
      pendingTransfer: claim && Date.parse(claim.expires) > Date.now()
        ? { url: `${origin(req)}/tags/?claim=${item.pendingClaim}`, expires: claim.expires }
        : null,
    };
  }

  if (isCreator || isOwner) {
    view.tag = {
      mode: item.tag.mode,
      url: item.tag.mode === "static" ? `${origin(req)}/t?c=${item.tag.code}` : null,
      uid: item.tag.mode === "sun" ? item.tag.uid : null,
    };
  }

  if (isCreator) {
    view.history = [];
    for (const h of item.history) view.history.push({ name: await nameOf(h.ownerId), from: h.from, to: h.to || null });
  }

  if (!isOwner) view.ownerName = isCreator ? await nameOf(item.ownerId) : null;
  return view;
}

function newItem(user, title, tag) {
  const t = now();
  return {
    id: randomId(10),
    title: clean(title, 200) || "Untitled piece",
    story: "",
    materials: "",
    madeOn: "",
    status: "ok",
    creatorId: user.id,
    ownerId: user.id,
    ownerPrivateNotes: "",
    ownerPurchase: "",
    ownerPublicNote: "",
    history: [{ ownerId: user.id, from: t }],
    tag,
    pendingClaim: null,
    created: t,
  };
}

async function body(req) {
  try { return await req.json(); } catch { return {}; }
}

export default async (req) => {
  nameCache.clear();
  const url = new URL(req.url);
  const route = `${req.method} ${url.pathname.replace(/^\/api/, "")}`;
  const user = await currentUser(req);
  const tap = currentTap(req);

  try {
    switch (route) {
      // ---------- accounts ----------
      case "GET /me":
        return json({
          user: user ? { id: user.id, name: user.name, email: user.email } : null,
          pendingRegistration: !!tap?.unregistered,
          inviteRequired: !!process.env.INVITE_CODE,
        });

      case "POST /signup": {
        const b = await body(req);
        const name = clean(b.name, 80);
        const email = clean(b.email, 200).toLowerCase();
        if (process.env.INVITE_CODE && b.invite !== process.env.INVITE_CODE)
          return json({ error: "That invite code doesn't match. Ask the site owner for the current code." }, 403);
        if (!name || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Enter your name and a valid email." }, 400);
        if (typeof b.password !== "string" || b.password.length < 8)
          return json({ error: "Use a password of at least 8 characters." }, 400);
        if (await store().get(`emails/${email}`)) return json({ error: "An account with that email already exists. Sign in instead." }, 409);

        const id = randomId(12);
        const { salt, hash } = hashPassword(b.password);
        await putJSON(`users/${id}`, { id, name, email, salt, hash, created: now() });
        await store().set(`emails/${email}`, id);
        return json({ ok: true }, 200, [cookie(SESSION_COOKIE, sign({ uid: id, exp: Date.now() + SESSION_DAYS * 864e5 }), SESSION_DAYS * 86400)]);
      }

      case "POST /login": {
        const b = await body(req);
        const id = await store().get(`emails/${clean(b.email, 200).toLowerCase()}`);
        const u = id && (await getJSON(`users/${id}`));
        if (!u || !checkPassword(String(b.password || ""), u.salt, u.hash))
          return json({ error: "That email and password don't match an account." }, 401);
        return json({ ok: true }, 200, [cookie(SESSION_COOKIE, sign({ uid: u.id, exp: Date.now() + SESSION_DAYS * 864e5 }), SESSION_DAYS * 86400)]);
      }

      case "POST /logout":
        return json({ ok: true }, 200, [cookie(SESSION_COOKIE, "", 0)]);

      // ---------- items ----------
      case "GET /items": {
        if (!user) return json({ error: "Sign in to see your items." }, 401);
        const { blobs } = await store().list({ prefix: "items/" });
        const mine = [];
        for (const { key } of blobs) {
          const it = await getJSON(key);
          if (it && (it.creatorId === user.id || it.ownerId === user.id))
            mine.push({ id: it.id, title: it.title, creator: it.creatorId === user.id, owner: it.ownerId === user.id, created: it.created });
        }
        mine.sort((a, b) => b.created.localeCompare(a.created));
        return json({ items: mine });
      }

      case "POST /items": {
        // New item with a fixed-URL tag (written with NFC Tools).
        if (!user) return json({ error: "Sign in to add an item." }, 401);
        const b = await body(req);
        const code = randomId(10);
        const item = newItem(user, b.title, { mode: "static", code });
        await putJSON(`items/${item.id}`, item);
        await store().set(`tagc/${code}`, item.id);
        return json({ id: item.id });
      }

      case "POST /register-sun": {
        // Links a genuine, just-tapped SUN tag to a new item. The tapper becomes creator and owner.
        if (!user) return json({ error: "Sign in to register this tag." }, 401);
        if (!tap?.unregistered) return json({ error: "Tap the tag again, then register it within 15 minutes." }, 400);
        if (await store().get(`tagu/${tap.uid}`)) return json({ error: "This tag is already linked to an item." }, 409);
        const b = await body(req);
        const item = newItem(user, b.title, { mode: "sun", uid: tap.uid, lastCounter: tap.counter });
        await putJSON(`items/${item.id}`, item);
        await store().set(`tagu/${tap.uid}`, item.id);
        return json({ id: item.id }, 200, [cookie(TAP_COOKIE, sign({ itemId: item.id, sun: true, exp: Date.now() + 15 * 60_000 }), 900)]);
      }

      case "GET /item": {
        const item = await getJSON(`items/${url.searchParams.get("id")}`);
        if (!item) return json({ error: "No item matches this link." }, 404);
        return json({ item: await itemView(req, item, user, tap) });
      }

      case "POST /item/update": {
        const b = await body(req);
        const item = await getJSON(`items/${b.id}`);
        if (!item) return json({ error: "No item matches this link." }, 404);
        const isCreator = user?.id === item.creatorId;
        const isOwner = user?.id === item.ownerId;
        if (!isCreator && !isOwner) return json({ error: "Only the maker or owner can change this item." }, 403);

        if (isCreator) {
          if ("title" in b) item.title = clean(b.title, 200) || item.title;
          if ("story" in b) item.story = clean(b.story);
          if ("materials" in b) item.materials = clean(b.materials, 500);
          if ("madeOn" in b) item.madeOn = clean(b.madeOn, 40);
        }
        if (isOwner) {
          if ("privateNotes" in b) item.ownerPrivateNotes = clean(b.privateNotes);
          if ("purchase" in b) item.ownerPurchase = clean(b.purchase, 1000);
          if ("publicNote" in b) item.ownerPublicNote = clean(b.publicNote, 1000);
          if ("status" in b) item.status = b.status === "lost" ? "lost" : "ok";
        }
        await putJSON(`items/${item.id}`, item);
        return json({ item: await itemView(req, item, user, tap) });
      }

      // ---------- ownership transfer ----------
      case "POST /item/transfer": {
        const b = await body(req);
        const item = await getJSON(`items/${b.id}`);
        if (!item || user?.id !== item.ownerId) return json({ error: "Only the current owner can transfer this item." }, 403);
        if (item.pendingClaim) await del(`claims/${item.pendingClaim}`);
        const code = randomId(16);
        await putJSON(`claims/${code}`, {
          itemId: item.id, fromOwnerId: user.id, expires: new Date(Date.now() + CLAIM_DAYS * 864e5).toISOString(),
        });
        item.pendingClaim = code;
        await putJSON(`items/${item.id}`, item);
        return json({ item: await itemView(req, item, user, tap) });
      }

      case "POST /item/cancel-transfer": {
        const b = await body(req);
        const item = await getJSON(`items/${b.id}`);
        if (!item || user?.id !== item.ownerId) return json({ error: "Only the current owner can cancel a transfer." }, 403);
        if (item.pendingClaim) await del(`claims/${item.pendingClaim}`);
        item.pendingClaim = null;
        await putJSON(`items/${item.id}`, item);
        return json({ item: await itemView(req, item, user, tap) });
      }

      case "GET /claim": {
        const claim = await getJSON(`claims/${url.searchParams.get("code")}`);
        if (!claim || Date.parse(claim.expires) < Date.now())
          return json({ error: "This transfer link has expired or was cancelled. Ask the owner for a new one." }, 404);
        const item = await getJSON(`items/${claim.itemId}`);
        return json({
          claim: {
            itemId: item.id, title: item.title, fromName: await nameOf(claim.fromOwnerId),
            creatorName: await nameOf(item.creatorId), expires: claim.expires,
            needsTap: item.tag.mode === "sun",
            hasTap: tap?.itemId === item.id,
          },
        });
      }

      case "POST /claim/accept": {
        if (!user) return json({ error: "Sign in or create an account to accept this item." }, 401);
        const b = await body(req);
        const code = clean(b.code, 64);
        const claim = await getJSON(`claims/${code}`);
        if (!claim || Date.parse(claim.expires) < Date.now())
          return json({ error: "This transfer link has expired or was cancelled. Ask the owner for a new one." }, 404);
        const item = await getJSON(`items/${claim.itemId}`);
        if (item.pendingClaim !== code || item.ownerId !== claim.fromOwnerId)
          return json({ error: "This transfer link is no longer valid. Ask the owner for a new one." }, 409);
        if (user.id === item.ownerId) return json({ error: "You already own this item." }, 400);
        if (item.tag.mode === "sun" && tap?.itemId !== item.id)
          return json({ error: "Tap the item's tag with your phone first, then accept here within 15 minutes." }, 403);

        const t = now();
        item.history.at(-1).to = t;
        item.history.push({ ownerId: user.id, from: t });
        item.ownerId = user.id;
        item.ownerPrivateNotes = "";
        item.ownerPurchase = "";
        item.ownerPublicNote = "";
        item.status = "ok";
        item.pendingClaim = null;
        await putJSON(`items/${item.id}`, item);
        await del(`claims/${code}`);
        return json({ id: item.id });
      }

      default:
        return json({ error: "Not found." }, 404);
    }
  } catch (err) {
    console.error(err);
    return json({ error: "Something went wrong on the server. Check the function logs in Netlify." }, 500);
  }
};

export const config = { path: "/api/*" };
