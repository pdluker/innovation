// pool.js
// One definition of "a valid, runnable pool entry", shared by the offline
// selftest, the bundled seed, and anything that adds ideas at runtime. An
// entry is the editorial fields from ideas-source.js plus its audit record
// from verification.js, attached as idea.verification.
//
// Only "verified" entries are ever selected. "held" and "needs-review"
// entries stay in the pool, visible to the owner, until someone clears them.

import { IDEAS } from "./ideas-source.js";
import { VERIFICATION } from "./verification.js";

export const CATEGORIES = [
  "Vertical AI",
  "AI Ops",
  "Data Products",
  "AI Services",
  "Infra & Tooling",
  "Consumer AI",
  "Physical + AI"
];
export const OPPORTUNITY_TYPES = ["build", "buy", "invest"];
export const VERIFICATION_STATUSES = ["verified", "needs-review", "held"];
export const COMPETITOR_KINDS = ["public", "funded", "established", "services", "category"];
export const OVERLAPS = ["direct", "adjacent"];
export const CAPITAL_CEILING = 100000;

export function withVerification(idea, records = VERIFICATION) {
  return { ...idea, verification: records[idea.id] || null };
}

/** The pool as shipped in the bundle - the seed for any other store. */
export function bundledPool() {
  return IDEAS.map((idea) => withVerification(idea));
}

export function isSelectable(idea) {
  return Boolean(idea && idea.verification && idea.verification.status === "verified");
}

const isInt1to5 = (n) => Number.isInteger(n) && n >= 1 && n <= 5;
const isText = (s) => typeof s === "string" && s.trim().length > 0;
const isUrl = (s) => typeof s === "string" && /^https?:\/\/\S+$/.test(s);

/**
 * Every rule an entry must pass before it can run. Returns a list of
 * problems; an empty list means valid.
 */
export function validateIdea(idea) {
  const errors = [];
  const e = (msg) => errors.push(msg);

  if (!idea || typeof idea !== "object") return ["entry is not an object"];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(idea.id || "")) e("id must be kebab-case");
  for (const key of ["title", "thesis", "customer", "need", "complexityWhy", "claudeRole", "moat", "sourceNotes"]) {
    if (!isText(idea[key])) e(`${key} is required`);
  }
  if (!CATEGORIES.includes(idea.category)) e(`category must be one of: ${CATEGORIES.join(", ")}`);
  if (!OPPORTUNITY_TYPES.includes(idea.opportunityType)) e("opportunityType must be build, buy or invest");
  for (const key of ["complexity", "aiLeverage", "defensibility"]) {
    if (!isInt1to5(idea[key])) e(`${key} must be an integer 1-5`);
  }
  if (!Array.isArray(idea.competitors) || idea.competitors.length < 3 || !idea.competitors.every(isText)) {
    e("competitors must name at least 3 entries");
  }
  if (!Array.isArray(idea.firstNinety) || idea.firstNinety.length !== 3 || !idea.firstNinety.every(isText)) {
    e("firstNinety must have exactly 3 phases");
  }
  const cap = idea.capital;
  if (!cap || !Array.isArray(cap.lines) || cap.lines.length === 0) {
    e("capital needs line items");
  } else {
    const sum = cap.lines.reduce((a, l) => a + (Number(l.amount) || 0), 0);
    if (sum !== cap.total) e(`capital lines sum to ${sum}, not the stated ${cap.total}`);
    if (!(cap.total > 0 && cap.total <= CAPITAL_CEILING)) e(`capital total must be 1-${CAPITAL_CEILING}`);
    if (!cap.lines.every((l) => isText(l.label))) e("every capital line needs a label");
  }
  // PowerShell 5.1 corrupts non-ASCII in transit (spec gotcha 3).
  if (/[^\x20-\x7E]/.test(JSON.stringify({ ...idea, verification: undefined }))) e("entry must be pure ASCII");

  const v = idea.verification;
  if (!v) {
    e("no verification record");
    return errors;
  }
  if (!VERIFICATION_STATUSES.includes(v.status)) e(`verification status must be one of: ${VERIFICATION_STATUSES.join(", ")}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.lastVerified || "")) e("verification needs lastVerified as YYYY-MM-DD");
  if (!Array.isArray(v.competitors)) {
    e("verification needs a competitors list");
  } else {
    const names = v.competitors.map((c) => c.name);
    for (const name of idea.competitors || []) {
      if (!names.includes(name)) e(`competitor "${name}" has no verification record`);
    }
    for (const c of v.competitors) {
      if (!(idea.competitors || []).includes(c.name)) e(`verified competitor "${c.name}" is not listed on the idea`);
      if (!COMPETITOR_KINDS.includes(c.kind)) e(`competitor "${c.name}" has an invalid kind`);
      if (!OVERLAPS.includes(c.overlap)) e(`competitor "${c.name}" has an invalid overlap`);
      if (c.kind !== "category" && !isUrl(c.url)) e(`competitor "${c.name}" needs a URL`);
    }
    if (v.competitors.filter((c) => c.kind !== "category").length < 2) e("at least 2 competitors must be named companies");
  }
  if (!Array.isArray(v.sources) || v.sources.length === 0) {
    e("verification needs at least one source");
  } else {
    for (const s of v.sources) {
      if (!isText(s.claim) || !isUrl(s.url)) e("every source needs a claim and a URL");
    }
  }
  if (v.status === "held" && !(Array.isArray(v.openItems) && v.openItems.length > 0)) {
    e("a held idea must say what is holding it (openItems)");
  }
  if (/[^\x20-\x7E]/.test(JSON.stringify(v))) e("verification record must be pure ASCII");
  return errors;
}
