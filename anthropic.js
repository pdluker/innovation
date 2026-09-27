// anthropic.js
// Every Claude call in the Worker goes through here, on the official SDK.
//
// Two models, on purpose:
//   BRIEF_MODEL writes the narrated brief. Unchanged since launch - its
//   voice is what the show sounds like, so switching it is a product
//   decision, not a code one.
//   CHECK_MODEL does everything that has to be right rather than well
//   written: the fact-check pass, the validation kit, promoting a seed into
//   a researched entry, and the 90-day revisit. It returns structured JSON
//   (output_config.format), so nothing downstream parses free text.
//
// CHECK_MODEL requests opt into server-side refusal fallback: if the model
// declines, the API re-runs the request on Anthropic's recommended fallback
// inside the same call. A refusal that survives the chain throws, and every
// caller treats a throw as "ship without this step", never as a failed
// episode.

import Anthropic from "@anthropic-ai/sdk";

export const BRIEF_MODEL = "claude-sonnet-4-6";
export const CHECK_MODEL = "claude-opus-5";

const FALLBACK_BETA = "server-side-fallback-2026-07-01";

// Structured outputs on the check model. Non-streaming requests keep
// max_tokens where the SDK's HTTP timeout is comfortable.
const DEFAULT_MAX_TOKENS = 16000;

/** ANTHROPIC_BASE_URL exists so the offline integration test can point the
 *  Worker at a local mock. Production never sets it. */
export function anthropicClient(env) {
  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    baseURL: env.ANTHROPIC_BASE_URL || undefined,
    maxRetries: 2
  });
}

export function textOf(message) {
  return (message.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** A refusal is a normal HTTP 200 - it has to be checked before content is read. */
function assertAnswered(message, what) {
  if (message.stop_reason === "refusal") {
    const category = (message.stop_details && message.stop_details.category) || "unspecified";
    throw new Error(`${what}: model declined (${category})`);
  }
}

/**
 * Plain call on the brief model. Returns the text.
 * @param {object} env
 * @param {{ system: string, messages: object[], maxTokens?: number }} req
 */
export async function briefCall(env, { system, messages, maxTokens = 4000 }) {
  const message = await anthropicClient(env).messages.create({
    model: BRIEF_MODEL,
    max_tokens: maxTokens,
    system,
    messages
  });
  assertAnswered(message, "brief");
  const text = textOf(message);
  if (!text) throw new Error("brief: model returned no text");
  return text;
}

/**
 * Check-model request with the refusal fallback opted in. If the API
 * rejects the request as invalid (400) - for instance if the fallback beta
 * is ever unavailable to this account - it is retried once without the
 * fallback, since a request that is wrong for one reason is not fixed by
 * sending it again unchanged.
 */
async function checkModelCreate(client, params) {
  try {
    return await client.beta.messages.create({ ...params, betas: [FALLBACK_BETA], fallbacks: "default" });
  } catch (err) {
    if (!(err instanceof Anthropic.BadRequestError)) throw err;
    console.log(`check model 400 with refusal fallback, retrying without it: ${err.message}`);
    return client.beta.messages.create(params);
  }
}

/**
 * Structured call on the check model: the reply is JSON matching `schema`.
 * @param {object} env
 * @param {{ what: string, system: string, messages: object[], schema: object, maxTokens?: number }} req
 */
export async function structuredCall(env, { what, system, messages, schema, maxTokens = DEFAULT_MAX_TOKENS }) {
  const message = await checkModelCreate(anthropicClient(env), {
    model: CHECK_MODEL,
    max_tokens: maxTokens,
    system,
    messages,
    output_config: { format: { type: "json_schema", schema } }
  });
  assertAnswered(message, what);
  if (message.stop_reason === "max_tokens") throw new Error(`${what}: output truncated at max_tokens`);
  return JSON.parse(textOf(message));
}

/**
 * Research call on the check model with web search. Returns the model's
 * written findings as plain text plus every URL the search actually
 * returned, so the structuring step can refuse to cite anything else.
 * (Structured outputs cannot be combined with search citations, so research
 * and structuring are two calls.)
 */
export async function researchCall(env, { what, system, prompt, maxSearches = 8, maxTokens = DEFAULT_MAX_TOKENS }) {
  const client = anthropicClient(env);
  const messages = [{ role: "user", content: prompt }];
  const tools = [{ type: "web_search_20260209", name: "web_search", max_uses: maxSearches }];

  let message;
  // A long server-side search loop can pause; resume by re-sending the
  // paused turn as-is (no extra "continue" message). Bounded.
  for (let turn = 0; turn < 4; turn++) {
    message = await checkModelCreate(client, {
      model: CHECK_MODEL,
      max_tokens: maxTokens,
      system,
      messages,
      tools
    });
    assertAnswered(message, what);
    if (message.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: message.content });
  }

  const urls = new Set();
  for (const m of messages.filter((x) => x.role === "assistant").map((x) => x.content).concat([message.content])) {
    for (const block of m || []) {
      if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const r of block.content) if (r.url) urls.add(r.url);
      }
      if (block.type === "text" && Array.isArray(block.citations)) {
        for (const c of block.citations) if (c.url) urls.add(c.url);
      }
    }
  }
  return { text: textOf(message), urls: Array.from(urls) };
}
