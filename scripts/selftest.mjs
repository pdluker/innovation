// Offline sanity check. No network, no secrets. Run before every deploy.
import { IDEAS } from "../ideas-source.js";
import { pickIdea, dateKeyFor } from "../selection.js";
import { buildCoverSvg } from "../art.js";
import { buildRss } from "../rss.js";
import { speakable, formatDuration, sumBreakSeconds } from "../tts.js";
import { assembleNarration, assembleForSpeech, countWords, toAscii } from "../script.js";
import { scoreIdea } from "../score.js";

let fail = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fail++; };

ok(IDEAS.length >= 20, `pool has ${IDEAS.length} vetted ideas`);
ok(IDEAS.every(i => i.capital.total <= 100000), "every idea is under the 100k ceiling");
ok(new Set(IDEAS.map(i => i.id)).size === IDEAS.length, "all ids unique");
ok(IDEAS.every(i => i.competitors.length >= 3), "every idea names 3+ real competitors");
ok(IDEAS.every(i => i.complexity >= 1 && i.complexity <= 5), "complexity in range 1-5");

ok(IDEAS.every(i => i.aiLeverage >= 1 && i.aiLeverage <= 5), "every idea has aiLeverage 1-5");
ok(IDEAS.every(i => i.defensibility >= 1 && i.defensibility <= 5), "every idea has defensibility 1-5");
ok(IDEAS.every(i => ["build","buy","invest"].includes(i.opportunityType)), "every idea has a valid opportunityType");

const testScore = scoreIdea(IDEAS[0]);
ok(testScore.overall >= 0 && testScore.overall <= 100, `score computes in range (got ${testScore.overall})`);
ok(["Strong","Solid","Speculative","Weak"].includes(testScore.band), "score band is one of the four labels");
const score2 = scoreIdea(IDEAS[0]);
ok(score2.overall === testScore.overall, "score is deterministic - same idea scores the same every time");

// Non-ASCII would silently corrupt across a PowerShell 5.1 boundary.
const bad = IDEAS.filter(i => /[^\x20-\x7E]/.test(JSON.stringify(i)));
ok(bad.length === 0, `content pool is pure ASCII${bad.length ? " -> " + bad.map(b=>b.id).join(",") : ""}`);

// Full rotation: every idea used exactly once, then a clean reset.
let state = { used: [], recentCategories: [] };
const seen = new Set();
let resets = 0;
for (let d = 0; d < IDEAS.length + 3; d++) {
  const key = dateKeyFor(new Date(Date.UTC(2026, 8, 1 + d, 12)));
  const r = pickIdea(key, state);
  state = r.state;
  if (r.cycleReset) resets++; else seen.add(r.idea.id);
}
ok(seen.size === IDEAS.length, `rotation covered all ${IDEAS.length} ideas before reset`);
ok(resets === 1, "pool reset exactly once instead of erroring out");

// Determinism: same date must pick the same idea.
const s0 = { used: [], recentCategories: [] };
ok(pickIdea("2026-09-01", s0).idea.id === pickIdea("2026-09-01", s0).idea.id, "selection is deterministic per date");

ok(dateKeyFor(new Date("2026-09-02T02:30:00Z")) === "2026-09-01", "date key respects America/Chicago");

const svg = buildCoverSvg(IDEAS[0], "2026-09-01");
ok(svg.startsWith("<svg") && svg.includes("</svg>"), "cover svg renders");

const rss = buildRss([{
  date: "2026-09-01", title: IDEAS[0].title, thesis: IDEAS[0].thesis,
  pullQuote: "Test quote.", complexity: 2, capitalTotal: 34000,
  durationSeconds: 292, audioBytes: 4812345
}], "https://innovation.stluker.com");
ok(rss.includes('length="4812345"'), "enclosure carries a real byte length (Apple validates this)");
ok(rss.includes("<itunes:duration>04:52</itunes:duration>"), "itunes duration formatted");
ok(rss.includes("<itunes:category"), "itunes category present");

ok(speakable("The RFP and HIPAA rules for 8(a) firms").includes("R F P"), "pronunciation layer rewrites acronyms");
ok(!speakable("SKUs").includes("SKU"), "SKUs spoken as skews");
ok(formatDuration(292) === "4:52", "duration label");
ok(toAscii("don\u2019t \u2014 stop") === "don't - stop", "ascii normaliser strips smart punctuation");

const n = assembleNarration({ bluf:"A.", plainIntro:"B.", elevatorPitch:"C C.", theNeed:"D.", theField:"E.", complexityRead:"F.", howToStart:"G.", close:"H." });
ok(countWords(n) === 9, "narration assembled and counted in code");
ok(!n.includes("<break"), "clean narration (transcript/word-count) never contains SSML tags");

const speech = assembleForSpeech({ bluf:"A.", plainIntro:"B.", elevatorPitch:"C C.", theNeed:"D.", theField:"E.", complexityRead:"F.", howToStart:"G.", close:"H." });
ok(speech.includes('<break time="0.4s" />'), "speech version inserts the pause tag after bluf");
ok(!speech.trim().endsWith("/>"), "no trailing break tag after the final (close) section");
ok(sumBreakSeconds(speech) > 3, `pause tags sum to a real, non-trivial duration (got ${sumBreakSeconds(speech)}s)`);

console.log(fail === 0 ? "\nALL CHECKS PASSED" : `\n${fail} CHECK(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
