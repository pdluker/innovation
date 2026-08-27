// script.js
// Generates the episode script. The model writes the BRIEF, never the FACTS -
// every company name, capital figure and complexity rating comes from
// ideas-source.js and is passed in. Anything the model returns that should
// have been grounded gets overwritten in code below.
//
// Output contract is JSON so the website can render structured sections and
// so word count can be computed in code from real returned text
// (spec gotcha 5: never trust self-reported metadata).

const MODEL = "claude-sonnet-4-6";
const WORD_CEILING = 780;      // hard ship-anyway ceiling
const WORD_TARGET_MAX = 720;   // triggers exactly one tightening retry
const WORD_TARGET_MIN = 540;
const PITCH_MAX_WORDS = 155;   // 60 seconds at this narrator's measured pace

const SYSTEM_PROMPT = `You write a daily audio brief called "Innovation Daily" for a single listener: a senior technology executive with 20+ years in federal contracting and program delivery. He is the narrator. You are writing in HIS voice, to be spoken aloud by his own cloned voice. Write as if he is briefing himself.

STRUCTURE - this brief has a consistent shape every day, and the listener should be able to feel that shape:
1. A short, ritual opening (bluf) that announces today's business by name and gives the one sharpest reason it earns five minutes - this is the daily BLUF, not a teaser.
2. A plain-terms unpacking (plainIntro) of what the business actually is, in ordinary language, before any numbers or jargon - a smart friend explaining it over coffee, not a pitch deck.
3. The formal elevator pitch, the need, the field, the complexity read, the start plan, and the close.

TRANSITIONS MATTER: every section from theNeed onward must open by bridging from what was just said - a genuine connective thought in his voice ("That's the pitch. Here's why it exists at all." / "So who already owns this?" / "None of that matters if the complexity kills it."), never a flat restart and never meta-commentary like "next, let's discuss" or "moving on to." If a section could be lifted out and dropped into a different episode unchanged, the transition is missing.

SENTENCE PACING: write in complete, separately-breathing sentences. Avoid stacking two or three clauses into one run-on sentence with commas - break them into short, separate sentences instead. A listener needs a beat to absorb each claim before the next one lands. This is a spoken brief, not a dense paragraph read aloud.

VOICE - this is the part that matters most:
- Decisive executive. He has earned his opinions and he states them. He leads with the conclusion.
- Data-anchored. Quantify whenever the source material gives you a number. Never invent one.
- Problem, then analysis, then recommendation. That is his natural sequence.
- Short declarative sentences for emphasis, mixed with medium ones. Never a paragraph of all-short or all-long.
- He uses categorical reframing: "This is not a tooling problem. It is a distribution problem."
- He does NOT hedge. Cut "seems to", "it appears", "roughly", "we believe", "I think we should", "arguably", "potentially".
- He does NOT hype. No "game-changer", "revolutionary", "disrupt", "unlock", "leverage AI to", "in today's fast-paced world".
- He treats the listener as a capable peer. No explaining what an LLM is. No congratulating the listener.
- Honest about weakness. If the moat is thin, say the moat is thin. A brief that only sells is a brief he stops trusting.

HARD FORMATTING RULES:
- ASCII characters only. Straight apostrophes and quotes. Use " - " (space hyphen space) where you would want an em dash. No em dashes, en dashes, curly quotes, ellipsis characters, or accented letters. This is a hard requirement, not a preference.
- Write for the ear. Say "about forty thousand dollars", not "$40K". Say "twenty to thirty percent", not "20-30%". Spell out numbers the way a person says them out loud.
- No headings, no bullet characters, no markdown, no stage directions, no "[pause]". Flowing spoken prose only. Do not include SSML or break tags yourself - pacing between sections is handled separately in code.
- Never address an audience as plural. No "folks", no "everyone", no "welcome back". One listener.

You must respond with a single JSON object and nothing else. No preamble, no markdown fences.`;

