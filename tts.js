// tts.js
// The file with the most gotchas in the whole pipeline. Read the comments
// before changing numbers here.

const ELEVEN_MODEL = "eleven_flash_v2_5";
const MAX_BLOCK_CHARS = 8000; // model supports 40k; cap anyway and stitch

// Speed: confirmed working range is 0.7 to 1.2, default 1.0. The API
// hard-rejects out-of-range with a 400 rather than clamping, so clamp here.
const SPEED_MIN = 0.7;
const SPEED_MAX = 1.2;
const DEFAULT_SPEED = 1.06;

// Voice settings tuned for deliberate briefing delivery rather than
// conversational. Retune after you have actually listened to episode one.
const VOICE_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.8,
  style: 0.15,
  use_speaker_boost: true
};

// START AT 140 AND RECALIBRATE. Time a real episode's playback against its
// real word count and set this to the measured value. A 20 percent gap
// between assumed and actual pacing has shipped in this pattern before.
export const WORDS_PER_MINUTE = 140;

/**
 * Pronunciation layer. Rewrites ONLY the text sent to ElevenLabs. Display
 * titles, RSS titles and on-page text keep the real spelling.
 * Route every string that reaches TTS through here, including strings
 * assembled from the content pool - a fix applied only at the top-level
 * script call has missed nested text before.
 */
const SPEAKABLE = [
  [/\bRFP\b/g, "R F P"],
  [/\bRFPs\b/g, "R F Ps"],
  [/\bSBIR\b/g, "SBIR"],
  [/\bSTTR\b/g, "S T T R"],
  [/\bCC&Rs?\b/g, "C C and Rs"],
  [/\bCAM\b/g, "CAM"],
  [/\bHOA\b/g, "H O A"],
  [/\bHOAs\b/g, "H O As"],
  [/\bOSHA\b/g, "OH-shuh"],
  [/\bHIPAA\b/g, "HIP-uh"],
  [/\bFOIA\b/g, "FOY-uh"],
  [/\bEHR\b/g, "E H R"],
  [/\bFHIR\b/g, "fire"],
  [/\bAMS\b/g, "A M S"],
  [/\bIRB\b/g, "I R B"],
  [/\bE&O\b/g, "errors and omissions"],
  [/\bP&C\b/g, "property and casualty"],
  [/\bAS9100\b/g, "A S nine one hundred"],
  [/\bIRC\/IBC\b/g, "I R C and I B C"],
  [/\b2 CFR 200\b/g, "two C F R two hundred"],
  [/\b34 CFR 668\.14\b/g, "thirty four C F R six sixty eight point fourteen"],
  [/\bASC 842\b/g, "A S C eight forty two"],
  [/\bCDL\b/g, "C D L"],
  [/\bHVAC\b/g, "H V A C"],
  [/\bSDVOSB\b/g, "S D V O S B"],
  [/\b8\(a\)\b/g, "eight A"],
  [/\bSAM\b/g, "SAM"],
  [/\bPOS\b/g, "point of sale"],
  [/\bSKUs?\b/g, (m) => (m.endsWith("s") ? "skews" : "skew")],
  [/\bPHI\b/g, "P H I"],
  [/\bCJIS\b/g, "SEE-jiss"],
  [/\bIPEDS\b/g, "EYE-peds"],
  [/\bCMS\b/g, "C M S"],
  [/\bKFF\b/g, "K F F"],
  [/\bGAO\b/g, "G A O"],
  [/\bB2B\b/g, "business to business"],
  [/\bLATAM\b/g, "Latin America"],
  [/\bTMS\b/g, "T M S"],
  [/\bMDR\b/g, "M D R"],
  [/\bIVDR\b/g, "I V D R"],
  [/\bOEMs?\b/g, (m) => (m.endsWith("s") ? "O E Ms" : "O E M")],
  [/\bClaude\b/g, "Clawed"],
  [/\bAI\b/g, "A I"],
  [/\bLLMs?\b/g, (m) => (m.endsWith("s") ? "L L Ms" : "L L M")]
];

export function speakable(text) {
  let out = String(text || "");
  for (const [pattern, replacement] of SPEAKABLE) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/** For any descriptive text assembled from the content pool - titles,
 *  category names, competitor lists - that also reaches TTS. */
export function speakableDescription(parts) {
  return speakable(parts.filter(Boolean).join(". "));
}

/** Split on paragraph, then sentence, so a stitch never lands mid-sentence. */
function chunk(text, maxChars = MAX_BLOCK_CHARS) {
  if (text.length <= maxChars) return [text];

  const blocks = [];
  let current = "";

  const paragraphs = text.split(/\n{2,}/);
  for (const p of paragraphs) {
    const candidate = current ? `${current}\n\n${p}` : p;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) blocks.push(current);

    if (p.length <= maxChars) {
      current = p;
      continue;
    }
    // A single paragraph over the cap - fall back to sentence splitting.
    let sentenceBuf = "";
    for (const sentence of p.match(/[^.!?]+[.!?]+\s*|.+$/g) || [p]) {
      if ((sentenceBuf + sentence).length > maxChars) {
        if (sentenceBuf) blocks.push(sentenceBuf.trim());
        sentenceBuf = sentence;
      } else {
        sentenceBuf += sentence;
      }
    }
    current = sentenceBuf;
  }
  if (current) blocks.push(current);
  return blocks.filter((b) => b.trim());
}

async function synthesizeBlock(env, text, speed) {
  const voiceId = env.NARRATOR_VOICE_ID; // Voice ID string, never a display name
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": env.ELEVENLABS_API_KEY,
      "content-type": "application/json",
      accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: ELEVEN_MODEL,
      voice_settings: { ...VOICE_SETTINGS, speed }
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 300)}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

/** Sum of all SSML break durations in a string, in seconds. Used to correct
 *  the duration estimate - the pauses we deliberately inserted are real
 *  elapsed time that the words-per-minute math alone would not capture. */
export function sumBreakSeconds(text) {
  const matches = String(text || "").matchAll(/<break time="([\d.]+)s"\s*\/>/g);
  let total = 0;
  for (const m of matches) total += parseFloat(m[1]) || 0;
  return total;
}

/**
 * @returns {{ audio: Uint8Array, byteLength: number, blocks: number,
 *             estimatedDurationSeconds: number, speed: number }}
 */
export async function narrate(env, narrationForSpeech, wordCount) {
  const speed = Math.min(
    SPEED_MAX,
    Math.max(SPEED_MIN, Number(env.NARRATOR_SPEED || DEFAULT_SPEED))
  );

  const breakSeconds = sumBreakSeconds(narrationForSpeech);
  const spoken = speakable(narrationForSpeech);
  const blocks = chunk(spoken);

  const parts = [];
  for (const block of blocks) {
    parts.push(await synthesizeBlock(env, block, speed));
  }

  // MP3 frame concatenation. Fine for same-voice, same-settings blocks from
  // one provider; the boundary is inaudible at paragraph breaks.
  const total = parts.reduce((n, p) => n + p.length, 0);
  const audio = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    audio.set(p, offset);
    offset += p.length;
  }

  // Computed here from the real word count plus the real inserted pause
  // time - never read from a provider response or a model's self-report.
  const wpm = Number(env.WORDS_PER_MINUTE || WORDS_PER_MINUTE);
  const estimatedDurationSeconds = Math.round((wordCount / wpm) * 60 + breakSeconds);

  return {
    audio,
    byteLength: audio.length,
    blocks: blocks.length,
    estimatedDurationSeconds,
    speed
  };
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
