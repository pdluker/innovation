// notify.js
// The owner's email after every scheduled run: the brief that published,
// one-tap links to record your own pursue / watch / pass, the ideas waiting
// for review with approve / hold links, and a link to add a seed from your
// phone. A failed run sends an alert instead of silence.
//
// Sent through Resend, same as stl-dispatcher and CivicSignal. Off until
// both secrets exist:
//   npx wrangler secret put RESEND_API_KEY
//   npx wrangler secret put NOTIFY_EMAIL      (the address to send to)
// NOTIFY_FROM defaults to alerts@stluker.com, already verified in Resend.
//
// Links carry signed, single-purpose tokens (auth.js) and only render a
// confirmation page on GET, so a mail scanner that follows every link
// cannot approve anything.

import { linkToken } from "./auth.js";

const DEFAULT_FROM = "Innovation Daily <alerts@stluker.com>";
const LINK_DAYS = { react: 30, review: 14, seed: 30 };

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export async function sendEmail(env, { subject, html, text }) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) {
    console.log("notify: RESEND_API_KEY or NOTIFY_EMAIL not set - email skipped");
    return { sent: false, reason: "not configured" };
  }
  const res = await fetch(`${env.RESEND_BASE_URL || "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.NOTIFY_FROM || DEFAULT_FROM, to: [env.NOTIFY_EMAIL], subject, html, text })
  });
  if (!res.ok) {
    const detail = await res.text();
    console.log(`notify: Resend ${res.status}: ${detail.slice(0, 300)}`);
    return { sent: false, reason: `resend ${res.status}` };
  }
  return { sent: true };
}

async function actLink(env, origin, action, subject, days) {
  return `${origin}/act?t=${await linkToken(env, action, subject, days)}`;
}

/**
 * @param {object} result       runPipeline's return value
 * @param {object} maintenance  runMaintenance's return value
 * @param {object[]} queue      ideas waiting on the owner (listIdeas rows)
 */
export async function notifyOwner(env, origin, result, maintenance = {}, queue = []) {
  if (!result.ok) {
    const subject = `[Innovation Daily] Run failed for ${result.date || "today"}`;
    const text = `The scheduled run did not publish.\n\nError: ${result.error}\n\nCheck: npx wrangler tail innovation-daily\nRetry: POST ${origin}/refresh (Bearer REFRESH_SECRET)`;
    return sendEmail(env, { subject, text, html: `<p>The scheduled run did not publish.</p><p><b>Error:</b> ${esc(result.error)}</p><p>Retry with <code>POST ${esc(origin)}/refresh</code>.</p>` });
  }
  if (result.skipped) return { sent: false, reason: "nothing published" };

  const ep = result.episode;
  const page = `${origin}/${ep.date}`;
  const reactLinks = await Promise.all(
    ["pursue", "watch", "pass"].map(async (r) => ({ r, url: await actLink(env, origin, "react", `${ep.date}:${r}`, LINK_DAYS.react) }))
  );
  const reviewItems = await Promise.all(
    queue.slice(0, 8).map(async (q) => ({
      ...q,
      approve: q.status === "needs-review" ? await actLink(env, origin, "approve", q.id, LINK_DAYS.review) : null,
      hold: q.status === "needs-review" ? await actLink(env, origin, "hold", q.id, LINK_DAYS.review) : null
    }))
  );
  const seedLink = await actLink(env, origin, "seed", "", LINK_DAYS.seed);

  const fc = ep.factCheck ? ep.factCheck.status : "unchecked";
  const fcLine = {
    passed: "Fact-check passed on the first draft.",
    revised: "Fact-check flagged claims; the rewrite passed.",
    cut: "Fact-check flagged claims twice; the flagged sentences were cut before audio. The review log is in R2 under reviews/.",
    unchecked: "Fact-check did not run - see the Worker log."
  }[fc] || fc;

  const extras = [];
  if (maintenance.promoted) extras.push(`Seed researched: ${maintenance.promoted.id} -> ${maintenance.promoted.status}.`);
  if (maintenance.kits && maintenance.kits.length) extras.push(`Validation kits added to ${maintenance.kits.join(", ")}.`);
  if (maintenance.revisits && maintenance.revisits.length) extras.push(`90-day revisit written for ${maintenance.revisits.join(", ")}.`);
  if (maintenance.errors && maintenance.errors.length) extras.push(`Maintenance errors: ${maintenance.errors.join("; ")}`);

  const subject = `Innovation Daily: ${ep.title} (${ep.score} ${ep.band})`;
  const text = [
    `${ep.title}`,
    `${ep.pullQuote}`,
    ``,
    `Call: ${ep.verdict}`,
    `Score ${ep.score} (${ep.band}). ${fcLine}`,
    `Listen: ${page}`,
    ``,
    `Your call (one tap, then confirm):`,
    ...reactLinks.map((l) => `  ${l.r}: ${l.url}`),
    ``,
    reviewItems.length ? `Waiting for you (${queue.length}):` : `Nothing is waiting for review.`,
    ...reviewItems.map((q) => `  [${q.status}] ${q.title || q.seedText || q.id}${q.approve ? `\n    approve: ${q.approve}\n    hold: ${q.hold}` : ""}`),
    ``,
    `Pool: ${result.remainingInPool ?? "?"} verified ideas left before the rotation resets.`,
    `Add an idea: ${seedLink}`,
    `Review screen: ${origin}/admin.html`,
    ...(extras.length ? ["", ...extras] : [])
  ].join("\n");

  const html = `
<div style="font-family:Georgia,serif;max-width:620px;margin:0 auto;color:#1C1712">
  <p style="font-family:monospace;font-size:12px;letter-spacing:.1em;color:#5B5145">INNOVATION DAILY &middot; ${esc(ep.date)}</p>
  <h2 style="margin:0 0 8px">${esc(ep.title)}</h2>
  <p style="font-size:18px">${esc(ep.pullQuote)}</p>
  <p><b>Call:</b> ${esc(ep.verdict)}</p>
  <p>Score ${esc(ep.score)} (${esc(ep.band)}). ${esc(fcLine)}</p>
  <p><a href="${esc(page)}">Open the brief</a></p>
  <p style="margin-top:24px"><b>Your call</b> - one tap, then confirm:</p>
  <p>${reactLinks.map((l) => `<a href="${esc(l.url)}" style="display:inline-block;margin-right:12px">${esc(l.r)}</a>`).join("")}</p>
  <p style="margin-top:24px"><b>${reviewItems.length ? `Waiting for you (${queue.length})` : "Nothing is waiting for review."}</b></p>
  <ul>${reviewItems.map((q) => `<li>[${esc(q.status)}] ${esc(q.title || q.seedText || q.id)}${q.approve ? ` &middot; <a href="${esc(q.approve)}">approve</a> &middot; <a href="${esc(q.hold)}">hold</a>` : ""}</li>`).join("")}</ul>
  <p>Pool: ${esc(result.remainingInPool ?? "?")} verified ideas left before the rotation resets.</p>
  <p><a href="${esc(seedLink)}">Add an idea</a> &middot; <a href="${esc(origin)}/admin.html">Review screen</a></p>
  ${extras.length ? `<p style="font-size:14px;color:#5B5145">${extras.map(esc).join("<br>")}</p>` : ""}
</div>`;

  return sendEmail(env, { subject, html, text });
}
