// A tiny procedural audio engine — no external asset files, everything here
// is synthesized with the Web Audio API. Background music is a generative
// pirate sea-shanty step sequencer (walking bass, concertina chord stabs, a
// boot-stomp beat, a wandering fiddle-ish melody, a fife accent); every
// sound effect is a short synthesized cue built from oscillators/noise,
// each one shaped to actually resemble the thing it's cueing (a cast
// whooshes, a snap twangs, a level-up arpeggiates upward) rather than all
// sharing one generic "blip" timbre. Browsers block audio until a real user
// gesture, so the AudioContext is created lazily the first time
// ensureAudioContext() is called — main.js does that from a document-level
// click listener, which also covers the "click" SFX for every button.
let ctx = null;
let masterGain, musicGain, sfxGain;
let musicEnabled = true;
let sfxEnabled = true;
let musicIntervalId = null;
let musicStep = 0;
let noiseBuffer = null;

export function ensureAudioContext() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.5;
  masterGain.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = musicEnabled ? 0.2 : 0;
  musicGain.connect(masterGain);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = sfxEnabled ? 1 : 0;
  sfxGain.connect(masterGain);
  return ctx;
}

function getNoiseBuffer() {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(ctx.sampleRate * 0.3);
  noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

// A single short synthesized note — the building block most SFX below are
// made of, so a "cue" is just one or a few of these at staggered delays.
function tone(freq, duration, { type = 'sine', gain = 0.2, delay = 0, attack = 0.012, decay, sweepTo, sweepTime } = {}) {
  if (!ctx || !sfxEnabled) return;
  const t0 = ctx.currentTime + delay;
  const end = t0 + (decay || duration);
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo != null) osc.frequency.exponentialRampToValueAtTime(sweepTo, t0 + (sweepTime || duration));
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(g);
  g.connect(sfxGain);
  osc.start(t0);
  osc.stop(end + 0.05);
}

// A filtered noise burst — the other building block, used for anything
// with a "whoosh"/"hiss"/"crack" texture instead of a clean pitch.
function noiseBurst(duration, { filterType = 'bandpass', freq = 900, q = 0.7, gain = 0.2, delay = 0, attack = 0.015 } = {}) {
  if (!ctx || !sfxEnabled) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer();
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(sfxGain);
  src.start(t0);
  src.stop(t0 + duration + 0.05);
}

// ---------- SFX ----------

export function playClick() {
  if (!ctx) return;
  tone(880, 0.06, { type: 'triangle', gain: 0.1 });
}

// A rod flick, not just a tone sweep: a soft transient "snap" of the wrist
// (a short high click) immediately followed by the line whistling out
// (a descending pitch sweep layered under a fast-fading noise whoosh).
export function playCast() {
  if (!ctx || !sfxEnabled) return;
  tone(1400, 0.02, { type: 'triangle', gain: 0.09, attack: 0.002, decay: 0.03 });
  tone(560, 0.26, { type: 'sine', gain: 0.15, sweepTo: 190, sweepTime: 0.26, delay: 0.015 });
  noiseBurst(0.22, { filterType: 'highpass', freq: 2200, q: 0.4, gain: 0.05, delay: 0.02 });
}

// The light "something's there" tap under the bobber — a quick, high,
// narrow-band tick rather than a real splash (see playLandingSplash for
// that), so it reads as a nibble against the water, not a full plop.
export function playSplash() {
  noiseBurst(0.35, { filterType: 'bandpass', freq: 900, q: 0.7, gain: 0.22 });
}

// The real splash — the bobber actually hitting the water on cast landing,
// or a hooked fish thrashing the surface. Lower and broader than the
// nibble tick above, with a soft low "plop" thump underneath and a
// second, quieter droplet decay trailing after — one impact, then the
// water settling.
export function playLandingSplash() {
  if (!ctx || !sfxEnabled) return;
  noiseBurst(0.4, { filterType: 'bandpass', freq: 500, q: 0.6, gain: 0.24 });
  tone(160, 0.16, { type: 'sine', gain: 0.14, sweepTo: 70, sweepTime: 0.16, attack: 0.004 });
  noiseBurst(0.25, { filterType: 'bandpass', freq: 1400, q: 1.4, gain: 0.08, delay: 0.09 });
}

