// index.js
// Thin orchestrator. No business logic lives here.
//
// Both entry points - the cron trigger and the Bearer-authed /refresh
// endpoint - call runPipeline(). Exactly the same function, no exceptions.
// Everything a visitor sees is read live from R2, never from the deploy
// bundle. Only verified pool entries are ever selected (pool.js), and every
// script is fact-checked against its sources before audio (script.js).

import { isSelectable } from "./pool.js";
import { loadPool } from "./pool-store.js";
import { pickIdea, dateKeyFor, isValidDateKey } from "./selection.js";
import { generateScript } from "./script.js";
import { narrate, formatDuration, WORDS_PER_MINUTE } from "./tts.js";
import { buildCoverSvg } from "./art.js";
import { buildRss, SHOW } from "./rss.js";
import { scoreIdea } from "./score.js";
import { generateKit, kitMarkdown } from "./kit.js";
import { KEYS, REVALIDATE, SHORT, MANIFEST_LIMIT, readJson, writeJson, json, manifestSummary } from "./store.js";
import { bearerOk } from "./auth.js";
import { handleAdminApi, handleAct } from "./admin.js";
import { handleReactions } from "./reactions.js";
import { runMaintenance, reviewQueue } from "./maintenance.js";
import { notifyOwner } from "./notify.js";

// A full run - brief, fact-check, rewrite, audio, kit - takes minutes, so
// the lock has to outlive it or a second trigger could take over a run in
// progress. 15 minutes is the scheduled handler's own wall-clock limit.
const LOCK_TTL_MS = 15 * 60_000;

// ---------------------------------------------------------------- helpers

/** Attribute-safe HTML escaping for the server-side meta-tag rewrite below. */
function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Conditional-write lock. Prevents a cron firing while a manual test is
 *  mid-run from corrupting the rotation state (spec gotcha 14). */
async function acquireLock(env, dateKey) {
  const existing = await env.PODCAST_BUCKET.get(KEYS.lock(dateKey));
  if (existing) {
    const started = Number(await existing.text());
    if (Date.now() - started < LOCK_TTL_MS) return false;
    await env.PODCAST_BUCKET.delete(KEYS.lock(dateKey));
  }
  const put = await env.PODCAST_BUCKET.put(KEYS.lock(dateKey), String(Date.now()), {
    onlyIf: { etagDoesNotMatch: "*" }
  });
  return put !== null;
}

async function releaseLock(env, dateKey) {
  try {
    await env.PODCAST_BUCKET.delete(KEYS.lock(dateKey));
  } catch (err) {
    console.log(`lock release failed for ${dateKey}: ${err.message}`);
  }
}

// --------------------------------------------------------------- pipeline

/** Only what a reader needs from the audit record - no internal notes.
 *  Also used by scripts/backfill-archive.mjs. */
export function publicVerification(idea) {
  const v = idea.verification || {};
  return {
    status: v.status || "unverified",
    lastVerified: v.lastVerified || null,
    competitors: (v.competitors || []).map(({ name, url, kind, overlap, note }) => ({ name, url, kind, overlap, note })),
    sources: (v.sources || []).map(({ claim, url, publisher }) => ({ claim, url, publisher }))
  };
}

function factCheckStatus(review) {
  if (!review || (review.error && review.rounds.length === 0)) return "unchecked";
  if (review.cut && review.cut.length > 0) return "cut";
  if (review.revised) return "revised";
  return "passed";
}

/**
 * Everything up to the audio, with nothing written: no ElevenLabs call, no
 * R2 writes, no rotation change. The safe way to see what a run would do -
 * including the fact-check - before the cron does it for real. Pass an
 * idea id to test a specific entry, held ones included.
 */
