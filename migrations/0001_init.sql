-- Innovation Daily: the idea pool, listener reactions and 90-day outcomes.
-- Apply with: npx wrangler d1 migrations apply innovation-daily --remote

-- One row per idea, from a one-line seed to a runnable entry.
--   seed          a one-line idea, nothing researched yet
--   promoting     research in progress (a stale one can be retried)
--   insufficient  research could not find real competitors or sources
--   needs-review  researched and drafted, waiting for the owner
--   verified      approved - the only status the rotation ever selects
--   held          researched but blocked on an owner decision (openItems)
--   rejected      the owner said no; kept so it is not re-seeded
CREATE TABLE IF NOT EXISTS ideas (
  id                TEXT PRIMARY KEY,
  status            TEXT NOT NULL CHECK (status IN ('seed','promoting','insufficient','needs-review','verified','held','rejected')),
  idea_json         TEXT,
  verification_json TEXT,
  seed_text         TEXT,
  origin            TEXT NOT NULL DEFAULT 'pool-v1',
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  decided_at        TEXT
);
CREATE INDEX IF NOT EXISTS ideas_status ON ideas(status);

-- Pursue / watch / pass, one per visitor per episode (a change of mind
-- overwrites). ip_hash is salted per episode and never reversible; it only
-- caps how many visitors one address can count as.
CREATE TABLE IF NOT EXISTS reactions (
  episode_date TEXT NOT NULL,
  visitor      TEXT NOT NULL,
  reaction     TEXT NOT NULL CHECK (reaction IN ('pursue','watch','pass')),
  source       TEXT NOT NULL CHECK (source IN ('listener','owner')),
  ip_hash      TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (episode_date, visitor)
);
CREATE INDEX IF NOT EXISTS reactions_ip ON reactions(episode_date, ip_hash);

-- What happened to the named competitors and the market in the 90 days
-- after an episode, and whether the brief's call held up.
CREATE TABLE IF NOT EXISTS outcomes (
  episode_date  TEXT PRIMARY KEY,
  idea_id       TEXT NOT NULL,
  checked_at    TEXT NOT NULL,
  call_held_up  TEXT NOT NULL CHECK (call_held_up IN ('yes','no','too-early','unclear')),
  summary       TEXT NOT NULL,
  findings_json TEXT NOT NULL
);
