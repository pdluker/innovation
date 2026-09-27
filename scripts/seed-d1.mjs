// Writes .backfill/seed-pool.sql: the bundled pool as rows for the D1 ideas
// table. Safe to re-run - an id that already exists is left alone, so
// approvals and holds made in D1 are never overwritten.
//
//   node scripts/seed-d1.mjs
//   npx wrangler d1 execute innovation-daily --remote --file=.backfill/seed-pool.sql
//
// --update-editorial also refreshes the editorial fields and audit record of
// bundled ("pool-v1") rows from ideas-source.js / verification.js, for when
// the files are corrected in git. It never changes a row's status.
import fs from "node:fs";
import path from "node:path";
import { bundledPool } from "../pool.js";

const UPDATE = process.argv.includes("--update-editorial");
const sql = (s) => (s == null ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);

const lines = [];
for (const entry of bundledPool()) {
  const { verification, ...idea } = entry;
  const status = verification ? verification.status : "needs-review";
  const insert =
    `INSERT INTO ideas (id, status, idea_json, verification_json, origin) VALUES (` +
    `${sql(idea.id)}, ${sql(status)}, ${sql(JSON.stringify(idea))}, ${sql(JSON.stringify(verification))}, 'pool-v1')`;
  lines.push(
    UPDATE
      ? `${insert} ON CONFLICT(id) DO UPDATE SET idea_json = excluded.idea_json, verification_json = excluded.verification_json, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE ideas.origin = 'pool-v1';`
      : `${insert} ON CONFLICT(id) DO NOTHING;`
  );
}

const out = path.resolve(".backfill", "seed-pool.sql");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join("\n") + "\n");
console.log(`wrote ${lines.length} rows to ${out}${UPDATE ? " (editorial update mode)" : ""}`);
