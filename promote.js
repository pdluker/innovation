// promote.js
// Seed -> researched draft. A one-line idea goes in; a full pool entry with
// its verification record comes out as "needs-review", never as verified.
// The owner approves it (pool-store.js decide), or it never runs.
//
// Two calls, because search citations and structured output cannot share a
// request: research with live web search, then structure the notes into an
// entry. Guessing is designed out in code, not just in the prompt:
//   - every competitor URL and source URL must come from a host the search
//     actually returned, or it is flagged
//   - every URL is fetched once; dead links are flagged
//   - fewer than two named, linked competitors or no sourced fact means
//     "insufficient", with the reason, instead of a draft

import { researchCall, structuredCall, CHECK_MODEL } from "./anthropic.js";
import { CATEGORIES, OPPORTUNITY_TYPES, COMPETITOR_KINDS, OVERLAPS, CAPITAL_CEILING, validateIdea } from "./pool.js";
import { toAscii } from "./script.js";

const RESEARCH_SYSTEM = `You research one business idea for "Innovation Daily", a brief for an operator with about one hundred thousand dollars who wants to start an AI-assisted business. Use web search. Find and report, with the URL for every fact:

1. Who specifically pays for this, and the evidence that the pain is real and current.
2. Real companies already selling this outcome (direct competitors) or something adjacent: each one's official website, what it sells and to whom, and its ownership or funding if published. Check that each company still exists under that name.
3. Two to four published facts - statistics, regulations, market data - that explain why the need exists now. Give the exact figure and the page it came from.
4. Any license, regulation or legal constraint a founder would have to handle.

Report only what the search results show. Do not fill gaps from memory. If you cannot find at least two real, named companies selling something related, say so plainly.`;

const STRUCTURE_SYSTEM = `You turn research notes into a draft pool entry for "Innovation Daily". A human reviews every draft before it can air, so an honest "insufficient" is worth more than a confident guess.

Rules:
- Use only facts in the research notes. Every competitor must be a real company named in the notes, with its URL taken from the notes. Every source must pair one claim with the URL in the notes that supports it, stated no more strongly than the page does.
- Competitor kind: "public" or "funded" only if the notes say so; a consulting firm is "services"; otherwise "established". Overlap is "direct" only if it sells the same outcome to the same buyer; otherwise "adjacent".
- The capital plan is a planning estimate: at most ${CAPITAL_CEILING} dollars, 3 to 6 line items that sum exactly to the total, ending with a runway reserve.
- firstNinety: exactly three phases (days 1-30, 31-60, 61-90), each buying evidence before product.
- complexity, aiLeverage and defensibility are editorial ratings from 1 to 5. Be conservative: a services business anyone can copy has defensibility 1 or 2.
- sourceNotes: one or two sentences naming the sources behind the market claim.
- The "need" field may state only numbers that appear in your sources.
- Plain ASCII only: straight quotes, " - " instead of dashes.
- If the notes do not give at least two named companies with URLs and at least one sourced fact, set insufficient to true, say why in insufficientReason, and keep every other field minimal.`;

const ENTRY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    insufficient: { type: "boolean" },
    insufficientReason: { type: "string" },
    title: { type: "string" },
    category: { type: "string", enum: CATEGORIES },
    opportunityType: { type: "string", enum: OPPORTUNITY_TYPES },
    thesis: { type: "string" },
    customer: { type: "string" },
    need: { type: "string" },
    complexity: { type: "integer" },
    complexityWhy: { type: "string" },
    capitalLines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { label: { type: "string" }, amount: { type: "integer" } },
        required: ["label", "amount"]
      }
    },
    firstNinety: { type: "array", items: { type: "string" } },
    claudeRole: { type: "string" },
    moat: { type: "string" },
    sourceNotes: { type: "string" },
    aiLeverage: { type: "integer" },
    defensibility: { type: "integer" },
    competitors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          url: { type: "string" },
          kind: { type: "string", enum: COMPETITOR_KINDS },
          overlap: { type: "string", enum: OVERLAPS },
          note: { type: "string" }
        },
        required: ["name", "url", "kind", "overlap", "note"]
      }
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { claim: { type: "string" }, url: { type: "string" }, publisher: { type: "string" } },
        required: ["claim", "url", "publisher"]
      }
    }
  },
  required: [
    "insufficient", "insufficientReason", "title", "category", "opportunityType", "thesis", "customer", "need",
    "complexity", "complexityWhy", "capitalLines", "firstNinety", "claudeRole", "moat", "sourceNotes",
    "aiLeverage", "defensibility", "competitors", "sources"
  ]
};

