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

// MEASURED, not guessed: the first 11 episodes (Aug 26 - Sep 22, 2026) ran
// a median 179 words per minute at speed 1.06 once the inserted pauses are
// taken out. The seed value of 140 overstated every published duration by
// about 27 percent. This number is now only a pre-synthesis estimate - the
// published duration is measured from the MP3 itself (mp3DurationSeconds).
export const WORDS_PER_MINUTE = 179;

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
  // ELEVENLABS_BASE_URL exists only so the offline integration test can
  // point at a local mock. Production never sets it.
  const base = env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io";
  const url = `${base}/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

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

// MPEG audio frame tables: bitrate (kbps) by index for MPEG-1 and MPEG-2/2.5
// Layer III, and sample rate by version.
const MP3_BITRATES = {
  1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
};
const MP3_SAMPLE_RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

/**
 * The real playback length of an MP3, from its frame headers. This is what
 * <itunes:duration> reports - never an estimate. Skips an ID3v2 tag if the
 * provider ever adds one, and resyncs past any stray bytes.
 */
export function mp3DurationSeconds(bytes) {
  let i = 0;
  if (bytes.length > 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    i = 10 + ((bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9]);
  }
  let samples = 0;
  let sampleRate = 0;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff || (bytes[i + 1] & 0xe0) !== 0xe0) { i++; continue; }
    const version = (bytes[i + 1] >> 3) & 3; // 3 = MPEG-1, 2 = MPEG-2, 0 = MPEG-2.5
    const layer = (bytes[i + 1] >> 1) & 3; // 1 = Layer III
    const bitrateIndex = (bytes[i + 2] >> 4) & 15;
    const rateIndex = (bytes[i + 2] >> 2) & 3;
    const padding = (bytes[i + 2] >> 1) & 1;
    if (version === 1 || layer !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3) { i++; continue; }
    const kbps = MP3_BITRATES[version === 3 ? 1 : 2][bitrateIndex];
    sampleRate = MP3_SAMPLE_RATES[version][rateIndex];
    const samplesPerFrame = version === 3 ? 1152 : 576;
    samples += samplesPerFrame;
    i += Math.floor(((samplesPerFrame / 8) * kbps * 1000) / sampleRate) + padding;
  }
  return sampleRate ? samples / sampleRate : 0;
}

/**
 * @returns {{ audio: Uint8Array, byteLength: number, blocks: number,
 *             durationSeconds: number, estimatedDurationSeconds: number,
 *             speed: number }}
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

  // The published duration is measured from the audio we actually got
  // back. The words-per-minute estimate is kept alongside it as a drift
  // check: if the two diverge, the pacing assumption needs recalibrating.
  const wpm = Number(env.WORDS_PER_MINUTE || WORDS_PER_MINUTE);
  const estimatedDurationSeconds = Math.round((wordCount / wpm) * 60 + breakSeconds);
  const measured = mp3DurationSeconds(audio);

  return {
    audio,
    byteLength: audio.length,
    blocks: blocks.length,
    durationSeconds: measured > 0 ? Math.round(measured) : estimatedDurationSeconds,
    durationMeasured: measured > 0,
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