async function dryRun(env, dateKey, ideaId) {
  try {
    const pool = await loadPool(env);
    let idea;
    if (ideaId) {
      idea = pool.find((i) => i.id === ideaId);
      if (!idea) return { ok: false, dryRun: true, error: `no idea "${ideaId}" in the pool` };
    } else {
      const rotation = await readJson(env, KEYS.rotation, { used: [], recentCategories: [] });
      idea = pickIdea(dateKey, rotation, pool).idea;
    }

    const script = await generateScript(env, idea, dateKey);
    let validationKit = null;
    let kitError = null;
    try {
      validationKit = await generateKit(env, idea);
    } catch (err) {
      kitError = err.message;
    }

    return {
      ok: true,
      dryRun: true,
      date: dateKey,
      idea: { id: idea.id, title: idea.title, status: idea.verification ? idea.verification.status : "unverified" },
      score: scoreIdea(idea),
      wordCount: script.wordCount,
      factCheck: { status: factCheckStatus(script.review), ...script.review },
      sections: script.sections,
      validationKit,
      kitError
    };
  } catch (err) {
    return { ok: false, dryRun: true, date: dateKey, error: err.message };
  }
}

/**
 * The one function both entry points call.
 * @param {object} env
 * @param {object} opts { dateKey?: string, force?: boolean, dryRun?: boolean, ideaId?: string }
 */
