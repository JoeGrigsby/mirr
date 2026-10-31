// Shared code for the tag functions: storage, sessions, passwords and
// NTAG 424 DNA SUN (Secure Unique NFC) verification.
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

// ---------- storage ----------
// globalThis.__sfgStore lets local tests swap in an in-memory store.
export const store = () =>
  globalThis.__sfgStore ?? getStore({ name: "sfg-tags", consistency: "strong" });

export const getJSON = (key) => store().get(key, { type: "json" });
export const putJSON = (key, value) => store().setJSON(key, value);
export const del = (key) => store().delete(key);

// ---------- small helpers ----------
const B62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function randomId(len = 12) {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (const b of bytes) out += B62[b % 62];
  return out;
}

export function json(data, status = 200, cookies = []) {
  const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
  for (const c of cookies) headers.append("set-cookie", c);
  return new Response(JSON.stringify(data), { status, headers });
}

export function redirect(location, cookies = []) {
  const headers = new Headers({ location, "cache-control": "no-store" });
  for (const c of cookies) headers.append("set-cookie", c);
  return new Response(null, { status: 302, headers });
}

export function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.get("cookie") || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

// ---------- signed cookies ----------
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET env var must be set (32+ characters).");
  return s;
}
const hmac = (data) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

export function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body)}`;
}

export function unsign(token) {
  if (!token || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expected = hmac(body);
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function cookie(name, value, maxAgeSeconds) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export const SESSION_COOKIE = "sfg_s";
export const TAP_COOKIE = "sfg_tap";
export const TAP_MINUTES = 15;

export async function currentUser(req) {
  const s = unsign(parseCookies(req)[SESSION_COOKIE]);
  if (!s?.uid) return null;
  return getJSON(`users/${s.uid}`);
}

export const currentTap = (req) => unsign(parseCookies(req)[TAP_COOKIE]);

// ---------- passwords ----------
export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function checkPassword(password, salt, hash) {
  const test = Buffer.from(hashPassword(password, salt).hash, "hex");
  const real = Buffer.from(hash, "hex");
  return test.length === real.length && crypto.timingSafeEqual(test, real);
}

// ---------- NTAG 424 DNA SUN verification ----------
// Follows NXP AN12196: PICC data is AES-CBC encrypted with the SDM meta read
// key; the MAC uses a session key derived from the SDM file read key.
function aesBlock(key, block) {
  const c = crypto.createCipheriv("aes-128-ecb", key, null);
  c.setAutoPadding(false);
  return Buffer.concat([c.update(block), c.final()]);
}

const xor16 = (a, b) => Buffer.from(a.map((v, i) => v ^ b[i]));

function shiftLeft(b) {
  const out = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) out[i] = ((b[i] << 1) | (i < 15 ? b[i + 1] >> 7 : 0)) & 0xff;
  if (b[0] & 0x80) out[15] ^= 0x87;
  return out;
}

export function aesCmac(key, msg) {
  const k1 = shiftLeft(aesBlock(key, Buffer.alloc(16)));
  const k2 = shiftLeft(k1);
  const n = Math.max(1, Math.ceil(msg.length / 16));
  const complete = msg.length > 0 && msg.length % 16 === 0;
  let last;
  if (complete) {
    last = xor16(msg.subarray((n - 1) * 16), k1);
  } else {
    const pad = Buffer.alloc(16);
    const rest = msg.subarray((n - 1) * 16);
    rest.copy(pad);
    pad[rest.length] = 0x80;
    last = xor16(pad, k2);
  }
  let x = Buffer.alloc(16);
  for (let i = 0; i < n - 1; i++) x = aesBlock(key, xor16(x, msg.subarray(i * 16, i * 16 + 16)));
  return aesBlock(key, xor16(x, last));
}

function sdmKeys() {
  const meta = process.env.SDM_META_KEY;
  const file = process.env.SDM_FILE_KEY;
  const ok = (k) => typeof k === "string" && /^[0-9a-fA-F]{32}$/.test(k);
  return {
    meta: Buffer.from(ok(meta) ? meta : "00".repeat(16), "hex"),
    file: Buffer.from(ok(file) ? file : "00".repeat(16), "hex"),
    factoryKeys: !(ok(meta) && ok(file)),
  };
}

// Returns { uid, counter, factoryKeys } for a genuine tap, or null.
export function verifySun(piccHex, cmacHex, keys = sdmKeys()) {
  if (!/^[0-9a-fA-F]{32}$/.test(piccHex || "") || !/^[0-9a-fA-F]{16}$/.test(cmacHex || "")) return null;

  const d = crypto.createDecipheriv("aes-128-cbc", keys.meta, Buffer.alloc(16));
  d.setAutoPadding(false);
  const picc = Buffer.concat([d.update(Buffer.from(piccHex, "hex")), d.final()]);
  if (picc[0] !== 0xc7) return null; // UID and counter must both be mirrored

  const uid = picc.subarray(1, 8);
  const ctr = picc.subarray(8, 11);
  const sv2 = Buffer.concat([Buffer.from("3cc300010080", "hex"), uid, ctr]);
  const sessionKey = aesCmac(keys.file, sv2);
  const full = aesCmac(sessionKey, Buffer.alloc(0));
  const mac = Buffer.from([1, 3, 5, 7, 9, 11, 13, 15].map((i) => full[i]));

  if (!crypto.timingSafeEqual(mac, Buffer.from(cmacHex, "hex"))) return null;
  return {
    uid: uid.toString("hex").toUpperCase(),
    counter: ctr[0] | (ctr[1] << 8) | (ctr[2] << 16),
    factoryKeys: keys.factoryKeys,
  };
}
