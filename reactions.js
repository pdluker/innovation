// reactions.js
// Pursue / watch / pass on each episode. This is the "signal" the roadmap
// gates reader features on: before building digests or submissions, the
// archive should show which briefs actually move people.
//
// No accounts and no personal data. A visitor is a random id in a cookie;
// changing your mind overwrites your reaction. To stop one machine from
// counting as a crowd, each episode accepts at most MAX_PER_ADDRESS
// visitors per network address, identified only by a salted hash that
// changes per episode and cannot be reversed. The owner's own call (from
// the publish email) is stored separately and never shown in the counts.

import { json, KEYS } from "./store.js";
import { cookieValue } from "./auth.js";

export const REACTIONS = ["pursue", "watch", "pass"];
const VISITOR_COOKIE = "id_v";
const MAX_PER_ADDRESS = 5;

const enc = new TextEncoder();

async function addressHash(env, request, date) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(`${env.REFRESH_SECRET || ""}|${date}|${ip}`));
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function countsFor(env, date) {
  const { results } = await env.DB.prepare(
    "SELECT reaction, COUNT(*) AS n FROM reactions WHERE episode_date = ? AND source = 'listener' GROUP BY reaction"
  ).bind(date).all();
  const counts = { pursue: 0, watch: 0, pass: 0 };
  for (const r of results) counts[r.reaction] = r.n;
  return counts;
}

export async function ownerReaction(env, date, reaction) {
  await env.DB.prepare(
    `INSERT INTO reactions (episode_date, visitor, reaction, source) VALUES (?, 'owner', ?, 'owner')
     ON CONFLICT(episode_date, visitor) DO UPDATE SET reaction = excluded.reaction, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`
  ).bind(date, reaction).run();
}

/** GET /api/reactions/<date>  and  POST /api/react {date, reaction} */
export async function handleReactions(request, env, path) {
  const getMatch = /^\/api\/reactions\/(\d{4}-\d{2}-\d{2})$/.exec(path);
  if (!getMatch && path !== "/api/react") return null;
  if (!env.DB) return json({ ok: false, error: "reactions are not enabled" }, 503);

  const visitor = cookieValue(request, VISITOR_COOKIE);

  if (getMatch && request.method === "GET") {
    const date = getMatch[1];
    const counts = await countsFor(env, date);
    let mine = null;
    if (visitor) {
      const row = await env.DB.prepare("SELECT reaction FROM reactions WHERE episode_date = ? AND visitor = ?").bind(date, visitor).first();
      mine = row ? row.reaction : null;
    }
    return json({ ok: true, date, counts, mine }, 200, { "cache-control": "private, no-store" });
  }

  if (path === "/api/react" && request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "send JSON: {date, reaction}" }, 400);
    }
    const date = String(body.date || "");
    const reaction = String(body.reaction || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !REACTIONS.includes(reaction)) {
      return json({ ok: false, error: "reaction must be pursue, watch or pass for a YYYY-MM-DD episode" }, 400);
    }
    if (!(await env.PODCAST_BUCKET.head(KEYS.episode(date)))) {
      return json({ ok: false, error: "no episode for that date" }, 404);
    }

    const id = visitor && /^[0-9a-f-]{36}$/.test(visitor) ? visitor : crypto.randomUUID();
    const ipHash = await addressHash(env, request, date);

    const existing = await env.DB.prepare("SELECT 1 FROM reactions WHERE episode_date = ? AND visitor = ?").bind(date, id).first();
    if (!existing) {
      const row = await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM reactions WHERE episode_date = ? AND ip_hash = ?"
      ).bind(date, ipHash).first();
      if (row && row.n >= MAX_PER_ADDRESS) {
        return json({ ok: false, error: "too many reactions from this network for this episode" }, 429);
      }
    }

    await env.DB.prepare(
      `INSERT INTO reactions (episode_date, visitor, reaction, source, ip_hash) VALUES (?, ?, ?, 'listener', ?)
       ON CONFLICT(episode_date, visitor) DO UPDATE SET reaction = excluded.reaction, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`
    ).bind(date, id, reaction, ipHash).run();

    const counts = await countsFor(env, date);
    return json({ ok: true, date, counts, mine: reaction }, 200, {
      "cache-control": "private, no-store",
      "set-cookie": `${VISITOR_COOKIE}=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
    });
  }

  return json({ ok: false, error: "method not allowed" }, 405);
}
