// auth.js
// Everything owner-only is gated here. One secret (REFRESH_SECRET) backs
// three credentials:
//   - Bearer header        scripts and curl (/refresh, /status, /api/admin/*)
//   - session cookie       the /admin.html screen, after a one-time login
//   - signed link tokens   one-tap actions in the publish email (approve an
//                          idea, record your call, add a seed)
// Each purpose signs with its own key derived from the secret, so a link
// token can never be replayed as a session and neither can be forged
// without the secret. Rotating REFRESH_SECRET revokes all of them at once.
//
// Link tokens are scoped (one action, one subject) and expire. They are
// never honored on GET: email scanners follow links, so a GET only renders
// a confirmation page and the action happens on the POST.

const enc = new TextEncoder();
const dec = new TextDecoder();

export const SESSION_COOKIE = "id_owner";
const SESSION_DAYS = 30;

function b64url(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(str) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const keyCache = new Map();
async function keyFor(env, purpose) {
  const cacheKey = `${purpose}:${env.REFRESH_SECRET}`;
  if (keyCache.has(cacheKey)) return keyCache.get(cacheKey);
  const base = await crypto.subtle.importKey(
    "raw", enc.encode(env.REFRESH_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const derived = await crypto.subtle.sign("HMAC", base, enc.encode(`innovation-daily/${purpose}/v1`));
  const key = await crypto.subtle.importKey("raw", derived, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  keyCache.set(cacheKey, key);
  return key;
}

async function sign(env, purpose, payload) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await keyFor(env, purpose), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

async function verify(env, purpose, token) {
  if (!env.REFRESH_SECRET || typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify("HMAC", await keyFor(env, purpose), unb64url(sig), enc.encode(body));
    if (!valid) return null;
    const payload = JSON.parse(dec.decode(unb64url(body)));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Bearer header, constant-time. Every route that can spend money or change
 *  state accepts this (spec gotcha 12). */
export function bearerOk(request, env) {
  const header = request.headers.get("Authorization") || "";
  const expected = `Bearer ${env.REFRESH_SECRET}`;
  if (!env.REFRESH_SECRET) return false;
  if (header.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < header.length; i++) diff |= header.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** The secret typed into the login form, constant-time. */
export function secretMatches(candidate, env) {
  const expected = String(env.REFRESH_SECRET || "");
  const given = String(candidate || "");
  if (!expected || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function cookieValue(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export async function sessionSetCookie(env) {
  const token = await sign(env, "session", { exp: Date.now() + SESSION_DAYS * 86_400_000 });
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86_400}`;
}

export function sessionClearCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

/** Owner = the Bearer secret, or a valid session cookie. */
export async function isOwner(request, env) {
  if (bearerOk(request, env)) return true;
  return Boolean(await verify(env, "session", cookieValue(request, SESSION_COOKIE)));
}

/** A one-action link token, e.g. ("approve", "some-idea-id", 14). */
export async function linkToken(env, action, subject, days) {
  return sign(env, "link", { a: action, s: subject || "", exp: Date.now() + days * 86_400_000 });
}

export async function readLinkToken(env, token) {
  const p = await verify(env, "link", token);
  return p ? { action: p.a, subject: p.s, exp: p.exp } : null;
}

export { cookieValue };
