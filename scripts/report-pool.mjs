// npm run report:pool
// The pool at a glance: what can run, what is held and why, how the scores
// spread, and which published episodes carry corrections. Offline - reads
// the bundled pool, not live rotation state (GET /status has that).
import { bundledPool, isSelectable, CATEGORIES } from "../pool.js";
import { scoreIdea } from "../score.js";

const pool = bundledPool();
const rows = pool
  .map((i) => ({ i, s: scoreIdea(i), v: i.verification }))
  .sort((a, b) => b.s.overall - a.s.overall);

const pad = (x, n) => String(x).padEnd(n).slice(0, n);
console.log(`\nINNOVATION DAILY POOL - ${pool.length} entries, ${pool.filter(isSelectable).length} selectable\n`);
console.log(`${pad("score", 6)}${pad("band", 12)}${pad("status", 13)}${pad("type", 7)}${pad("category", 16)}${pad("verified", 11)}id`);
for (const { i, s, v } of rows) {
  const cap = s.capped ? ` (capped: ${s.capped})` : "";
  console.log(`${pad(s.overall, 6)}${pad(s.band, 12)}${pad(v.status, 13)}${pad(i.opportunityType, 7)}${pad(i.category, 16)}${pad(v.lastVerified, 11)}${i.id}${cap}`);
}

const bands = {};
for (const { s } of rows) bands[s.band] = (bands[s.band] || 0) + 1;
console.log(`\nBands: ${Object.entries(bands).map(([b, n]) => `${n} ${b}`).join(", ")}`);

const selectable = pool.filter(isSelectable);
console.log("\nCategory mix of the selectable pool:");
for (const c of CATEGORIES) {
  const n = selectable.filter((i) => i.category === c).length;
  if (n) console.log(`  ${pad(c, 18)}${pad(n, 4)}${Math.round((100 * n) / selectable.length)}%`);
}
const types = {};
for (const i of selectable) types[i.opportunityType] = (types[i.opportunityType] || 0) + 1;
console.log(`Opportunity types: ${Object.entries(types).map(([t, n]) => `${n} ${t}`).join(", ")}`);

const blocked = rows.filter(({ v }) => v.status !== "verified");
if (blocked.length) {
  console.log("\nNOT SELECTABLE - needs a decision:");
  for (const { i, v } of blocked) {
    console.log(`\n  ${i.id} [${v.status}] - ${i.title}`);
    for (const item of v.openItems || []) console.log(`    - ${item}`);
  }
}

const corrections = rows.flatMap(({ i, v }) => (v.corrections || []).map((c) => ({ id: i.id, ...c })));
if (corrections.length) {
  console.log("\nCORRECTIONS ON PUBLISHED EPISODES:");
  for (const c of corrections.sort((a, b) => (a.date < b.date ? -1 : 1))) {
    console.log(`  ${c.date}  ${c.id}\n    ${c.text}`);
  }
}
console.log("");
