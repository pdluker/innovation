// store.js
// The R2 layout and the two JSON helpers every module shares. Everything a
// visitor sees is read live from here, never from the deploy bundle.

export const KEYS = {
  rotation: "state/rotation.json",
  manifest: "episodes/index.json",
  episode: (d) => `episodes/${d}.json`,
  audio: (d) => `audio/${d}.mp3`,
  art: (d) => `art/${d}.svg`,
  review: (d) => `reviews/${d}.json`,
  lock: (d) => `locks/run-${d}`
};

// Regenerated content at a stable, date-keyed URL. NOT immutable - an
// immutable header would tell every podcast app to never re-check, so a
// forced re-run would silently never reach anyone who already fetched
// (spec gotcha 13).
export const REVALIDATE = "public, max-age=86400, must-revalidate";
export const SHORT = "public, max-age=60, must-revalidate";

export const MANIFEST_LIMIT = 400;

export async function readJson(env, key, fallback) {
  const obj = await env.PODCAST_BUCKET.get(key);
  if (!obj) return fallback;
  try {
    return await obj.json();
  } catch {
    return fallback;
  }
}

export async function writeJson(env, key, value) {
  await env.PODCAST_BUCKET.put(key, JSON.stringify(value), {
    httpMetadata: { contentType: "application/json; charset=utf-8", cacheControl: SHORT }
  });
}

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": SHORT, ...headers }
  });
}

/** The archive row for one episode. Also used by the backfill script, so
 *  old and new rows always carry the same fields. */
export function manifestSummary(episode) {
  return {
    date: episode.date,
    title: episode.title,
    category: episode.category,
    thesis: episode.thesis,
    pullQuote: episode.pullQuote,
    complexity: episode.complexity,
    capitalTotal: episode.capital.total,
    competitors: episode.competitors,
    durationSeconds: episode.durationSeconds,
    durationLabel: episode.durationLabel,
    audioBytes: episode.audioBytes,
    tags: episode.tags,
    score: episode.score.overall,
    band: episode.score.band,
    scoreVersion: episode.score.version || 1,
    opportunityType: episode.opportunityType,
    verdict: episode.verdict,
    lastVerified: episode.lastVerified || null,
    hasCorrections: Array.isArray(episode.corrections) && episode.corrections.length > 0,
    hasKit: Boolean(episode.validationKit),
    hasRevisit: Boolean(episode.revisit)
  };
}

/** Rewrite one row of the manifest in place (after a kit or revisit lands). */
export async function updateManifestRow(env, episode) {
  const manifest = await readJson(env, KEYS.manifest, { episodes: [] });
  const episodes = manifest.episodes.map((e) => (e.date === episode.date ? manifestSummary(episode) : e));
  await writeJson(env, KEYS.manifest, { episodes, updatedAt: new Date().toISOString() });
}
