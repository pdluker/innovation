// maintenance.js
// Work that runs after each scheduled episode, inside the same 15-minute
// window. Every step is independent and bounded, and a failure in one is
// recorded and skipped - it never touches the episode that just published.
//
//   1. Research the oldest waiting seed (promote.js) -> needs-review
//   2. Add validation kits to up to KITS_PER_RUN older episodes
//   3. Write any 90-day revisits that have come due (revisit.js)

import { KEYS, readJson, writeJson, updateManifestRow } from "./store.js";
import { loadPool, listIdeas, nextSeedToPromote, markPromoting, savePromotion, failPromotion } from "./pool-store.js";
import { promoteSeed } from "./promote.js";
import { generateKit } from "./kit.js";
import { dueForRevisit, revisitEpisode } from "./revisit.js";

const KITS_PER_RUN = 3;
const REVISITS_PER_RUN = 1;

export async function promotePending(env) {
  if (!env.DB) return null;
  const row = await nextSeedToPromote(env);
  if (!row) return null;
  await markPromoting(env, row.id);
  try {
    const result = await promoteSeed(env, row);
    await savePromotion(env, row.id, result);
    return { id: row.id, status: result.status };
  } catch (err) {
    // Back how it was, so the next run retries it and no draft is lost.
    await failPromotion(env, row.id, row.status, err.message);
    throw err;
  }
}

/** Kits for episodes published before kits existed, oldest first. */
export async function backfillKits(env, limit = KITS_PER_RUN) {
  const manifest = await readJson(env, KEYS.manifest, { episodes: [] });
  const missing = manifest.episodes.filter((e) => !e.hasKit).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, limit);
  if (!missing.length) return [];
  const pool = await loadPool(env);
  const done = [];
  for (const row of missing) {
    const ep = await readJson(env, KEYS.episode(row.date), null);
    if (!ep || ep.validationKit) continue;
    const idea = pool.find((i) => i.id === ep.ideaId);
    if (!idea) continue;
    ep.validationKit = await generateKit(env, idea);
    await writeJson(env, KEYS.episode(ep.date), ep);
    await updateManifestRow(env, ep);
    done.push(ep.date);
  }
  return done;
}

export async function runDueRevisits(env, today = new Date(), limit = REVISITS_PER_RUN) {
  const manifest = await readJson(env, KEYS.manifest, { episodes: [] });
  const due = dueForRevisit(manifest.episodes, today, limit);
  const done = [];
  for (const row of due) {
    const ep = await readJson(env, KEYS.episode(row.date), null);
    if (!ep || ep.revisit) continue;
    ep.revisit = await revisitEpisode(env, ep, today.toISOString().slice(0, 10));
    await writeJson(env, KEYS.episode(ep.date), ep);
    await updateManifestRow(env, ep);
    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO outcomes (episode_date, idea_id, checked_at, call_held_up, summary, findings_json) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(episode_date) DO UPDATE SET checked_at = excluded.checked_at, call_held_up = excluded.call_held_up,
           summary = excluded.summary, findings_json = excluded.findings_json`
      ).bind(ep.date, ep.ideaId, ep.revisit.checkedAt, ep.revisit.callHeldUp, ep.revisit.summary, JSON.stringify(ep.revisit.findings)).run();
    }
    done.push(ep.date);
  }
  return done;
}

export async function runMaintenance(env, today = new Date()) {
  const out = { promoted: null, kits: [], revisits: [], errors: [] };
  const step = async (name, fn, key) => {
    try {
      out[key] = await fn();
    } catch (err) {
      out.errors.push(`${name}: ${err.message}`);
      console.log(`maintenance ${name} failed: ${err.stack || err.message}`);
    }
  };
  await step("promote", () => promotePending(env), "promoted");
  await step("kits", () => backfillKits(env), "kits");
  await step("revisits", () => runDueRevisits(env, today), "revisits");
  return out;
}

/** Ideas waiting on the owner, for the publish email and the review screen. */
export async function reviewQueue(env) {
  if (!env.DB) return [];
  const rows = await listIdeas(env);
  return rows
    .filter((r) => ["needs-review", "held", "insufficient"].includes(r.status))
    .map((r) => ({ id: r.id, status: r.status, title: r.idea ? r.idea.title : null, seedText: r.seedText }));
}
