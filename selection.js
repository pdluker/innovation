// selection.js
// Keeps date math and rotation logic out of the orchestrator.
//
// Tiered cascade:
//   1. Unused ideas whose category differs from the last two episodes
//   2. Unused ideas, any category
//   3. Reset the used list and start the rotation over (never error out)
//
// Only verified entries are eligible (pool.js isSelectable). A held or
// needs-review idea is never picked, however long it sits in the pool.
//
// Deterministic per date and pool state. A forced re-run of an existing
// date does NOT come through here - index.js reuses that episode's idea, so
// a re-run regenerates the same business instead of swapping the topic out
// from under a published transcript.

import { isSelectable } from "./pool.js";

function hashDate(dateKey) {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * @param {string}   dateKey  "YYYY-MM-DD"
 * @param {object}   state    { used: string[], recentCategories: string[] }
 * @param {object[]} pool     every pool entry, with verification attached
 * @returns {{ idea: object, state: object, cycleReset: boolean }}
 */
export function pickIdea(dateKey, state, pool) {
  const eligible = pool.filter(isSelectable);
  if (eligible.length === 0) throw new Error("no verified ideas in the pool");

  const used = new Set(state.used || []);
  const recentCategories = state.recentCategories || [];

  let cycleReset = false;
  let available = eligible.filter((i) => !used.has(i.id));

  if (available.length === 0) {
    // Pool exhausted. Reset rather than throw (spec section 3, step 1).
    cycleReset = true;
    used.clear();
    available = eligible.slice();
  }

  const fresh = available.filter((i) => !recentCategories.includes(i.category));
  const candidates = fresh.length > 0 ? fresh : available;

  const idea = candidates[hashDate(dateKey) % candidates.length];

  used.add(idea.id);
  const nextCategories = [idea.category, ...recentCategories].slice(0, 2);
  const usedEligible = eligible.filter((i) => used.has(i.id)).length;

  return {
    idea,
    cycleReset,
    state: {
      used: Array.from(used),
      recentCategories: nextCategories,
      lastDate: dateKey,
      poolSize: eligible.length,
      remaining: eligible.length - usedEligible
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
