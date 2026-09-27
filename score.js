// score.js
// The "Innovation Score", version 2 (2026-09-26). Computed entirely from
// pool fields plus the verification record - never asked of the model. The
// same idea always scores the same, and every point traces back to a field.
//
// What changed from v1, and why:
//   - v1 scored market validation as 40 + 11 x competitor count, so a more
//     crowded market scored HIGHER. v2 splits that into two components:
//     marketValidation (a named company is already paid for this outcome by
//     this buyer - one is proof enough) and roomToEnter (a penalty for each
//     competitor selling the same thing to the same buyer, heavier for the
//     venture-funded and public ones).
//   - v1 gave capital efficiency 25 percent, which rewarded cheap, low-moat
//     services businesses. v2 gives defensibility the largest weight.
//   - Moat caps: defensibility 1 cannot score above Speculative, and
//     defensibility 2 cannot score above Solid. Strong needs a real moat.
//
// The formula is published verbatim on /method.html. If you change a
// weight or threshold here, change it there in the same commit.
//
// Directional, not scientific. defensibility, aiLeverage and complexity are
// editorial ratings and capital figures are estimates - the page says so.

export const SCORE_VERSION = 2;

const CEILING = 100000;

export const WEIGHTS = {
  defensibility: 0.3,
  marketValidation: 0.2,
  roomToEnter: 0.15,
  aiLeverage: 0.15,
  executionEase: 0.1,
  capitalEfficiency: 0.1
};

// Named competitors of these kinds prove buyers already pay for something.
const PAYING_KINDS = new Set(["public", "funded", "established", "services"]);
// Direct competitors of these kinds have the money to outspend a newcomer.
const RESOURCED_KINDS = new Set(["public", "funded"]);

// Paid for this outcome by this buyer (direct) / only for something
// adjacent / no named company at all.
const VALIDATION = { direct: 100, adjacentOnly: 60, none: 20 };

export const BANDS = [
  { band: "Strong", min: 72 },
  { band: "Solid", min: 58 },
  { band: "Speculative", min: 45 },
  { band: "Weak", min: 0 }
];

// defensibility rating -> the highest band it can reach.
const MOAT_CAPS = { 1: "Speculative", 2: "Solid" };

function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function bandFor(overall) {
  return BANDS.find((b) => overall >= b.min).band;
}

function competitorProfile(idea) {
  const records = (idea.verification && idea.verification.competitors) || [];
  const named = records.filter((c) => c.kind !== "category");
  return {
    directPaying: named.filter((c) => c.overlap === "direct" && PAYING_KINDS.has(c.kind)).length,
    adjacentPaying: named.filter((c) => c.overlap === "adjacent" && PAYING_KINDS.has(c.kind)).length,
    resourcedDirect: named.filter((c) => c.overlap === "direct" && RESOURCED_KINDS.has(c.kind)).length,
    otherDirect: named.filter((c) => c.overlap === "direct" && !RESOURCED_KINDS.has(c.kind)).length
  };
}

/**
 * @param {object} idea  a pool entry with its verification record attached
 *                       as idea.verification (see pool.js)
 * @returns {{ version, overall, band, capped, components, weights, inputs }}
 */
export function scoreIdea(idea) {
  const profile = competitorProfile(idea);

  const components = {
    defensibility: ((idea.defensibility - 1) / 4) * 100,
    marketValidation:
      profile.directPaying > 0 ? VALIDATION.direct : profile.adjacentPaying > 0 ? VALIDATION.adjacentOnly : VALIDATION.none,
    roomToEnter: clamp(100 - 25 * profile.resourcedDirect - 10 * profile.otherDirect),
    aiLeverage: ((idea.aiLeverage - 1) / 4) * 100,
    executionEase: ((5 - idea.complexity) / 4) * 100,
    capitalEfficiency: clamp(100 * (1 - idea.capital.total / CEILING))
  };

  let overall = Math.round(
    Object.entries(WEIGHTS).reduce((sum, [key, w]) => sum + components[key] * w, 0)
  );

  // Clamp the number to the top of the capped band so the number and the
  // band never disagree.
  let capped = null;
  const capBand = MOAT_CAPS[idea.defensibility];
  if (capBand) {
    const capIndex = BANDS.findIndex((b) => b.band === capBand);
    const ceiling = BANDS[capIndex - 1].min - 1;
    if (overall > ceiling) {
      overall = ceiling;
      capped = `moat-${idea.defensibility}`;
    }
  }

  return {
    version: SCORE_VERSION,
    overall,
    band: bandFor(overall),
    capped,
    components: Object.fromEntries(
      Object.entries(components).map(([k, v]) => [k, Math.round(v)])
    ),
    weights: WEIGHTS,
    inputs: profile
  };
}