function userPrompt(idea, dateKey) {
  const capitalLines = idea.capital.lines
    .map((l) => `  - ${l.label}: ${l.amount} dollars`)
    .join("\n");

  return `Today is ${dateKey}. Write today's brief on this vetted business concept.

GROUNDED SOURCE MATERIAL - use these facts, do not add companies or numbers that are not here:

Title: ${idea.title}
Category: ${idea.category}
Thesis: ${idea.thesis}
Who pays: ${idea.customer}
Why it exists now: ${idea.need}
Real competitors and incumbents: ${idea.competitors.join(", ")}
Execution complexity: ${idea.complexity} out of 5. Reason: ${idea.complexityWhy}
Total startup capital: ${idea.capital.total} dollars, allocated as:
${capitalLines}
First 90 days:
  Days 1-30: ${idea.firstNinety[0]}
  Days 31-60: ${idea.firstNinety[1]}
  Days 61-90: ${idea.firstNinety[2]}
Where Claude covers the skill gap: ${idea.claudeRole}
Moat: ${idea.moat}
Sourcing: ${idea.sourceNotes}

Return exactly this JSON shape:

{
  "bluf": "One or two sentences. The ritual daily opening. Name today's business plainly and state the single sharpest reason it earns five minutes. This is the BLUF - direct and declarative, not a teaser, not a greeting. No date, no show name.",
  "plainIntro": "Roughly 70-100 words. Before any numbers or jargon, explain in ordinary language what this business actually does and for whom - the way you would explain it to a smart friend over coffee. Bridge naturally out of the bluf. Do not repeat the bluf's sentence, build on it.",
  "elevatorPitch": "The formal 60-second pitch, spoken. ${PITCH_MAX_WORDS} words maximum, and treat that as a real ceiling. The listener already knows what this is from plainIntro - do not re-explain the basic concept. This section adds the mechanics: who specifically pays, why now, and exactly what makes the money. Open with a one-clause bridge from plainIntro, not a restart.",
  "theNeed": "Roughly 110 to 140 words on why this need exists right now and why it was not addressable three years ago. Open by bridging from the pitch - what in the pitch demands justification is what this section answers. Be specific about the buyer's current alternative and what it costs them.",
  "theField": "Roughly 100 to 130 words on the named competitors above. Open by bridging from the need - now that the pain is established, who already profits from it. Name the real companies. Do not pretend the space is empty. State specifically where the gap is that a one-person operation can enter through.",
  "complexityRead": "Roughly 70 to 100 words. Open by bridging from the field - the competitive picture just described is what makes this easy or hard to actually enter. State the complexity rating out of five plainly, then say what the actual hard part is. Be honest about the failure mode that kills this business if it gets ignored.",
  "howToStart": "Roughly 130 to 170 words. Open by bridging from the complexity read - acknowledge the hard part just named, then say what you would do about it. The 30-60-90 above in his own words, then the capital allocation spoken as a plan. State the total. Walk the major line items. Close on what the money is really buying, and be blunt that the first dollars are buying evidence, not product.",
  "close": "Two or three sentences. Open by bridging from howToStart - not a summary, the one thing he would actually do this week if he took this seriously. Clean sign-off. No call to action, no subscribe, no next-episode teaser.",
  "bearCase": "WRITTEN ONLY - never spoken. Roughly 70-100 words. Argue against doing this, honestly, as the skeptic in the room. Name the specific reason this fails, not a generic risk - who already owns the relationship, what makes the moat thin, what assumption is most likely wrong. If you cannot find a real weakness, say what would have to break for this to fail rather than inventing a token caveat.",
  "assumptions": ["WRITTEN ONLY - never spoken. An array of exactly 4 short, testable, falsifiable claims - the things that would have to be true for this to become a real business, not vague optimism. Each one should be checkable within the first 90 days. Example shape: a specific price point customers must accept, a specific cost or time reduction AI must deliver, a specific acquisition cost ceiling, a specific usage frequency."],
  "verdict": "WRITTEN ONLY - never spoken. One direct sentence stating pursue, pass, or watch-only, followed by one sentence of reasoning tied to the strongest specific fact above. State it plainly - do not hide behind 'it depends'.",
  "pullQuote": "One sentence from anywhere in the brief that works as a written headline on the archive page. Under 20 words.",
  "tags": ["three to five short lowercase tags"]
}`;
}

function stripFences(text) {
  return text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

/** Belt and braces on top of the prompt rule. Non-ASCII silently corrupts
 *  through PowerShell 5.1 boundaries (spec gotcha 3), so normalise here too. */
export function toAscii(s) {
  if (typeof s !== "string") return s;
  return s
    .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201F\u2033]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/[^\x20-\x7E\n]/g, "");
}

export function countWords(s) {
  return (s || "").trim().split(/\s+/).filter(Boolean).length;
}

// Spoken sections, in order. These are the only ones that reach ElevenLabs
// and the only ones counted against the audio word budget.
const SECTION_ORDER = [
  "bluf",
  "plainIntro",
  "elevatorPitch",
  "theNeed",
  "theField",
  "complexityRead",
  "howToStart",
  "close"
];

// Written-only sections. Never narrated, never word-budgeted against the
// audio ceiling. The archive page is deliberately allowed to say more than
// the audio does - the audio is the invitation, the page is the asset.
const WRITTEN_ONLY_ORDER = ["bearCase", "assumptions", "verdict"];

