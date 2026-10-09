// Offline sanity check. No network, no secrets. Run before every deploy.
import { IDEAS } from "../ideas-source.js";
import { VERIFICATION } from "../verification.js";
import { bundledPool, validateIdea, isSelectable } from "../pool.js";
import { pickIdea, dateKeyFor } from "../selection.js";
import { buildCoverSvg } from "../art.js";
import { buildRss, DISCLAIMER } from "../rss.js";
import { speakable, formatDuration, sumBreakSeconds, mp3DurationSeconds } from "../tts.js";
import { assembleNarration, assembleForSpeech, countWords, toAscii, groundedMaterial, cutSentences } from "../script.js";
import { scoreIdea, BANDS } from "../score.js";
import { kitMarkdown } from "../kit.js";

let fail = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fail++; };

const POOL = bundledPool();
const ELIGIBLE = POOL.filter(isSelectable);

// ---- the verification gate
const invalid = POOL.map((i) => [i.id, validateIdea(i)]).filter(([, errs]) => errs.length);
for (const [id, errs] of invalid) console.log(`      ${id}: ${errs.join("; ")}`);
ok(invalid.length === 0, `every pool entry passes validation (${POOL.length} entries)`);
ok(IDEAS.every((i) => VERIFICATION[i.id]), "every idea has a verification record");
ok(Object.keys(VERIFICATION).every((id) => IDEAS.some((i) => i.id === id)), "no orphan verification records");
ok(new Set(IDEAS.map((i) => i.id)).size === IDEAS.length, "all ids unique");
ok(ELIGIBLE.length >= 20, `${ELIGIBLE.length} verified ideas are selectable`);
const held = POOL.filter((i) => i.verification.status !== "verified").map((i) => i.id);
ok(held.every((id) => !ELIGIBLE.some((i) => i.id === id)), `held / needs-review ideas are not selectable (${held.join(", ") || "none"})`);

// Non-ASCII would silently corrupt across a PowerShell 5.1 boundary.
const bad = POOL.filter((i) => /[^\x20-\x7E]/.test(JSON.stringify(i)));
ok(bad.length === 0, `pool and verification records are pure ASCII${bad.length ? " -> " + bad.map((b) => b.id).join(",") : ""}`);

// ---- score v2
const scores = POOL.map((i) => [i, scoreIdea(i)]);
ok(scores.every(([, s]) => s.overall >= 0 && s.overall <= 100 && s.version === 2), "every score is v2 and in range 0-100");
ok(scores.every(([, s]) => BANDS.some((b) => b.band === s.band)), "every band is one of the four labels");
ok(scores.every(([i, s]) => i.defensibility !== 1 || ["Speculative", "Weak"].includes(s.band)), "a moat of 1 never rates above Speculative");
ok(scores.every(([i, s]) => i.defensibility !== 2 || s.band !== "Strong"), "a moat of 2 never rates Strong");
ok(scores.every(([i, s]) => BANDS.find((b) => b.band === s.band).min <= s.overall), "number and band agree");
ok(scoreIdea(POOL[0]).overall === scoreIdea(POOL[0]).overall, "score is deterministic - same idea scores the same every time");
const crowded = { ...POOL[0], verification: { ...POOL[0].verification, competitors: POOL[0].verification.competitors.map((c) => ({ ...c, overlap: "direct", kind: "funded" })) } };
const open = { ...POOL[0], verification: { ...POOL[0].verification, competitors: POOL[0].verification.competitors.map((c) => ({ ...c, overlap: "adjacent" })) } };
ok(scoreIdea(crowded).components.roomToEnter < scoreIdea(open).components.roomToEnter, "more funded direct competitors lowers roomToEnter (crowding is a penalty)");

// ---- selection: full rotation over verified ideas only, then a clean reset
let state = { used: [], recentCategories: [] };
const seen = new Set();
let resets = 0;
for (let d = 0; d < ELIGIBLE.length + 3; d++) {
  const key = dateKeyFor(new Date(Date.UTC(2026, 8, 1 + d, 12)));
  const r = pickIdea(key, state, POOL);
  state = r.state;
  ok(isSelectable(r.idea), `day ${d + 1} picked a verified idea`) || null;
  if (r.cycleReset) resets++; else seen.add(r.idea.id);
}
ok(seen.size === ELIGIBLE.length, `rotation covered all ${ELIGIBLE.length} verified ideas before reset`);
ok(resets === 1, "pool reset exactly once instead of erroring out");
ok(held.every((id) => !seen.has(id)), "a held idea was never picked across a full rotation");
const s0 = { used: [], recentCategories: [] };
ok(pickIdea("2026-09-01", s0, POOL).idea.id === pickIdea("2026-09-01", s0, POOL).idea.id, "selection is deterministic per date");
ok(dateKeyFor(new Date("2026-09-02T02:30:00Z")) === "2026-09-01", "date key respects America/Chicago");

