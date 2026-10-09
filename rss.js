// rss.js
// Built from live stored state at request time. Never from a cached copy,
// never from anything baked into the deploy bundle.
//
// Apple is the strictest client. Two requirements it enforces that almost
// nothing else does (spec gotcha 8):
//   1. <enclosure> needs a real length attribute in bytes
//   2. the audio route must support HTTP Range requests (see index.js)

export const SHOW = {
  title: "Innovation Daily",
  subtitle: "One AI-driven business a day, briefed like it matters.",
  description:
    "A five-minute brief on one buildable AI-driven business. Each episode covers the sixty-second pitch, the need behind it, who already owns the space, an honest execution complexity read, and a ninety-day start plan with the capital laid out. Every concept is constrained to under one hundred thousand dollars in estimated startup capital and to skills a single operator can cover with Claude.",
  author: "Paul Luker",
  ownerEmail: "paul@stluker.com",
  language: "en-us",
  category: "Technology",
  subcategory: "Tech News",
  explicit: "false",
  type: "episodic",
  copyrightYear: new Date().getUTCFullYear()
};

// Carried in the feed as well as on the site: podcast apps show the feed
// text, and a listener may never visit the page.
export const DISCLAIMER =
  "Research and commentary, not financial, legal or investment advice. Capital figures are estimates. Competitors and sources are checked before an idea runs; the method is published at";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rfc2822(dateKey) {
  // Publish at 06:00 America/Chicago, expressed as UTC. Fixed offset is
  // acceptable here because feed readers only use this for ordering.
  const d = new Date(`${dateKey}T11:00:00Z`);
  return d.toUTCString();
}

function itunesDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * @param {object[]} episodes  newest first, from the live manifest
 * @param {string}   origin    e.g. "https://innovation.stluker.com"
 */
export function buildRss(episodes, origin) {
  const showImage = `${origin}/cover/show.jpg`;

  const items = episodes
    .map((ep) => {
      const audioUrl = `${origin}/audio/${ep.date}.mp3`;
      // Path form, not hash - so podcast apps and RSS readers that unfurl
      // this link get the real per-episode preview from the Worker's
      // server-rendered meta tags, not just the generic homepage.
      const pageUrl = `${origin}/${ep.date}`;
      const summary = [
        ep.pullQuote,
        `Innovation Score ${ep.score} of 100 (${ep.band}). Execution complexity ${ep.complexity} of 5. Estimated startup capital ${ep.capitalTotal.toLocaleString("en-US")} dollars.`,
        ep.thesis,
        "Not financial advice."
      ]
        .filter(Boolean)
        .join(" ");

      return `    <item>
      <title>${esc(ep.title)}</title>
      <link>${esc(pageUrl)}</link>
      <guid isPermaLink="false">innovation-daily-${esc(ep.date)}</guid>
      <pubDate>${rfc2822(ep.date)}</pubDate>
      <description>${esc(summary)}</description>
      <itunes:summary>${esc(summary)}</itunes:summary>
      <itunes:author>${esc(SHOW.author)}</itunes:author>
      <itunes:duration>${itunesDuration(ep.durationSeconds)}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
      <itunes:episodeType>full</itunes:episodeType>
      <enclosure url="${esc(audioUrl)}" length="${ep.audioBytes}" type="audio/mpeg" />
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SHOW.title)}</title>
    <link>${esc(origin)}</link>
    <atom:link href="${esc(origin)}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(`${SHOW.description} ${DISCLAIMER} ${origin}/method.html`)}</description>
    <language>${SHOW.language}</language>
    <copyright>Copyright ${SHOW.copyrightYear} ${esc(SHOW.author)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <itunes:author>${esc(SHOW.author)}</itunes:author>
    <itunes:subtitle>${esc(SHOW.subtitle)}</itunes:subtitle>
    <itunes:summary>${esc(`${SHOW.description} ${DISCLAIMER} ${origin}/method.html`)}</itunes:summary>
    <itunes:type>${SHOW.type}</itunes:type>
    <itunes:explicit>${SHOW.explicit}</itunes:explicit>
    <itunes:image href="${esc(showImage)}" />
    <itunes:category text="${esc(SHOW.category)}">
      <itunes:category text="${esc(SHOW.subcategory)}" />
    </itunes:category>
    <itunes:owner>
      <itunes:name>${esc(SHOW.author)}</itunes:name>
      <itunes:email>${esc(SHOW.ownerEmail)}</itunes:email>
    </itunes:owner>
${items}
  </channel>
</rss>`;
}
