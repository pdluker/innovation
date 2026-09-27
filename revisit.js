// revisit.js
// The 90-day revisit: what happened to the companies and the market an
// episode described, and whether its call held up. This is the part of the
// archive that gets more valuable with age - a brief that was checked
// against reality is worth more than one that was only published.
//
// Same guardrail as promote.js: a finding is kept only if its link came
// from the search results. "too-early" is a legitimate answer - most calls
// cannot be graded at 90 days, and the revisit should say so rather than
// manufacture a verdict.

import { researchCall, structuredCall, CHECK_MODEL } from "./anthropic.js";
import { toAscii } from "./script.js";

export const REVISIT_AFTER_DAYS = 90;
export const EVENTS = ["raised", "acquired", "shut-down", "launched", "pivoted", "price-change", "regulation", "other"];

const RESEARCH_SYSTEM = `You check what happened after an "Innovation Daily" brief was published. Use web search. For each named company and for the market as a whole, find events since the publish date: funding rounds, acquisitions, shutdowns, product launches or pivots, pricing changes, and regulatory changes that affect the idea. Give the date and URL for every event. Report only what the search results show; if you find nothing for a company, say so.`;

const STRUCTURE_SYSTEM = `You summarize a 90-day revisit of an "Innovation Daily" brief from research notes.

- findings: only events in the notes that happened after the publish date, each with the URL from the notes. Describe each in one plain sentence.
- summary: two or three sentences on what changed for this business idea, stated no more strongly than the findings support.
- callHeldUp: "yes" if the events so far support the brief's call, "no" if they contradict it, "too-early" if 90 days is not enough to tell (the usual answer), "unclear" if the evidence points both ways. Explain in callReasoning, citing the findings.
- Plain ASCII only.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    callHeldUp: { type: "string", enum: ["yes", "no", "too-early", "unclear"] },
    callReasoning: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          company: { type: "string" },
          event: { type: "string", enum: EVENTS },
          date: { type: "string" },
          detail: { type: "string" },
          url: { type: "string" }
        },
        required: ["company", "event", "date", "detail", "url"]
      }
    }
  },
  required: ["summary", "callHeldUp", "callReasoning", "findings"]
};

const host = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return null; }
};

/** Oldest published episodes that are at least 90 days old and unrevisited. */
export function dueForRevisit(manifestEpisodes, today = new Date(), limit = 1) {
  const cutoff = new Date(today.getTime() - REVISIT_AFTER_DAYS * 86_400_000).toISOString().slice(0, 10);
  return manifestEpisodes
    .filter((e) => e.date <= cutoff && !e.hasRevisit)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, limit);
}

/**
 * @param {object} ep  the full episode JSON
 * @returns {Promise<object>} the revisit record stored on the episode
 */
export async function revisitEpisode(env, ep, today = new Date().toISOString().slice(0, 10)) {
  const companies = ((ep.verification && ep.verification.competitors) || [])
    .filter((c) => c.kind !== "category")
    .map((c) => `- ${c.name}${c.url ? ` (${c.url})` : ""}: ${c.note || ""}`)
    .join("\n");

  const research = await researchCall(env, {
    what: "revisit research",
    system: RESEARCH_SYSTEM,
    prompt: `Published ${ep.date}: "${ep.title}". ${ep.thesis}\nIts call: ${ep.verdict}\nCompanies named:\n${companies || "(none recorded)"}\n\nWhat has happened since ${ep.date}?`,
    maxSearches: 8
  });

  const result = await structuredCall(env, {
    what: "revisit structure",
    system: STRUCTURE_SYSTEM,
    messages: [{
      role: "user",
      content: `BRIEF (published ${ep.date})\nTitle: ${ep.title}\nThesis: ${ep.thesis}\nCall: ${ep.verdict}\n\nRESEARCH NOTES\n${research.text}\n\nURLS THE SEARCH RETURNED - cite only these:\n${research.urls.join("\n") || "(none)"}`
    }],
    schema: SCHEMA
  });

  const searchHosts = new Set(research.urls.map(host).filter(Boolean));
  const a = (s) => toAscii(String(s || "")).trim();
  const findings = (result.findings || [])
    .filter((f) => searchHosts.has(host(f.url)))
    .map((f) => ({ company: a(f.company), event: f.event, date: a(f.date), detail: a(f.detail), url: f.url }));

  return {
    checkedAt: today,
    model: CHECK_MODEL,
    summary: a(result.summary),
    callHeldUp: result.callHeldUp,
    callReasoning: a(result.callReasoning),
    findings,
    droppedUnsourced: (result.findings || []).length - findings.length
  };
}