// ---- grounded material carries the verified sources to the writer and checker
const material = groundedMaterial(POOL.find((i) => i.id === "spec-to-takeoff"));
ok(material.includes("VERIFIED SOURCES"), "grounded material lists verified sources");
ok(material.includes("CFMA's Benchmarker publishes contractor financial ratios"), "grounded material states what each source actually supports");
ok(!/bid-hit/.test(material), "the retracted CFMA bid-hit-rate claim is gone from the material");

// ---- cut fallback removes exactly the flagged sentence
const cut = cutSentences(
  { bluf: "First claim holds. The CFMA data confirms everything. Last line.", verdict: "Pass.", assumptions: [] },
  [{ sentence: "The CFMA data confirms everything.", problem: "attribution-not-in-sources" }]
);
ok(cut.sections.bluf === "First claim holds. Last line." && cut.cut.length === 1, "a twice-flagged sentence is cut before audio");

// ---- art, feed, audio helpers
const svg = buildCoverSvg(POOL[0], "2026-09-01");
ok(svg.startsWith("<svg") && svg.includes("</svg>"), "cover svg renders");

const rss = buildRss([{
  date: "2026-09-01", title: POOL[0].title, thesis: POOL[0].thesis,
  pullQuote: "Test quote.", complexity: 2, capitalTotal: 34000, score: 70, band: "Solid",
  durationSeconds: 292, audioBytes: 4812345
}], "https://innovation.stluker.com");
ok(rss.includes('length="4812345"'), "enclosure carries a real byte length (Apple validates this)");
ok(rss.includes("<itunes:duration>04:52</itunes:duration>"), "itunes duration formatted");
ok(rss.includes("<itunes:category"), "itunes category present");
ok(rss.includes(DISCLAIMER.slice(0, 40)) && rss.includes("/method.html"), "feed carries the not-advice disclaimer and method link");
ok(rss.includes("Estimated startup capital"), "feed labels capital as an estimate");

// Two MPEG-1 Layer III frames at 128 kbps / 44.1 kHz, no padding: 417 bytes each.
const frame = new Uint8Array(417); frame[0] = 0xff; frame[1] = 0xfb; frame[2] = 0x90; frame[3] = 0x64;
const twoFrames = new Uint8Array(834); twoFrames.set(frame, 0); twoFrames.set(frame, 417);
ok(Math.abs(mp3DurationSeconds(twoFrames) - (2 * 1152) / 44100) < 1e-9, "mp3 duration is measured from frame headers");
ok(mp3DurationSeconds(new Uint8Array(100)) === 0, "non-audio bytes measure as zero, not garbage");

ok(speakable("The RFP and HIPAA rules for 8(a) firms").includes("R F P"), "pronunciation layer rewrites acronyms");
ok(!speakable("SKUs").includes("SKU"), "SKUs spoken as skews");
ok(formatDuration(292) === "4:52", "duration label");
ok(toAscii("don’t — stop") === "don't - stop", "ascii normaliser strips smart punctuation");

const n = assembleNarration({ bluf:"A.", plainIntro:"B.", elevatorPitch:"C C.", theNeed:"D.", theField:"E.", complexityRead:"F.", howToStart:"G.", close:"H." });
ok(countWords(n) === 9, "narration assembled and counted in code");
ok(!n.includes("<break"), "clean narration (transcript/word-count) never contains SSML tags");

const speech = assembleForSpeech({ bluf:"A.", plainIntro:"B.", elevatorPitch:"C C.", theNeed:"D.", theField:"E.", complexityRead:"F.", howToStart:"G.", close:"H." });
ok(speech.includes('<break time="0.4s" />'), "speech version inserts the pause tag after bluf");
ok(!speech.trim().endsWith("/>"), "no trailing break tag after the final (close) section");
ok(sumBreakSeconds(speech) > 3, `pause tags sum to a real, non-trivial duration (got ${sumBreakSeconds(speech)}s)`);

// ---- validation kit worksheet
const md = kitMarkdown({
  title: "T", date: "2026-09-01", origin: "https://innovation.stluker.com",
  validationKit: {
    interviewScript: { opening: "O", questions: ["q1", "q2"], closing: "C" },
    searchQueries: [{ query: "x", where: "Google", finds: "y" }],
    landingPage: { headline: "H", subhead: "S", bullets: ["b"], callToAction: "A" },
    firstWeek: [{ day: "Day 1", task: "t", evidence: "e" }]
  }
});
ok(md.includes("# Validation kit: T") && md.includes("Not financial") && md.includes("- [ ] **Day 1:**"), "validation kit renders as a worksheet with the disclaimer");

console.log(fail === 0 ? "\nALL CHECKS PASSED" : `\n${fail} CHECK(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