// A short ascending chime — more notes stack in for a higher rarity catch,
// and rank 4+ (Gargantuan and up) gets a bright bell-like sparkle riding on
// top of the last note, so a Secret-tier fish audibly sounds like a bigger
// deal than a Common instead of just "the same jingle, longer."
export function playCatch(rarityRank = 0) {
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568];
  const count = Math.max(2, Math.min(notes.length, 2 + Math.floor(rarityRank / 1.5)));
  for (let i = 0; i < count; i++) {
    tone(notes[i], 0.32, { type: 'triangle', gain: 0.15, delay: i * 0.07, decay: 0.3 });
  }
  if (rarityRank >= 4) {
    const sparkleDelay = count * 0.07;
    [2093, 2637, 3136].forEach((f, i) => {
      tone(f, 0.22, { type: 'sine', gain: 0.06, delay: sparkleDelay + i * 0.045, decay: 0.2 });
    });
  }
}

// A real snap: a fast downward-pitched "twang" pluck (the line itself)
// stacked on a low wood-creak thump (the rod jolting) — sharper and more
// physical than a plain low tone pair.
export function playSnap() {
  if (!ctx) return;
  tone(520, 0.09, { type: 'sawtooth', gain: 0.18, sweepTo: 80, sweepTime: 0.09, attack: 0.002 });
  tone(90, 0.25, { type: 'sawtooth', gain: 0.2, decay: 0.22, delay: 0.02 });
  tone(65, 0.3, { type: 'square', gain: 0.13, delay: 0.05, decay: 0.28 });
  noiseBurst(0.12, { filterType: 'lowpass', freq: 400, q: 0.5, gain: 0.1, delay: 0.02 });
}

export function playCoin() {
  if (!ctx) return;
  tone(988, 0.08, { type: 'square', gain: 0.09 });
  tone(1319, 0.14, { type: 'square', gain: 0.11, delay: 0.05 });
  tone(1976, 0.1, { type: 'triangle', gain: 0.05, delay: 0.06, decay: 0.09 });
}

export function playAchievement() {
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((f, i) => tone(f, 0.35, { type: 'triangle', gain: 0.17, delay: i * 0.085, decay: 0.32 }));
  notes.forEach((f, i) => tone(f / 2, 0.35, { type: 'square', gain: 0.05, delay: i * 0.085, decay: 0.3 }));
}

// A confirming "thwack" the instant a hookset tap actually lands — a fast
// pitch-pop plus a short knock of noise, distinct from every other cue in
// the fight so the moment reads as "got it" purely by ear.
export function playHookset() {
  if (!ctx) return;
  tone(240, 0.1, { type: 'square', gain: 0.16, sweepTo: 480, sweepTime: 0.06, attack: 0.002, decay: 0.09 });
  noiseBurst(0.06, { filterType: 'bandpass', freq: 1800, q: 1.2, gain: 0.1 });
}

// A dull metallic clink for a Rod Scrap catch — this is hardware coming up
// on the line, not a fish, so it gets a percussive metal-on-metal tap
// instead of anything watery or melodic.
export function playScrap() {
  if (!ctx) return;
  tone(1800, 0.09, { type: 'square', gain: 0.08, decay: 0.08 });
  tone(1200, 0.14, { type: 'triangle', gain: 0.1, delay: 0.03, decay: 0.13 });
  noiseBurst(0.05, { filterType: 'highpass', freq: 3000, q: 0.8, gain: 0.05, delay: 0.01 });
}