const clamp15 = (n) => Math.max(1, Math.min(5, Math.round(Number(n) || 1)));
const host = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return null; }
};

/** One GET per URL, short timeout. Status only - bodies are discarded. */
async function checkUrl(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctl.signal, headers: { "user-agent": "InnovationDaily-LinkCheck/1.0" } });
    return res.status;
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {object} row  the ideas-table row (id, seed_text)
 * @returns {Promise<{ status: "needs-review"|"insufficient", idea, verification, notes }>}
 */
export async function promoteSeed(env, row, today = new Date().toISOString().slice(0, 10)) {
  const seed = row.seed_text;
  const research = await researchCall(env, {
    what: "promote research",
    system: RESEARCH_SYSTEM,
    prompt: `Seed idea: ${seed}\n\nResearch it.`,
    maxSearches: 10
  });

  const draft = await structuredCall(env, {
    what: "promote structure",
    system: STRUCTURE_SYSTEM,
    messages: [{
      role: "user",
      content: `SEED\n${seed}\n\nRESEARCH NOTES\n${research.text}\n\nURLS THE SEARCH RETURNED - cite only these:\n${research.urls.join("\n") || "(none)"}`
    }],
    schema: ENTRY_SCHEMA
  });

  const searchHosts = new Set(research.urls.map(host).filter(Boolean));
  const notes = {
    promotedAt: new Date().toISOString(),
    model: CHECK_MODEL,
    seed,
    searchResults: research.urls.length,
    urlChecks: [],
    problems: []
  };

  const a = (s) => toAscii(String(s || "")).trim();
  const competitors = (draft.competitors || []).map((c) => ({
    name: a(c.name), url: String(c.url || "").trim(), kind: c.kind, overlap: c.overlap, note: a(c.note)
  }));
  const sources = (draft.sources || []).map((s) => ({ claim: a(s.claim), url: String(s.url || "").trim(), publisher: a(s.publisher) }));

  const urls = [...new Set([...competitors.map((c) => c.url), ...sources.map((s) => s.url)].filter(Boolean))];
  for (const url of urls) {
    const fromSearch = searchHosts.has(host(url));
    const status = await checkUrl(url);
    notes.urlChecks.push({ url, fromSearch, status });
    if (!fromSearch) notes.problems.push(`URL not from the search results: ${url}`);
    if (!(status >= 200 && status < 400) && status !== 403 && status !== 429) notes.problems.push(`URL did not load (${status || "no response"}): ${url}`);
  }

  const trusted = (u) => searchHosts.has(host(u));
  const linkedCompetitors = competitors.filter((c) => c.kind !== "category" && trusted(c.url));
  const trustedSources = sources.filter((s) => trusted(s.url));

  if (draft.insufficient || linkedCompetitors.length < 2 || trustedSources.length === 0) {
    const reason = draft.insufficient
      ? a(draft.insufficientReason) || "The research did not find enough."
      : `Only ${linkedCompetitors.length} named competitor(s) and ${trustedSources.length} source(s) came from the search results.`;
    notes.problems.unshift(reason);
    return { status: "insufficient", idea: null, verification: null, notes };
  }

  // Deterministic repairs only - nothing that changes the substance.
  const lines = (draft.capitalLines || []).map((l) => ({ label: a(l.label), amount: Math.max(0, Math.round(Number(l.amount) || 0)) }));
  const total = lines.reduce((sum, l) => sum + l.amount, 0);

  const idea = {
    id: row.id,
    aiLeverage: clamp15(draft.aiLeverage),
    defensibility: clamp15(draft.defensibility),
    opportunityType: draft.opportunityType,
    title: a(draft.title),
    category: draft.category,
    thesis: a(draft.thesis),
    customer: a(draft.customer),
    need: a(draft.need),
    competitors: competitors.map((c) => c.name),
    complexity: clamp15(draft.complexity),
    complexityWhy: a(draft.complexityWhy),
    capital: { total, lines },
    firstNinety: (draft.firstNinety || []).slice(0, 3).map(a),
    claudeRole: a(draft.claudeRole),
    moat: a(draft.moat),
    sourceNotes: a(draft.sourceNotes)
  };

  const verification = {
    status: "needs-review",
    lastVerified: today,
    competitors,
    sources,
    changes: [`Drafted by ${CHECK_MODEL} from the seed "${a(seed)}" with live web search on ${today}.`],
    openItems: ["Owner review: confirm the ratings and the capital estimate, and open the sources before approving."],
    corrections: []
  };

  const errors = validateIdea({ ...idea, verification });
  notes.problems.push(...errors);
  return { status: "needs-review", idea, verification, notes };
}