export async function runPipeline(env, opts = {}) {
  const startedAt = Date.now();
  const dateKey = opts.dateKey || dateKeyFor(new Date());

  if (!isValidDateKey(dateKey)) {
    return { ok: false, error: `invalid date "${dateKey}", expected YYYY-MM-DD` };
  }

  if (opts.dryRun) return dryRun(env, dateKey, opts.ideaId);

  const existingObj = await env.PODCAST_BUCKET.get(KEYS.episode(dateKey));
  const existing = existingObj ? await existingObj.json() : null;
  if (existing && !opts.force) {
    return { ok: true, skipped: "already generated", date: dateKey, episode: existing };
  }

  if (!(await acquireLock(env, dateKey))) {
    return { ok: false, error: "another run is in progress for this date", date: dateKey };
  }

  try {
    // 1. Pick the topic. Usage tracked in R2, never in code.
    const pool = await loadPool(env);
    let idea;
    let state = null;
    let cycleReset = false;

    if (existing) {
      // A forced re-run regenerates the SAME business. Going back through
      // the rotation would pick a different idea (this date's idea is
      // already marked used), swap the topic under a published transcript,
      // and burn a second pool entry.
      idea = pool.find((i) => i.id === existing.ideaId);
      if (!idea) throw new Error(`episode ${dateKey} used idea "${existing.ideaId}", which is no longer in the pool`);
    } else {
      const rotation = await readJson(env, KEYS.rotation, { used: [], recentCategories: [] });
      ({ idea, state, cycleReset } = pickIdea(dateKey, rotation, pool));
    }

    // Computed entirely from vetted pool fields and the verification record -
    // never regenerated by the model, so the same idea always scores the
    // same (score.js).
    const score = scoreIdea(idea);

    // 2. Generate the script, fact-checked against the same grounded
    // material. Word count computed in code from real text.
    const script = await generateScript(env, idea, dateKey);

    // 3. Generate the audio. Speech gets the version with SSML pause tags;
    // the transcript and word count stay on the clean version - a reader
    // should never see "<break time=...>" in the archived text. Duration is
    // measured from the MP3 that comes back.
    const audio = await narrate(env, script.narrationForSpeech, script.wordCount);

    // 4. Optional extras. Must never block the episode.
    let artKey = null;
    try {
      const svg = buildCoverSvg(idea, dateKey);
      await env.PODCAST_BUCKET.put(KEYS.art(dateKey), svg, {
        httpMetadata: { contentType: "image/svg+xml", cacheControl: REVALIDATE }
      });
      artKey = KEYS.art(dateKey);
    } catch (err) {
      console.log(`cover art failed for ${dateKey}, shipping without it: ${err.message}`);
    }

    let validationKit = null;
    try {
      validationKit = await generateKit(env, idea);
    } catch (err) {
      console.log(`validation kit failed for ${dateKey}, shipping without it: ${err.message}`);
    }

    // The fact-check log is private: it quotes rejected sentences, which
    // should never be served as if they were part of the brief.
    try {
      await writeJson(env, KEYS.review(dateKey), { date: dateKey, ideaId: idea.id, ...script.review });
    } catch (err) {
      console.log(`review log write failed for ${dateKey}: ${err.message}`);
    }

    // 5. Write everything. This is the step that has to succeed.
    await env.PODCAST_BUCKET.put(KEYS.audio(dateKey), audio.audio, {
      httpMetadata: { contentType: "audio/mpeg", cacheControl: REVALIDATE }
    });

    const verification = publicVerification(idea);
    const episode = {
      date: dateKey,
      ideaId: idea.id,
      title: idea.title,
      category: idea.category,
      thesis: idea.thesis,
      customer: idea.customer,
      competitors: idea.competitors,
      complexity: idea.complexity,
      complexityWhy: idea.complexityWhy,
      capital: idea.capital,
      firstNinety: idea.firstNinety,
      claudeRole: idea.claudeRole,
      moat: idea.moat,
      sourceNotes: idea.sourceNotes,
      opportunityType: idea.opportunityType,
      score,
      verification,
      lastVerified: verification.lastVerified,
      corrections: existing && Array.isArray(existing.corrections) ? existing.corrections : [],
      factCheck: { status: factCheckStatus(script.review), model: script.review.model },
      sections: script.sections,
      bearCase: script.sections.bearCase,
      assumptions: script.sections.assumptions,
      verdict: script.sections.verdict,
      validationKit,
      transcript: script.narration,
      pullQuote: script.sections.pullQuote || idea.thesis,
      tags: script.sections.tags || [],
      wordCount: script.wordCount,
      pitchWordCount: script.pitchWordCount,
      tightened: script.retried,
      overBudget: script.overBudget,
      durationSeconds: audio.durationSeconds,
      durationLabel: formatDuration(audio.durationSeconds),
      durationMeasured: audio.durationMeasured,
      durationEstimatedSeconds: audio.estimatedDurationSeconds,
      wordsPerMinuteUsed: Number(env.WORDS_PER_MINUTE || WORDS_PER_MINUTE),
      audioBytes: audio.byteLength,
      audioBlocks: audio.blocks,
      narratorSpeed: audio.speed,
      artUrl: artKey ? `/art/${dateKey}.svg` : null,
      audioUrl: `/audio/${dateKey}.mp3`,
      generatedAt: new Date().toISOString(),
      generationMs: Date.now() - startedAt
    };

    await writeJson(env, KEYS.episode(dateKey), episode);

    const manifest = await readJson(env, KEYS.manifest, { episodes: [] });
    const summary = manifestSummary(episode);
    const episodes = [summary, ...manifest.episodes.filter((e) => e.date !== dateKey)]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, MANIFEST_LIMIT);

    await writeJson(env, KEYS.manifest, { episodes, updatedAt: new Date().toISOString() });
    if (state) await writeJson(env, KEYS.rotation, state);

    return {
      ok: true,
      date: dateKey,
      rerun: Boolean(existing),
      cycleReset,
      remainingInPool: state ? state.remaining : null,
      episode: {
        ...summary,
        wordCount: episode.wordCount,
        pitchWordCount: episode.pitchWordCount,
        tightened: episode.tightened,
        overBudget: episode.overBudget,
        factCheck: episode.factCheck,
        validationKit: Boolean(validationKit),
        audioUrl: episode.audioUrl,
        artUrl: episode.artUrl,
        generationMs: episode.generationMs
      }
    };
  } catch (err) {
    console.log(`pipeline failed for ${dateKey}: ${err.stack || err.message}`);
    return { ok: false, date: dateKey, error: err.message };
  } finally {
    await releaseLock(env, dateKey);
  }
}

// ----------------------------------------------------------------- serving

/** Range support is required by Apple Podcasts' playback stack
 *  (spec gotcha 8). "Plays in a browser audio tag" proves nothing. */