// SSML pause length inserted after each section, in code - not left to the
// model to remember, and not text the model can accidentally narrate as
// words. Confirmed supported on eleven_flash_v2_5 (ElevenLabs docs, Aug
// 2026): "<break time="Xs" />" produces a real, controllable pause rather
// than relying on punctuation alone. Kept short and used sparingly per
// ElevenLabs' own guidance - excessive break tags can destabilize delivery.
const BREAK_AFTER = {
  bluf: 0.4,
  plainIntro: 0.6,
  elevatorPitch: 0.7,
  theNeed: 0.6,
  theField: 0.6,
  complexityRead: 0.6,
  howToStart: 0.8
  // nothing after "close" - it's the end of the recording
};

/** Clean narration: what the listener's transcript shows and what the word
 *  budget is computed from. No SSML markup in here, ever. */
export function assembleNarration(sections) {
  return SECTION_ORDER.map((k) => (sections[k] || "").trim())
    .filter(Boolean)
    .join("\n\n");
}

/** Speech narration: the same content with deterministic pause tags
 *  inserted between sections. This is what actually gets sent to
 *  ElevenLabs - never shown to the reader, never counted as words. */
export function assembleForSpeech(sections) {
  const parts = [];
  for (const key of SECTION_ORDER) {
    const text = (sections[key] || "").trim();
    if (!text) continue;
    parts.push(text);
    if (BREAK_AFTER[key]) parts.push(`<break time="${BREAK_AFTER[key]}s" />`);
  }
  return parts.join("\n\n");
}

async function callModel(env, messages, maxTokens = 2000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  if (!text) throw new Error("Anthropic API returned no text content");
  return text;
}

function parseSections(raw) {
  const parsed = JSON.parse(stripFences(raw));
  const out = {};
  for (const k of SECTION_ORDER) {
    if (typeof parsed[k] !== "string" || !parsed[k].trim()) {
      throw new Error(`model omitted required section "${k}"`);
    }
    out[k] = toAscii(parsed[k]).trim();
  }
  for (const k of ["bearCase", "verdict"]) {
    if (typeof parsed[k] !== "string" || !parsed[k].trim()) {
      throw new Error(`model omitted required written-only section "${k}"`);
    }
    out[k] = toAscii(parsed[k]).trim();
  }
  if (!Array.isArray(parsed.assumptions) || parsed.assumptions.length === 0) {
    throw new Error('model omitted required "assumptions" array');
  }
  out.assumptions = parsed.assumptions
    .slice(0, 6)
    .map((a) => toAscii(String(a)).trim())
    .filter(Boolean);

  out.pullQuote = toAscii(parsed.pullQuote || "").trim();
  out.tags = Array.isArray(parsed.tags)
    ? parsed.tags.slice(0, 5).map((t) => toAscii(String(t)).toLowerCase().trim())
    : [];
  return out;
}

/**
 * @returns {{ sections, narration, wordCount, pitchWordCount, retried, overBudget }}
 */
export async function generateScript(env, idea, dateKey) {
  const messages = [{ role: "user", content: userPrompt(idea, dateKey) }];

  let raw = await callModel(env, messages);
  let sections = parseSections(raw);
  let narration = assembleNarration(sections);
  let wordCount = countWords(narration);
  let retried = false;

  const pitchOver = countWords(sections.elevatorPitch) > PITCH_MAX_WORDS + 15;

  // Exactly ONE tightening pass. Never loop (spec section 3, step 2).
  if (wordCount > WORD_TARGET_MAX || pitchOver) {
    retried = true;
    messages.push({ role: "assistant", content: raw });
    messages.push({
      role: "user",
      content: `That came back at ${wordCount} words total, with a ${countWords(sections.elevatorPitch)}-word elevator pitch. The budget is ${WORD_TARGET_MIN} to ${WORD_TARGET_MAX} words total and ${PITCH_MAX_WORDS} words for the pitch. Tighten it. Cut qualifiers and restatement, not substance - every named competitor and every capital figure stays, and every section keeps its bridging opening line. Return the same JSON shape and nothing else.`
    });

    try {
      raw = await callModel(env, messages);
      const tightened = parseSections(raw);
      const tightenedNarration = assembleNarration(tightened);
      // Only accept the retry if it actually helped.
      if (countWords(tightenedNarration) < wordCount) {
        sections = tightened;
        narration = tightenedNarration;
        wordCount = countWords(tightenedNarration);
      }
    } catch (err) {
      console.log(`tightening pass failed, shipping first draft: ${err.message}`);
    }
  }

  return {
    sections,
    narration,                              // clean - for transcript display and word count
    narrationForSpeech: assembleForSpeech(sections), // with SSML pauses - for ElevenLabs only
    wordCount,
    pitchWordCount: countWords(sections.elevatorPitch),
    retried,
    overBudget: wordCount > WORD_CEILING
  };
}

export const SCRIPT_CONSTANTS = { MODEL, WORD_TARGET_MIN, WORD_TARGET_MAX, WORD_CEILING, PITCH_MAX_WORDS };
