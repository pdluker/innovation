// One-time archive migration, 2026-09-27. Brings every published episode up
// to what new episodes carry, without touching the audio or the transcript:
//   - durationSeconds measured from the MP3 itself (the old values came from
//     an assumed 140 wpm and ran about 27 percent long)
//   - Innovation Score v2, recomputed from the corrected pool
//   - the verification record: sources, competitor links, check date
//   - current competitor names, sourcing note and moat from the corrected pool
//   - a correction note wherever a claim in the episode failed verification
//
//   node scripts/backfill-archive.mjs            dry run: writes the new JSON
//                                                to .backfill/ and prints a diff
//   node scripts/backfill-archive.mjs --apply    backs up every original to
//                                                R2 backup/<date>/, then writes
//
// Run with wrangler logged in. Reads and writes the production bucket.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { bundledPool } from "../pool.js";
import { scoreIdea } from "../score.js";
import { mp3DurationSeconds, formatDuration } from "../tts.js";
import { publicVerification } from "../index.js";
import { manifestSummary } from "../store.js";

const BUCKET = "innovation-daily";
const ORIGIN = "https://innovation.stluker.com";
const RUN_DATE = "2026-09-27";
const APPLY = process.argv.includes("--apply");
const OUT = path.resolve(".backfill");
const JSON_CC = "public, max-age=60, must-revalidate";

fs.mkdirSync(path.join(OUT, "original"), { recursive: true });
fs.mkdirSync(path.join(OUT, "updated"), { recursive: true });

// Run wrangler's own entry point with this node, never through a shell: a
// shell splits values like "public, max-age=60, must-revalidate" into
// separate arguments, and wrangler then refuses the upload.
const WRANGLER_JS = path.resolve("node_modules", "wrangler", "bin", "wrangler.js");

function wrangler(args, opts = {}) {
  return execFileSync(process.execPath, [WRANGLER_JS, ...args], {
    encoding: opts.binary ? "buffer" : "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function r2Get(key) {
  return wrangler(["r2", "object", "get", `${BUCKET}/${key}`, "--remote", "--pipe"], { binary: true });
}

function r2PutJson(key, file) {
  wrangler(["r2", "object", "put", `${BUCKET}/${key}`, `--file=${file}`, "--content-type=application/json; charset=utf-8", `--cache-control=${JSON_CC}`, "--remote"]);
}

const pool = new Map(bundledPool().map((i) => [i.id, i]));
const manifest = JSON.parse(r2Get("episodes/index.json").toString("utf8"));
fs.writeFileSync(path.join(OUT, "original", "index.json"), JSON.stringify(manifest, null, 2));

const updated = [];
for (const row of manifest.episodes) {
  const d = row.date;
  const ep = JSON.parse(r2Get(`episodes/${d}.json`).toString("utf8"));
  fs.writeFileSync(path.join(OUT, "original", `${d}.json`), JSON.stringify(ep, null, 2));

  const idea = pool.get(ep.ideaId);
  if (!idea) throw new Error(`${d}: idea ${ep.ideaId} is not in the pool - refusing to guess`);

  // Measure the real length from the stored audio.
  const audio = new Uint8Array(r2Get(`audio/${d}.mp3`));
  if (audio.length !== ep.audioBytes) throw new Error(`${d}: audio is ${audio.length} bytes, episode says ${ep.audioBytes}`);
  const measured = Math.round(mp3DurationSeconds(audio));
  if (!(measured > 60)) throw new Error(`${d}: measured duration ${measured}s is implausible`);

  const verification = publicVerification(idea);
  const corrections = ((idea.verification && idea.verification.corrections) || [])
    .filter((c) => c.date === d)
    .map((c) => ({ date: RUN_DATE, text: c.text }));

  const next = {
    ...ep,
    competitors: idea.competitors,
    sourceNotes: idea.sourceNotes,
    moat: idea.moat,
    score: scoreIdea(idea),
    verification,
    lastVerified: verification.lastVerified,
    corrections,
    factCheck: ep.factCheck || { status: "predates-check", model: null },
    durationEstimatedSeconds: ep.durationEstimatedSeconds ?? ep.durationSeconds,
    durationSeconds: measured,
    durationLabel: formatDuration(measured),
    durationMeasured: true,
    migratedAt: `${RUN_DATE}: measured duration, score v2, verification record, corrections`
  };
  fs.writeFileSync(path.join(OUT, "updated", `${d}.json`), JSON.stringify(next));
  updated.push(next);

  console.log(
    `${d}  ${ep.ideaId.padEnd(32)} duration ${String(ep.durationSeconds).padStart(3)}s -> ${String(measured).padStart(3)}s` +
    `  score ${String(ep.score.overall).padStart(3)} ${ep.score.band.padEnd(11)} -> ${String(next.score.overall).padStart(3)} ${next.score.band.padEnd(11)}` +
    `  sources ${verification.sources.length}  corrections ${corrections.length}` +
    (JSON.stringify(ep.competitors) !== JSON.stringify(next.competitors) ? "  competitors renamed" : "")
  );
}

const nextManifest = {
  episodes: updated.map(manifestSummary).sort((a, b) => (a.date < b.date ? 1 : -1)),
  updatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(OUT, "updated", "index.json"), JSON.stringify(nextManifest));

if (!APPLY) {
  console.log(`\nDry run. New JSON is in ${OUT}/updated. Re-run with --apply to write it.`);
  process.exit(0);
}

console.log("\nBacking up originals to R2...");
for (const f of fs.readdirSync(path.join(OUT, "original"))) {
  r2PutJson(`backup/${RUN_DATE}/episodes/${f}`, path.join(OUT, "original", f));
}
console.log("Writing updated episodes...");
for (const ep of updated) r2PutJson(`episodes/${ep.date}.json`, path.join(OUT, "updated", `${ep.date}.json`));
console.log("Writing manifest last...");
r2PutJson("episodes/index.json", path.join(OUT, "updated", "index.json"));

// Read back through the live site, not the bucket - what listeners get.
const live = await (await fetch(`${ORIGIN}/api/episodes.json`, { headers: { "cache-control": "no-cache" } })).json();
const ok = live.episodes.length === updated.length && live.episodes.every((e) => e.scoreVersion === 2);
console.log(ok ? `Done. ${live.episodes.length} episodes live with score v2.` : "WARNING: live manifest does not match - check before anything else runs.");
