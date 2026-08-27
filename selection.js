// selection.js
// Keeps date math and rotation logic out of the orchestrator.
//
// Tiered cascade:
//   1. Unused ideas whose category differs from the last two episodes
//   2. Unused ideas, any category
//   3. Reset the used list and start the rotation over (never error out)
//
// Deterministic per date so that a re-run of the same day picks the same
// idea. That matters: a forced re-run should regenerate the same episode,
// not silently swap the topic out from under an already-published transcript.

import { IDEAS } from "./ideas-source.js";

function hashDate(dateKey) {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * @param {string} dateKey       "YYYY-MM-DD"
 * @param {object} state         { used: string[], recentCategories: string[] }
 * @returns {{ idea: object, state: object, cycleReset: boolean }}
 */
export function pickIdea(dateKey, state) {
  const used = new Set(state.used || []);
  const recentCategories = state.recentCategories || [];

  let cycleReset = false;
  let available = IDEAS.filter((i) => !used.has(i.id));

  if (available.length === 0) {
    // Pool exhausted. Reset rather than throw (spec section 3, step 1).
    cycleReset = true;
    used.clear();
    available = IDEAS.slice();
  }

  const fresh = available.filter((i) => !recentCategories.includes(i.category));
  const pool = fresh.length > 0 ? fresh : available;

  const idea = pool[hashDate(dateKey) % pool.length];

  used.add(idea.id);
  const nextCategories = [idea.category, ...recentCategories].slice(0, 2);

  return {
    idea,
    cycleReset,
    state: {
      used: Array.from(used),
      recentCategories: nextCategories,
      lastDate: dateKey,
      poolSize: IDEAS.length,
      remaining: IDEAS.length - used.size
    }
  };
}

/** "YYYY-MM-DD" in a fixed zone, so the cron and manual runs agree. */
export function dateKeyFor(date, timeZone = "America/Chicago") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isValidDateKey(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
