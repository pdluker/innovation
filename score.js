// score.js
// The "Innovation Score" is computed entirely from ideas-source.js fields.
// It is intentionally NOT asked of the model. A daily "82/100" from an LLM
// is exactly the kind of self-reported metadata the build spec says never
// to trust (gotcha 5) - it would drift and re-derive differently every run
// even for the same idea. This way the same idea always scores the same,
// and the number is auditable back to the fields that produced it.
//
// This is directional, not scientific. It exists to make the archive
// comparable over time ("show me everything 80+ under $50k"), not to be a
// precise valuation.

const CEILING = 100000;

const WEIGHTS = {
  capitalEfficiency: 0.25,
  executionEase: 0.20,
  aiLeverage: 0.20,
  defensibility: 0.15,
  marketValidation: 0.20
};

function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

/** More named, real competitors = more validated demand, on a curve that
 *  flattens out rather than rewarding an ever-longer list. */
function marketValidationFromCompetitors(count) {
  return clamp(40 + count * 11, 0, 95);
}

/**
 * @returns {{ overall: number, band: string, components: object }}
 */
export function scoreIdea(idea) {
  const components = {
    capitalEfficiency: clamp(100 * (1 - idea.capital.total / CEILING)),
    executionEase: clamp(100 * (1 - (idea.complexity - 1) / 4)),
    aiLeverage: clamp((idea.aiLeverage / 5) * 100),
    defensibility: clamp((idea.defensibility / 5) * 100),
    marketValidation: marketValidationFromCompetitors(idea.competitors.length)
  };

  const overall = Math.round(
    Object.entries(WEIGHTS).reduce((sum, [key, w]) => sum + components[key] * w, 0)
  );

  const band =
    overall >= 85 ? "Strong" : overall >= 70 ? "Solid" : overall >= 55 ? "Speculative" : "Weak";

  return {
    overall,
    band,
    components: Object.fromEntries(
      Object.entries(components).map(([k, v]) => [k, Math.round(v)])
    ),
    weights: WEIGHTS
  };
}