async function serveObject(env, key, contentType, request) {
  const range = request.headers.get("Range");

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (match) {
      const head = await env.PODCAST_BUCKET.head(key);
      if (!head) return new Response("Not found", { status: 404 });

      const size = head.size;
      let start = match[1] === "" ? null : Number(match[1]);
      let end = match[2] === "" ? null : Number(match[2]);

      if (start === null && end !== null) {
        start = Math.max(size - end, 0);
        end = size - 1;
      } else {
        if (start === null) start = 0;
        if (end === null || end >= size) end = size - 1;
      }

      if (start >= size || start > end) {
        return new Response("Range not satisfiable", {
          status: 416,
          headers: { "content-range": `bytes */${size}` }
        });
      }

      const obj = await env.PODCAST_BUCKET.get(key, {
        range: { offset: start, length: end - start + 1 }
      });
      if (!obj) return new Response("Not found", { status: 404 });

      return new Response(obj.body, {
        status: 206,
        headers: {
          "content-type": contentType,
          "content-range": `bytes ${start}-${end}/${size}`,
          "content-length": String(end - start + 1),
          "accept-ranges": "bytes",
          "cache-control": REVALIDATE,
          etag: head.httpEtag
        }
      });
    }
  }

  const obj = await env.PODCAST_BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  return new Response(obj.body, {
    headers: {
      "content-type": contentType,
      "content-length": String(obj.size),
      "accept-ranges": "bytes",
      "cache-control": REVALIDATE,
      etag: obj.httpEtag
    }
  });
}