// A bright rising arpeggio for leveling up — quicker and more triumphant
// than the catch chime (which only ever climbs 2-6 fixed notes) and
// harmonically distinct from the Achievement fanfare's block chords, so
// the three big "you did something" cues never blur together.
export function playLevelUp() {
  if (!ctx) return;
  const notes = [392.0, 523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(f, 0.18, { type: 'sawtooth', gain: 0.11, delay: i * 0.055, decay: 0.22 }));
  notes.forEach((f, i) => tone(f * 2, 0.14, { type: 'sine', gain: 0.045, delay: i * 0.055 + 0.02, decay: 0.16 }));
}

// A warm, stacked (not sequential) three-note chord for finishing a quest —
// a single resolving "there, done" moment rather than a run of notes, so it
// doesn't compete with the Achievement fanfare's rhythm.
export function playQuestComplete() {
  if (!ctx) return;
  [523.25, 659.25, 783.99].forEach((f) => tone(f, 0.5, { type: 'triangle', gain: 0.13, decay: 0.48 }));
  [1046.5].forEach((f) => tone(f, 0.5, { type: 'sine', gain: 0.06, delay: 0.05, decay: 0.42 }));
}

// A soft low double-thud — a nudge, not an alarm — for "bag full, catch
// released." Deliberately the quietest, dullest cue in the set.
export function playBagFull() {
  if (!ctx) return;
  tone(140, 0.1, { type: 'sine', gain: 0.09, decay: 0.09 });
  tone(110, 0.14, { type: 'sine', gain: 0.08, delay: 0.09, decay: 0.13 });
}

// ---------- Background music ----------
// A generative pirate sea-shanty loop, built as a 64-step (8-bar) step
// sequencer instead of one repeating melodic cell — a walking bass on the
// beat, staccato concertina chord stabs on the off-beat, a boot-stomp/tap
// percussion pattern, a bright fife accent on the downbeat of every bar,
// and a wandering fiddle-ish melody with a real verse shape: bars 1-4 (A)
// outline a minor descent, bars 5-8 (B) lift into the relative major
// territory before resolving back down to the loop point. No composed
// audio file, just oscillators/noise scheduled off a single step counter.
const STEP_DUR = 0.24; // one eighth note at ~125bpm
const STEPS_PER_BAR = 8;
const LOOP_STEPS = STEPS_PER_BAR * 8;

// A section: i - VII - VI - v in A minor ("Drunken Sailor"). B section:
// VI - III - VII - i, the same key's relative-major-leaning move, so the
// second half of the loop actually goes somewhere instead of repeating
// the first half's harmony too.
const CHORD_BASS = [
  110.00, 196.00, 174.61, 164.81, // A section: Am, G, F, E
  174.61, 130.81, 196.00, 110.00, // B section: F, C, G, Am
];

// A single shared natural-minor scale (A B C D E F G) the melody indexes
// into by degree — not strictly chord-locked to each bar, but close enough
// for a folk-tune feel without needing real voice-leading logic.
const SCALE = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0];

// step -> [scaleDegree, lengthInSteps]. Deliberately not evenly spaced —
// rests and held notes give it real phrasing instead of one note per tick.
// Bars 1-4: outlines Am descending, a long run down to G, mirrors it a step
// lower over F, climbs back up. Bars 5-8: lifts higher over F/C/G, peaks
// mid-phrase, then a clean descending run back down to the tonic right
// before the loop restarts.
const MELODY = {
  0: [4, 2], 2: [2, 1], 3: [1, 1], 4: [0, 2], 6: [3, 2],
  8: [4, 2], 10: [3, 1], 11: [2, 1], 12: [1, 2], 14: [0, 2],
  16: [5, 2], 18: [4, 1], 19: [3, 1], 20: [2, 2], 22: [1, 2],
  24: [0, 1], 25: [2, 1], 26: [4, 2], 28: [3, 1], 29: [2, 1], 30: [1, 2],
  32: [5, 2], 34: [4, 1], 35: [3, 1], 36: [5, 2], 38: [6, 2],
  40: [2, 2], 42: [3, 1], 43: [4, 1], 44: [6, 2], 46: [5, 2],
  48: [6, 2], 50: [5, 1], 51: [4, 1], 52: [3, 2], 54: [2, 2],
  56: [4, 2], 58: [3, 1], 59: [2, 1], 60: [1, 2], 62: [0, 2],
};

