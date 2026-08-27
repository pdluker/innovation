// art.js
// OPTIONAL step. The orchestrator wraps this in try/catch and ships the
// episode without it on any failure (spec gotcha 6).
//
// Deterministic SVG rather than a generated raster: it costs nothing, never
// rate-limits, never hallucinates text into the image, and renders crisply
// on the archive page. The RSS <itunes:image> points at a single static
// show cover (3000x3000 PNG/JPEG, uploaded once to cover/show.jpg) because
// Apple requires a raster there.

const CATEGORY_HUES = {
  "Vertical AI": [188, 42],
  "AI Ops": [162, 48],
  "Data Products": [38, 74],
  "AI Services": [206, 40],
  "Infra & Tooling": [268, 36],
  "Consumer AI": [340, 46],
  "Physical + AI": [96, 40]
};

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * A capital ledger bar rendered as the cover. The image IS the data:
 * segment widths are the real allocation against the 100k ceiling.
 */
export function buildCoverSvg(idea, dateKey) {
  const [hue, sat] = CATEGORY_HUES[idea.category] || [200, 40];
  const size = 1400;
  const barY = 900;
  const barH = 74;
  const barX = 120;
  const barW = size - 240;

  // Scale against the 100k ceiling so the empty space is meaningful.
  const ceiling = 100000;
  const usedW = (idea.capital.total / ceiling) * barW;

  let x = barX;
  const segments = idea.capital.lines
    .map((line, i) => {
      const w = (line.amount / ceiling) * barW;
      const l = 30 + i * 9;
      const rect = `<rect x="${x.toFixed(1)}" y="${barY}" width="${Math.max(w - 3, 2).toFixed(1)}" height="${barH}" fill="hsl(${hue} ${sat}% ${l}%)" />`;
      x += w;
      return rect;
    })
    .join("");

  const title = esc(idea.title);
  const words = title.split(" ");
  const lines = [];
  let buf = "";
  for (const w of words) {
    if ((buf + " " + w).trim().length > 22) {
      lines.push(buf.trim());
      buf = w;
    } else {
      buf = `${buf} ${w}`;
    }
  }
  if (buf.trim()) lines.push(buf.trim());

  const titleSvg = lines
    .slice(0, 5)
    .map((l, i) => `<tspan x="120" dy="${i === 0 ? 0 : 92}">${l}</tspan>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${title}">
  <rect width="${size}" height="${size}" fill="#08171C"/>
  <rect x="0" y="0" width="${size}" height="10" fill="hsl(${hue} ${sat}% 52%)"/>
  <text x="120" y="180" font-family="ui-monospace, Menlo, monospace" font-size="30" letter-spacing="8" fill="hsl(${hue} ${sat}% 62%)">INNOVATION DAILY</text>
  <text x="120" y="240" font-family="ui-monospace, Menlo, monospace" font-size="30" letter-spacing="4" fill="#5E7C85">${esc(dateKey)} / ${esc(idea.category.toUpperCase())}</text>
  <text x="120" y="440" font-family="Georgia, serif" font-size="82" fill="#EAF4F3">${titleSvg}</text>
  <text x="120" y="${barY - 34}" font-family="ui-monospace, Menlo, monospace" font-size="28" letter-spacing="4" fill="#5E7C85">CAPITAL ${idea.capital.total.toLocaleString("en-US")} OF 100,000 CEILING</text>
  <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" fill="#102A31"/>
  ${segments}
  <rect x="${(barX + usedW).toFixed(1)}" y="${barY}" width="2" height="${barH}" fill="hsl(${hue} ${sat}% 70%)"/>
  <text x="120" y="${barY + 150}" font-family="ui-monospace, Menlo, monospace" font-size="30" letter-spacing="4" fill="#5E7C85">EXECUTION COMPLEXITY ${idea.complexity} OF 5</text>
</svg>`;
}
