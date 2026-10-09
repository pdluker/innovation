// admin.js
// Owner-only routes. Two front doors:
//   /api/admin/*  JSON for /admin.html (session cookie) and scripts (Bearer)
//   /act          one-tap links from the publish email (signed tokens)
//
// /act never acts on GET. It renders a confirmation page whose button
// POSTs the same token back - email scanners follow links, and a link that
// approved an idea on GET would be approved by a bot.

import { json, KEYS, readJson } from "./store.js";
import { isOwner, secretMatches, sessionSetCookie, sessionClearCookie, readLinkToken } from "./auth.js";
import { listIdeas, addSeed, decide, getRow, rowToIdea, loadPool, savePromotion, markPromoting, failPromotion } from "./pool-store.js";
import { isSelectable, validateIdea, CATEGORIES } from "./pool.js";
import { scoreIdea } from "./score.js";
import { promoteSeed } from "./promote.js";
import { backfillKits, runDueRevisits } from "./maintenance.js";
import { ownerReaction, REACTIONS } from "./reactions.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function page(title, body, status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)} - Innovation Daily</title>
<style>
body{margin:0;background:#F2EAD8;color:#1C1712;font:18px/1.6 Georgia,serif}
.wrap{max-width:560px;margin:0 auto;padding:40px 20px}
h1{font:700 26px/1.2 system-ui,sans-serif;margin:0 0 16px}
p{margin:0 0 14px}
.tag{font:600 12px/1 ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:#5B5145;margin-bottom:10px}
button{font:600 14px ui-monospace,Menlo,monospace;letter-spacing:.06em;text-transform:uppercase;background:#1C1712;color:#F2EAD8;border:0;padding:14px 22px;cursor:pointer}
textarea{width:100%;min-height:120px;font:16px Georgia,serif;padding:10px;border:1.5px solid #1C1712;background:#fff;box-sizing:border-box;margin-bottom:12px}
a{color:#B5541E}
</style></head><body><div class="wrap"><div class="tag">Innovation Daily</div>${body}</div></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } }
  );
}

async function describe(env, action, subject) {
  if (action === "approve" || action === "hold") {
    const row = env.DB ? await getRow(env, subject) : null;
    const idea = rowToIdea(row);
    const verb = action === "approve" ? "Approve" : "Hold";
    return {
      title: `${verb} this idea?`,
      text: idea
        ? `<p><b>${esc(idea.title)}</b></p><p>${esc(idea.thesis)}</p><p>${action === "approve" ? "It joins the rotation and can air on the next scheduled run." : "It stays out of the rotation until you approve it."}</p>`
        : `<p>Idea <code>${esc(subject)}</code>.</p>`
    };
  }
  if (action === "react") {
    const [date, reaction] = String(subject).split(":");
    return { title: `Record your call: ${reaction}`, text: `<p>Your call on the ${esc(date)} brief. It is kept for the 90-day revisit and never shown in the public counts.</p>` };
  }
  if (action === "seed") {
    return { title: "Add an idea", text: `<p>One line is enough. It is researched on the next scheduled run and comes back to you for approval - it never airs unreviewed.</p><textarea name="text" required maxlength="600" placeholder="e.g. Buy a small bookkeeping practice and automate the month-end close"></textarea>` };
  }
  return { title: "Unknown action", text: "" };
}

async function perform(env, action, subject, form) {
  if (!env.DB) return { ok: false, message: "The idea database is not connected yet." };
  if (action === "approve" || action === "hold") {
    const result = await decide(env, subject, action === "approve" ? "approve" : "hold", action === "hold" ? "Held from the publish email." : null);
    if (!result.ok) return { ok: false, message: `Not done: ${result.errors.join("; ")}` };
    return { ok: true, message: `${action === "approve" ? "Approved" : "Held"}.${result.warning ? ` Note: ${result.warning}` : ""}` };
  }
  if (action === "react") {
    const [date, reaction] = String(subject).split(":");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !REACTIONS.includes(reaction)) return { ok: false, message: "That link is malformed." };
    await ownerReaction(env, date, reaction);
    return { ok: true, message: `Recorded: ${reaction} on the ${date} brief.` };
  }
  if (action === "seed") {
    const id = await addSeed(env, form.get("text"));
    return { ok: true, message: `Added as <code>${esc(id)}</code>. It will be researched on the next scheduled run.` };
  }
  return { ok: false, message: "Unknown action." };
}