function playBassNote(t0, freq, dur) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, t0);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.14, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(musicGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// Two detuned voices (square + triangle, root + a rough fifth) for a
// fuller "concertina" pump than one oscillator gives.
function playChordStab(t0, rootFreq, dur) {
  [[1, 'square'], [1.5, 'triangle']].forEach(([mult, type]) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(rootFreq * mult, t0);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.05, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(musicGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  });
}

function playMelodyNote(t0, freq, dur) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, t0);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.15, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(musicGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// A bright, quiet tin-whistle accent doubling the melody an octave up,
// only on the first note of each bar — a light garnish on top of the main
// tune rather than a second full voice, with a fast pitch wobble
// (vibrato) for that reedy fife character.
function playFifeNote(t0, freq, dur) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, t0);
  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = 7;
  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = freq * 0.012;
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.065, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(musicGain);
  osc.start(t0);
  vibrato.start(t0);
  osc.stop(t0 + dur + 0.05);
  vibrato.stop(t0 + dur + 0.05);
}

// A low pitched thump for the "boot stomp" beat — a sine dropping in pitch,
// not filtered noise, so it reads as a stomp/kick rather than a splash.
function playThump(t0, freq = 110) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t0 + 0.12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.12, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
  osc.connect(g);
  g.connect(musicGain);
  osc.start(t0);
  osc.stop(t0 + 0.16);
}

// A quick high-passed noise tick for the off-beat "tap" — the lighter half
// of the stomp-tap jig rhythm.
function playTap(t0) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer();
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.06, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
  src.connect(filter);
  filter.connect(g);
  g.connect(musicGain);
  src.start(t0);
  src.stop(t0 + 0.06);
}

function playMusicStep() {
  if (!ctx || !musicEnabled) return;
  const step = musicStep % LOOP_STEPS;
  musicStep++;
  const bar = Math.floor(step / STEPS_PER_BAR);
  const beat = step % STEPS_PER_BAR;
  const t0 = ctx.currentTime;
  const bassFreq = CHORD_BASS[bar];

  // Bass + stomp land together on beats 1 and 3 of the bar.
  if (beat === 0 || beat === 4) {
    playBassNote(t0, bassFreq, STEP_DUR * 1.7);
    playThump(t0, 110);
  }
  // A lighter tap on the off-stomp (beats 2 and 4).
  if (beat === 2 || beat === 6) {
    playTap(t0);
  }
  // Concertina stabs pump on every off-eighth for that bouncy jig feel.
  if (beat % 2 === 1) {
    playChordStab(t0, bassFreq * 2, STEP_DUR * 0.9);
  }

  const note = MELODY[step];
  if (note) {
    const [degree, lengthSteps] = note;
    const freq = SCALE[degree];
    playMelodyNote(t0, freq, STEP_DUR * lengthSteps * 0.95);
    // The fife doubles only the very first note of each bar, an octave up.
    if (beat === 0) playFifeNote(t0, freq * 2, STEP_DUR * lengthSteps * 0.85);
  }
}

export function startMusic() {
  if (!ctx || musicIntervalId) return;
  musicStep = 0;
  playMusicStep();
  musicIntervalId = setInterval(playMusicStep, STEP_DUR * 1000);
}

export function stopMusic() {
  if (musicIntervalId) {
    clearInterval(musicIntervalId);
    musicIntervalId = null;
  }
}

export function setMusicEnabled(on) {
  musicEnabled = on;
  if (musicGain) musicGain.gain.value = on ? 0.2 : 0;
  if (on) startMusic(); else stopMusic();
}

export function setSfxEnabled(on) {
  sfxEnabled = on;
  if (sfxGain) sfxGain.gain.value = on ? 1 : 0;
}
