// Every tag's URL points here: /t?c=CODE (fixed URL written with NFC Tools)
// or /t?picc=...&cmac=... (NTAG 424 DNA with SUN turned on).
// It works out which item was tapped, remembers the tap briefly in a signed
// cookie, and sends the phone to the item page.
import {
  getJSON, putJSON, store, redirect, cookie, sign, verifySun, TAP_COOKIE, TAP_MINUTES,
} from "../lib/core.mjs";

const tapCookie = (data) =>
  cookie(TAP_COOKIE, sign({ ...data, exp: Date.now() + TAP_MINUTES * 60_000 }), TAP_MINUTES * 60);

export default async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("c");
  const picc = url.searchParams.get("picc");
  const cmac = url.searchParams.get("cmac");

  // Fixed-URL tag
  if (code) {
    const itemId = await store().get(`tagc/${code}`);
    if (!itemId) return redirect("/tags/?tap=unknown");
    return redirect(`/tags/?item=${itemId}`, [tapCookie({ itemId, sun: false })]);
  }

  // Secure (SUN) tag
  if (picc && cmac) {
    const tap = verifySun(picc, cmac);
    if (!tap) return redirect("/tags/?tap=invalid");

    const itemId = await store().get(`tagu/${tap.uid}`);
    if (!itemId) {
      // Genuine tag that isn't linked to an item yet: offer to register it.
      return redirect("/tags/?register=1", [
        tapCookie({ uid: tap.uid, counter: tap.counter, sun: true, unregistered: true }),
      ]);
    }

    const item = await getJSON(`items/${itemId}`);
    if (!item) return redirect("/tags/?tap=unknown");
    if (tap.counter <= (item.tag.lastCounter ?? -1)) return redirect("/tags/?tap=stale");

    item.tag.lastCounter = tap.counter;
    await putJSON(`items/${itemId}`, item);
    return redirect(`/tags/?item=${itemId}`, [tapCookie({ itemId, sun: true })]);
  }

  return redirect("/tags/");
};

export const config = { path: "/t" };