/** GET shows the confirmation; POST performs it. */
export async function handleAct(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const token = url.searchParams.get("t");
    const link = await readLinkToken(env, token);
    if (!link) return page("Link expired", "<h1>This link has expired or is not valid.</h1><p>Use the latest publish email, or the <a href=\"/admin.html\">review screen</a>.</p>", 403);
    const d = await describe(env, link.action, link.subject);
    return page(d.title, `<h1>${esc(d.title)}</h1><form method="POST" action="/act">${d.text}<input type="hidden" name="t" value="${esc(token)}"><button type="submit">Confirm</button></form>`);
  }
  if (request.method === "POST") {
    const form = await request.formData();
    const link = await readLinkToken(env, String(form.get("t") || ""));
    if (!link) return page("Link expired", "<h1>This link has expired or is not valid.</h1>", 403);
    try {
      const result = await perform(env, link.action, link.subject, form);
      return page(result.ok ? "Done" : "Not done", `<h1>${result.ok ? "Done" : "Not done"}</h1><p>${result.message}</p><p><a href="/admin.html">Review screen</a></p>`, result.ok ? 200 : 400);
    } catch (err) {
      return page("Not done", `<h1>Not done</h1><p>${esc(err.message)}</p>`, 400);
    }
  }
  return new Response("Method not allowed", { status: 405 });
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

