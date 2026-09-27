// kit.js
// The validation kit: what a listener does next, if the brief convinced
// them. A brief alone gives a first-time founder nothing to act on - this
// gives them a customer interview script, ten searches that find real
// target buyers, landing-page copy for a smoke test, and a first-week
// checklist. Written-only; never narrated.
//
// Grounded in the same material as the brief (script.js groundedMaterial),
// so it cannot promise results, prices or statistics the material does not
// have. OPTIONAL step: the orchestrator wraps it and ships the episode
// without a kit on any failure.

import { structuredCall } from "./anthropic.js";
import { groundedMaterial, toAscii } from "./script.js";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    interviewScript: {
      type: "object",
      additionalProperties: false,
      properties: {
        opening: { type: "string" },
        questions: { type: "array", items: { type: "string" } },
        closing: { type: "string" }
      },
      required: ["opening", "questions", "closing"]
    },
    searchQueries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          query: { type: "string" },
          where: { type: "string", enum: ["Google", "LinkedIn", "Industry directory", "Association site", "Public records"] },
          finds: { type: "string" }
        },
        required: ["query", "where", "finds"]
      }
    },
    landingPage: {
      type: "object",
      additionalProperties: false,
      properties: {
        headline: { type: "string" },
        subhead: { type: "string" },
        bullets: { type: "array", items: { type: "string" } },
        callToAction: { type: "string" }
      },
      required: ["headline", "subhead", "bullets", "callToAction"]
    },
    firstWeek: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          day: { type: "string" },
          task: { type: "string" },
          evidence: { type: "string" }
        },
        required: ["day", "task", "evidence"]
      }
    }
  },
  required: ["interviewScript", "searchQueries", "landingPage", "firstWeek"]
};

const SYSTEM = `You write the validation kit that accompanies an "Innovation Daily" brief. The reader is one operator with about one hundred thousand dollars who wants to find out, cheaply and fast, whether this business is real before spending on it. Everything you write must be usable this week.

Ground every line in the material you are given - the customer, the need, the competitors, the plan. Do not add statistics, prices, market sizes, results, customer counts or guarantees that are not in the material.

- interviewScript: a short customer-discovery interview for the buyer named under "Who pays". An opening line that asks for fifteen minutes without pitching. Then exactly 8 questions about the buyer's past behavior and current costs - what they did the last time the problem came up, what it cost, who handled it, what they tried - never hypotheticals like "would you pay for" and never a pitch. A closing line that asks for a referral to one more person with the same problem.
- searchQueries: exactly 10 search strings the operator can paste in to find real prospective buyers - job titles, industry terms, association member directories, public registries. Name no individual people. Say where to run each one and what it finds.
- landingPage: copy for a one-page smoke test that offers this service to the buyer. A headline, a subhead, exactly 3 benefit bullets, and a call to action that asks for a short call or an early-access request. Make no claim the material does not support: no invented results, no testimonials, no guarantees, no numbers that are not in the material.
- firstWeek: 5 to 7 tasks across days 1 to 7, each producing evidence (conversations booked, questions answered, a price reaction heard) rather than product. Say what evidence each task produces.

Plain ASCII only: straight quotes, " - " instead of dashes.`;

function asciiDeep(value) {
  if (typeof value === "string") return toAscii(value).trim();
  if (Array.isArray(value)) return value.map(asciiDeep).filter((v) => v !== "");
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, asciiDeep(v)]));
  }
  return value;
}

export async function generateKit(env, idea) {
  const kit = await structuredCall(env, {
    what: "validation kit",
    system: SYSTEM,
    messages: [{ role: "user", content: `MATERIAL\n\n${groundedMaterial(idea)}\n\nWrite the validation kit.` }],
    schema: SCHEMA
  });

  const clean = asciiDeep(kit);
  // The schema cannot enforce counts; the page layout assumes them.
  clean.interviewScript.questions = clean.interviewScript.questions.slice(0, 8);
  clean.searchQueries = clean.searchQueries.slice(0, 10);
  clean.landingPage.bullets = clean.landingPage.bullets.slice(0, 3);
  clean.firstWeek = clean.firstWeek.slice(0, 7);
  if (clean.interviewScript.questions.length < 5 || clean.searchQueries.length < 5 || clean.firstWeek.length < 3) {
    throw new Error("validation kit came back too thin to publish");
  }
  return clean;
}

/** The kit as a Markdown worksheet, served at /kit/<date>.md. */
export function kitMarkdown(ep) {
  const k = ep.validationKit;
  const lines = [
    `# Validation kit: ${ep.title}`,
    ``,
    `From Innovation Daily, ${ep.date}. ${ep.origin ? `${ep.origin}/${ep.date}` : ""}`.trim(),
    ``,
    `Not financial, legal or investment advice. Capital figures in the brief are estimates. See ${ep.origin || ""}/method.html.`,
    ``,
    `## 1. Customer interview (15 minutes, no pitching)`,
    ``,
    `**Opening:** ${k.interviewScript.opening}`,
    ``,
    ...k.interviewScript.questions.map((q, i) => `${i + 1}. ${q}`),
    ``,
    `**Closing:** ${k.interviewScript.closing}`,
    ``,
    `## 2. Ten searches that find real buyers`,
    ``,
    ...k.searchQueries.map((s, i) => `${i + 1}. \`${s.query}\` - ${s.where}. ${s.finds}`),
    ``,
    `## 3. Landing page for a smoke test`,
    ``,
    `**${k.landingPage.headline}**`,
    ``,
    k.landingPage.subhead,
    ``,
    ...k.landingPage.bullets.map((b) => `- ${b}`),
    ``,
    `Call to action: ${k.landingPage.callToAction}`,
    ``,
    `## 4. First week`,
    ``,
    ...k.firstWeek.map((t) => `- [ ] **${t.day}:** ${t.task} *(Evidence: ${t.evidence})*`),
    ``
  ];
  return lines.join("\n");
}
