// review.js
// The fact-check pass. Runs after the brief is written and before a single
// character reaches ElevenLabs.
//
// Why it exists: in the first 11 episodes the brief model turned vague
// sourcing notes into confident spoken citations - "The CFMA data on
// subcontractor bid-hit rates confirms it", "KFF and CMS data confirm..." -
// for claims those sources never made. A prompt rule alone did not stop it.
// So a second, stronger model reads the draft against the exact grounded
// material and lists every claim the material does not support.
//
// It checks facts, not taste. Opinions, judgments and recommendations are
// the narrator's job and are left alone unless they assert a fact.

import { structuredCall } from "./anthropic.js";

export const PROBLEMS = [
  "number-not-in-material",
  "attribution-not-in-sources",
  "overstated-claim",
  "superlative-not-supported",
  "invented-cause-or-detail",
  "competitor-misdescribed",
  "advice-to-listener"
];

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          section: { type: "string" },
          sentence: { type: "string" },
          problem: { type: "string", enum: PROBLEMS },
          explanation: { type: "string" },
          suggestedFix: { type: "string" }
        },
        required: ["section", "sentence", "problem", "explanation", "suggestedFix"]
      }
    }
  },
  required: ["issues"]
};

const SYSTEM = `You fact-check scripts for "Innovation Daily", an audio brief on one business idea per episode. Real people make money decisions from it, so an unsupported claim is a real harm.

You receive the GROUNDED MATERIAL the script was written from and the DRAFT. List every sentence in the draft that states something the grounded material does not support. Problems to catch:

- number-not-in-material: any figure, percentage, dollar amount, rate, count, date or duration that does not appear in the grounded material. Spelled-out numbers count ("one hundred and fifty dollars").
- attribution-not-in-sources: the draft credits a claim to a named source (company, agency, survey, publication, association) and the VERIFIED SOURCES list does not pair that source with that claim. "X data confirms", "according to X", "X reports" are all attributions.
- overstated-claim: the claim appears in the material but the draft states it more strongly ("some" became "most", "can" became "does", "about 10 percent" became "a third").
- superlative-not-supported: "the single most common", "the largest", "the only", "the fastest-growing" and the like, unless the material says exactly that.
- invented-cause-or-detail: a cause, motive, mechanism or historical detail the material does not state ("not because X but because Y", "three years ago this required...").
- competitor-misdescribed: a named competitor is described in a way the competitor notes contradict (wrong owner, wrong product, wrong buyer, merged companies treated as rivals).
- advice-to-listener: the draft tells the listener what to do with their own money as personal financial advice, or promises returns. Describing how the narrator would approach the business is fine.

Do not flag opinions, recommendations, predictions, the narrator's judgments, or general knowledge a well-informed executive would state without a source (for example that HIPAA applies to patient data). Do not flag the capital plan figures - they come from the material. Quote each flagged sentence exactly as it appears in the draft. If nothing is wrong, return an empty list.`;

/**
 * @param {string} material  the same grounded material the brief was written from
 * @param {object} sections  the parsed brief sections
 * @returns {Promise<object[]>} issues, possibly empty
 */
export async function reviewDraft(env, material, sections) {
  const draft = Object.entries(sections)
    .filter(([k, v]) => k !== "tags" && k !== "pullQuote" && (typeof v === "string" || Array.isArray(v)))
    .map(([k, v]) => `[${k}]\n${Array.isArray(v) ? v.join("\n") : v}`)
    .join("\n\n");

  const result = await structuredCall(env, {
    what: "fact-check",
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `GROUNDED MATERIAL\n\n${material}\n\n---\n\nDRAFT\n\n${draft}`
      }
    ],
    schema: SCHEMA
  });
  return Array.isArray(result.issues) ? result.issues : [];
}