// ------------------------------------------------------------------ worker

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = env.PUBLIC_ORIGIN || url.origin;

    // One-tap links from the publish email. Confirmation on GET, action on
    // POST (admin.js).
    if (path === "/act") return handleAct(request, env);

    // Owner API for /admin.html and scripts (session cookie or Bearer).
    const adminResponse = await handleAdminApi(request, env, path);
    if (adminResponse) return adminResponse;

    // Listener pursue / watch / pass.
    const reactionResponse = await handleReactions(request, env, path);
    if (reactionResponse) return reactionResponse;

    // Manual trigger. Bearer only - never a query-string secret.
    if (path === "/refresh") {
      if (!bearerOk(request, env)) {
        return json({ ok: false, error: "unauthorized" }, 401);
      }
      const asOf = url.searchParams.get("asOf");
      const force = url.searchParams.get("force") === "1";
      const dryRun = url.searchParams.get("dryRun") === "1";
      const ideaId = url.searchParams.get("idea") || undefined;
      const result = await runPipeline(env, { dateKey: asOf || undefined, force, dryRun, ideaId });
      return json(result, result.ok ? 200 : 500);
    }

    // Diagnostics. Also authed - it reveals rotation state.
    if (path === "/status") {
      if (!bearerOk(request, env)) return json({ ok: false, error: "unauthorized" }, 401);
      const rotation = await readJson(env, KEYS.rotation, { used: [], recentCategories: [] });
      const manifest = await readJson(env, KEYS.manifest, { episodes: [] });
      const pool = await loadPool(env);
      const eligible = pool.filter(isSelectable);
      const used = new Set(rotation.used || []);
      const byStatus = {};
      for (const i of pool) {
        const st = (i.verification && i.verification.status) || "unverified";
        byStatus[st] = (byStatus[st] || 0) + 1;
      }
      return json({
        ok: true,
        poolSize: eligible.length,
        used: eligible.filter((i) => used.has(i.id)).length,
        remaining: eligible.filter((i) => !used.has(i.id)).length,
        poolByStatus: byStatus,
        notSelectable: pool
          .filter((i) => !isSelectable(i))
          .map((i) => ({ id: i.id, status: i.verification ? i.verification.status : "unverified" })),
        recentCategories: rotation.recentCategories,
        episodeCount: manifest.episodes.length,
        latest: manifest.episodes[0] || null,
        wordsPerMinute: Number(env.WORDS_PER_MINUTE || WORDS_PER_MINUTE)
      });
    }

    if (path === "/api/episodes.json") {
      const manifest = await readJson(env, KEYS.manifest, { episodes: [] });
      return json({ show: { title: SHOW.title, subtitle: SHOW.subtitle }, ...manifest });
    }

    const episodeMatch = /^\/api\/episode\/(\d{4}-\d{2}-\d{2})\.json$/.exec(path);
    if (episodeMatch) {
      const ep = await readJson(env, KEYS.episode(episodeMatch[1]), null);
      return ep ? json(ep) : json({ ok: false, error: "no episode for that date" }, 404);
    }

    const audioMatch = /^\/audio\/(\d{4}-\d{2}-\d{2})\.mp3$/.exec(path);
    if (audioMatch) return serveObject(env, KEYS.audio(audioMatch[1]), "audio/mpeg", request);

    const artMatch = /^\/art\/(\d{4}-\d{2}-\d{2})\.svg$/.exec(path);
    if (artMatch) return serveObject(env, KEYS.art(artMatch[1]), "image/svg+xml", request);

    if (path === "/cover/show.jpg") return serveObject(env, "cover/show.jpg", "image/jpeg", request);

    if (path === "/rss.xml" || path === "/feed.xml") {
      const manifest = await readJson(env, KEYS.manifest, { episodes: [] });
      return new Response(buildRss(manifest.episodes, origin), {
        headers: {
          "content-type": "application/rss+xml; charset=utf-8",
          "cache-control": SHORT
        }
      });
    }

    const kitMatch = /^\/kit\/(\d{4}-\d{2}-\d{2})\.md$/.exec(path);
    if (kitMatch) {
      const ep = await readJson(env, KEYS.episode(kitMatch[1]), null);
      if (!ep || !ep.validationKit) return new Response("Not found", { status: 404 });
      return new Response(kitMarkdown({ ...ep, origin }), {
        headers: {
          "content-type": "text/markdown; charset=utf-8",
          "content-disposition": `inline; filename="innovation-daily-kit-${ep.date}.md"`,
          "cache-control": REVALIDATE
        }
      });
    }

    if (path === "/transcript.txt" || /^\/transcript\/\d{4}-\d{2}-\d{2}\.txt$/.test(path)) {
      const d = path.split("/").pop().replace(".txt", "");
      const ep = await readJson(env, KEYS.episode(d), null);
      if (!ep) return new Response("Not found", { status: 404 });
      return new Response(`${ep.title}\n${ep.date}\n\n${ep.transcript}\n`, {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": REVALIDATE }
      });
    }

    // Bare date path (/2026-08-27) - additive alongside the existing hash
    // routing (#2026-08-27), not a replacement. Hash routing stays exactly
    // as it was for in-page archive navigation; this path exists only so a
    // shared link's <meta> tags reflect the actual episode when a social
    // crawler fetches it - crawlers don't run JS and don't see #fragments,
    // so client-side rendering alone can never produce a correct preview
    // here. If no episode exists for the date, fall through to the normal
    // SPA below rather than 404 - the client already handles "no brief for
    // this date" gracefully.
    const datePathMatch = /^\/(\d{4}-\d{2}-\d{2})$/.exec(path);
    if (datePathMatch) {
      const ep = await readJson(env, KEYS.episode(datePathMatch[1]), null);
      if (ep) {
        const assetRes = await env.ASSETS.fetch(new Request(`${origin}/`, request));
        let html = await assetRes.text();
        const title = `${ep.title} - Innovation Daily`;
        const desc = `${ep.pullQuote || ep.thesis} Score ${ep.score?.overall ?? "-"} of 100. About ${ep.capital.total.toLocaleString("en-US")} dollars to start (estimate).`;
        const pageUrl = `${origin}/${ep.date}`;

        html = html
          .replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escHtml(ep.title)}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escHtml(desc)}$2`)
          .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${escHtml(pageUrl)}$2`)
          .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escHtml(ep.title)}$2`)
          .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escHtml(desc)}$2`);
          // og:image / twitter:image intentionally left pointing at the
          // static show poster (/cover/show.jpg) - it's a guaranteed
          // raster image. Per-episode preview art would need a raster
          // (not SVG) generation step this pipeline doesn't have yet.

        return new Response(html, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": SHORT }
        });
      }
    }

    // Everything else falls through to the static single-page site, which
    // fetches its own data from the JSON API above.
    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        const result = await runPipeline(env);
        console.log(`cron run: ${JSON.stringify(result)}`);

        // Seeds, kits for older episodes, due 90-day revisits. Never
        // touches the episode above, and never throws out of here.
        const maintenance = await runMaintenance(env);
        console.log(`maintenance: ${JSON.stringify(maintenance)}`);

        try {
          const queue = await reviewQueue(env);
          const sent = await notifyOwner(env, env.PUBLIC_ORIGIN, result, maintenance, queue);
          console.log(`notify: ${JSON.stringify(sent)}`);
        } catch (err) {
          console.log(`notify failed: ${err.stack || err.message}`);
        }
      })()
    );
  }
};