/** /api/admin/* - returns null for paths it does not own. */
export async function handleAdminApi(request, env, path) {
  if (!path.startsWith("/api/admin/")) return null;

  if (path === "/api/admin/login" && request.method === "POST") {
    const body = await readBody(request);
    if (!secretMatches(body.secret, env)) return json({ ok: false, error: "wrong secret" }, 401);
    return json({ ok: true }, 200, { "set-cookie": await sessionSetCookie(env), "cache-control": "no-store" });
  }
  if (path === "/api/admin/logout" && request.method === "POST") {
    return json({ ok: true }, 200, { "set-cookie": sessionClearCookie(), "cache-control": "no-store" });
  }

  if (!(await isOwner(request, env))) return json({ ok: false, error: "unauthorized" }, 401);
  const noStore = { "cache-control": "no-store" };

  if (path === "/api/admin/pool" && request.method === "GET") {
    const rotation = await readJson(env, KEYS.rotation, { used: [] });
    const used = new Set(rotation.used || []);
    const rows = env.DB
      ? await listIdeas(env)
      : (await loadPool(env)).map((idea) => ({ id: idea.id, status: idea.verification.status, origin: "pool-v1", idea }));
    const ideas = rows.map((r) => ({
      id: r.id,
      status: r.status,
      origin: r.origin,
      seedText: r.seedText || null,
      notes: r.notes || null,
      updatedAt: r.updatedAt || null,
      used: used.has(r.id),
      idea: r.idea,
      score: r.idea ? scoreIdea(r.idea) : null,
      problems: r.idea ? validateIdea({ ...r.idea, verification: { ...r.idea.verification, status: "verified" } }) : []
    }));
    const selectable = rows.map((r) => r.idea).filter((i) => i && isSelectable(i));
    const mix = Object.fromEntries(CATEGORIES.map((c) => [c, selectable.filter((i) => i.category === c).length]).filter(([, n]) => n));
    let reactions = [];
    if (env.DB) {
      const { results } = await env.DB.prepare(
        `SELECT episode_date,
           SUM(CASE WHEN source = 'listener' AND reaction = 'pursue' THEN 1 ELSE 0 END) AS pursue,
           SUM(CASE WHEN source = 'listener' AND reaction = 'watch' THEN 1 ELSE 0 END) AS watch,
           SUM(CASE WHEN source = 'listener' AND reaction = 'pass' THEN 1 ELSE 0 END) AS pass,
           MAX(CASE WHEN source = 'owner' THEN reaction END) AS owner
         FROM reactions GROUP BY episode_date ORDER BY episode_date DESC LIMIT 60`
      ).all();
      reactions = results;
    }
    return json({
      ok: true,
      database: Boolean(env.DB),
      selectable: selectable.length,
      remaining: selectable.filter((i) => !used.has(i.id)).length,
      mix,
      ideas,
      reactions
    }, 200, noStore);
  }

  // Kits and revisits work on the bundled pool too - no database needed.
  if (path === "/api/admin/backfill-kits" && request.method === "POST") {
    const url = new URL(request.url);
    const limit = Math.min(11, Math.max(1, Number(url.searchParams.get("limit")) || 3));
    try {
      return json({ ok: true, kits: await backfillKits(env, limit) }, 200, noStore);
    } catch (err) {
      return json({ ok: false, error: err.message }, 502);
    }
  }

  if (path === "/api/admin/revisits" && request.method === "POST") {
    try {
      return json({ ok: true, revisits: await runDueRevisits(env) }, 200, noStore);
    } catch (err) {
      return json({ ok: false, error: err.message }, 502);
    }
  }

  if (!env.DB) return json({ ok: false, error: "the idea database is not connected yet (see RELEASE.md)" }, 503);

  if (path === "/api/admin/seed" && request.method === "POST") {
    const body = await readBody(request);
    try {
      return json({ ok: true, id: await addSeed(env, body.text) }, 200, noStore);
    } catch (err) {
      return json({ ok: false, error: err.message }, 400);
    }
  }

  const ideaMatch = /^\/api\/admin\/ideas\/([a-z0-9-]+)(?:\/(promote|decide))?$/.exec(path);
  if (ideaMatch) {
    const [, id, verb] = ideaMatch;
    const row = await getRow(env, id);
    if (!row) return json({ ok: false, error: `no idea "${id}"` }, 404);

    if (!verb && request.method === "GET") {
      return json({ ok: true, row: { ...row, notes: row.notes ? JSON.parse(row.notes) : null }, idea: rowToIdea(row) }, 200, noStore);
    }

    // Owner edits: replace the editorial fields and/or the audit record.
    // Nothing is approved by saving; the status only changes via decide.
    if (!verb && request.method === "PUT") {
      const body = await readBody(request);
      const current = rowToIdea(row) || {};
      const { verification: currentV, ...currentIdea } = current;
      const idea = { ...currentIdea, ...(body.idea || {}), id };
      const verification = { ...(currentV || {}), ...(body.verification || {}) };
      const problems = validateIdea({ ...idea, verification: { ...verification, status: "verified" } });
      if (/[^\x20-\x7E]/.test(JSON.stringify({ idea, verification }))) return json({ ok: false, error: "use plain ASCII (straight quotes, - for dashes)" }, 400);
      await env.DB.prepare("UPDATE ideas SET idea_json = ?, verification_json = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?")
        .bind(JSON.stringify(idea), JSON.stringify(verification), id).run();
      return json({ ok: true, problems }, 200, noStore);
    }

    if (verb === "promote" && request.method === "POST") {
      await markPromoting(env, id);
      try {
        const result = await promoteSeed(env, { id, seed_text: row.seed_text || (rowToIdea(row) || {}).title });
        if (result.status === "insufficient" && row.idea_json) {
          // Re-research came up short: keep the existing draft, record why.
          await failPromotion(env, id, row.status, `re-research insufficient: ${result.notes.problems[0] || ""}`);
          return json({ ok: true, status: row.status, kept: "existing draft", notes: result.notes }, 200, noStore);
        }
        await savePromotion(env, id, result);
        return json({ ok: true, status: result.status, notes: result.notes }, 200, noStore);
      } catch (err) {
        await failPromotion(env, id, row.status, err.message);
        return json({ ok: false, error: err.message }, 502);
      }
    }

    if (verb === "decide" && request.method === "POST") {
      const body = await readBody(request);
      const result = await decide(env, id, body.decision, body.note);
      return json(result, result.ok ? 200 : 400, noStore);
    }
  }

  return json({ ok: false, error: "not found" }, 404);
}
