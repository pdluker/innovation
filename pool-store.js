// pool-store.js
// Where the pool lives at runtime.
//
// With a D1 binding (env.DB) the pool is the ideas table, so a new idea goes
// from a one-line seed to the rotation - seed, promote, approve - without a
// redeploy, and the countdown ends. Without the binding (or before the table
// is seeded) the bundled pool from pool.js is used; it is also what the
// table is seeded from (scripts/seed-d1.mjs).
//
// Only the owner moves an idea to "verified". Nothing a model produces is
// ever approved automatically.

import { bundledPool, validateIdea, isSelectable } from "./pool.js";

const RUNNABLE = ["verified", "held", "needs-review"];
const STALE_PROMOTE_MS = 30 * 60_000;
const CATEGORY_SHARE_WARNING = 0.35;

const now = () => new Date().toISOString();

export function rowToIdea(row) {
  if (!row || !row.idea_json) return null;
  const idea = JSON.parse(row.idea_json);
  const verification = row.verification_json ? JSON.parse(row.verification_json) : null;
  // The row's status is the source of truth; the record's copy follows it.
  if (verification && RUNNABLE.includes(row.status)) verification.status = row.status;
  return { ...idea, verification };
}

/** Every entry that could run, with verification attached. */
export async function loadPool(env) {
  if (!env.DB) return bundledPool();
  const { results } = await env.DB.prepare(
    "SELECT id, status, idea_json, verification_json FROM ideas WHERE status IN ('verified','held','needs-review')"
  ).all();
  if (!results.length) {
    console.log("pool: D1 is bound but empty - using the bundled pool until it is seeded");
    return bundledPool();
  }
  return results.map(rowToIdea).filter(Boolean);
}

/** Every row, for the owner's review screen. */
export async function listIdeas(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, status, idea_json, verification_json, seed_text, origin, notes, created_at, updated_at, decided_at FROM ideas ORDER BY updated_at DESC"
  ).all();
  return results.map((row) => ({
    id: row.id,
    status: row.status,
    origin: row.origin,
    seedText: row.seed_text,
    notes: row.notes ? JSON.parse(row.notes) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    decidedAt: row.decided_at,
    idea: rowToIdea(row)
  }));
}

export async function getRow(env, id) {
  return env.DB.prepare("SELECT * FROM ideas WHERE id = ?").bind(id).first();
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

/** A one-line idea, nothing researched yet. */
export async function addSeed(env, text) {
  const clean = String(text || "").replace(/[^\x20-\x7E]/g, "").trim();
  if (clean.length < 12) throw new Error("describe the idea in at least a short sentence");
  if (clean.length > 600) throw new Error("keep the seed under 600 characters - it is a seed, not a brief");
  const suffix = crypto.randomUUID().slice(0, 4);
  const id = `${slugify(clean) || "seed"}-${suffix}`;
  await env.DB.prepare(
    "INSERT INTO ideas (id, status, seed_text, origin) VALUES (?, 'seed', ?, 'seed')"
  ).bind(id, clean).run();
  return id;
}

/** The oldest seed waiting for research, or a promotion that stalled. */
export async function nextSeedToPromote(env) {
  const staleBefore = new Date(Date.now() - STALE_PROMOTE_MS).toISOString();
  return env.DB.prepare(
    "SELECT * FROM ideas WHERE status = 'seed' OR (status = 'promoting' AND updated_at < ?) ORDER BY created_at ASC LIMIT 1"
  ).bind(staleBefore).first();
}

export async function markPromoting(env, id) {
  await env.DB.prepare("UPDATE ideas SET status = 'promoting', updated_at = ? WHERE id = ?").bind(now(), id).run();
}

/** A promotion that threw: put the row back how it was (a seed stays a
 *  seed, a draft keeps its draft) and record the error. Touches nothing
 *  else, so a failed re-research never erases an existing draft. */
export async function failPromotion(env, id, originalStatus, error) {
  const status = originalStatus === "promoting" || originalStatus === "seed" ? "seed" : originalStatus;
  const notes = JSON.stringify({ lastError: String(error), at: now() });
  await env.DB.prepare("UPDATE ideas SET status = ?, notes = ?, updated_at = ? WHERE id = ?").bind(status, notes, now(), id).run();
}

/** Store the result of promote.js: a drafted entry, or why there isn't one. */
export async function savePromotion(env, id, { status, idea, verification, notes }) {
  const ideaJson = idea ? JSON.stringify(idea) : null;
  const verificationJson = verification ? JSON.stringify(verification) : null;
  await env.DB.prepare(
    "UPDATE ideas SET status = ?, idea_json = ?, verification_json = ?, notes = ?, updated_at = ? WHERE id = ?"
  ).bind(status, ideaJson, verificationJson, JSON.stringify(notes || {}), now(), id).run();
}

/**
 * The owner's decision. Approval runs the same validation as the build, so
 * a drafted entry cannot reach the rotation with a broken capital plan, an
 * unlinked competitor or no sources.
 * @returns {{ ok: boolean, errors?: string[], warning?: string }}
 */
export async function decide(env, id, decision, note) {
  const row = await getRow(env, id);
  if (!row) return { ok: false, errors: [`no idea "${id}"`] };
  const allowed = { approve: "verified", hold: "held", reject: "rejected" };
  const status = allowed[decision];
  if (!status) return { ok: false, errors: ["decision must be approve, hold or reject"] };

  let warning = null;
  let verificationJson = row.verification_json;

  if (decision === "approve") {
    const idea = rowToIdea({ ...row, status: "verified" });
    const errors = validateIdea(idea);
    if (errors.length) return { ok: false, errors };

    // Keep the pool from turning into one category.
    const pool = (await loadPool(env)).filter(isSelectable);
    const after = pool.filter((i) => i.id !== id).concat([idea]);
    const share = after.filter((i) => i.category === idea.category).length / after.length;
    if (share > CATEGORY_SHARE_WARNING) {
      warning = `${idea.category} would be ${Math.round(share * 100)}% of the selectable pool.`;
    }
  }

  if (verificationJson) {
    const v = JSON.parse(verificationJson);
    v.status = status === "rejected" ? v.status : status;
    if (note) v.openItems = decision === "hold" ? [...(v.openItems || []), note] : v.openItems;
    if (decision === "approve") v.approvedAt = now();
    verificationJson = JSON.stringify(v);
  }

  await env.DB.prepare(
    "UPDATE ideas SET status = ?, verification_json = ?, decided_at = ?, updated_at = ? WHERE id = ?"
  ).bind(status, verificationJson, now(), now(), id).run();
  return { ok: true, status, warning };
}
