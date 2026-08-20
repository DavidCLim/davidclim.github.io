// Procedural audio, no asset files — a dark, driving battle loop (pulsing
// sub-bass, a dissonant pad, a tense arpeggio) plus short synthesized SFX.
// Same "lazily create the AudioContext on first user gesture" pattern as
// every other game in this portfolio.
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
  masterGain.gain.value = 0.55;
  masterGain.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = musicEnabled ? 0.22 : 0;
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

function tone(freq, duration, { type = 'sine', gain = 0.2, delay = 0, attack = 0.01, decay, sweepTo, sweepTime, dest } = {}) {
  if (!ctx) return;
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
  g.connect(dest || sfxGain);
  osc.start(t0);
  osc.stop(end + 0.05);
}

function noiseBurst(duration, { filterType = 'bandpass', freq = 900, q = 0.7, gain = 0.2, delay = 0, dest } = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer();
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest || sfxGain);
  src.start(t0);
  src.stop(t0 + duration + 0.05);
}

// ---------- SFX ----------
export function playClick() {
  if (!ctx) return;
  tone(700, 0.05, { type: 'triangle', gain: 0.1 });
}

export function playPlaceTower() {
  if (!ctx) return;
  tone(440, 0.1, { type: 'square', gain: 0.12, sweepTo: 660, sweepTime: 0.1 });
  tone(880, 0.14, { type: 'sine', gain: 0.08, delay: 0.05, decay: 0.12 });
}

export function playUpgrade() {
  if (!ctx) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.16, { type: 'triangle', gain: 0.13, delay: i * 0.06, decay: 0.15 }));
}

export function playFireShot(pitch = 1) {
  if (!ctx || !sfxEnabled) return;
  tone(300 * pitch, 0.08, { type: 'sawtooth', gain: 0.08, sweepTo: 700 * pitch, sweepTime: 0.06 });
}

export function playHit() {
  if (!ctx || !sfxEnabled) return;
  noiseBurst(0.08, { filterType: 'highpass', freq: 2000, gain: 0.08 });
}

export function playEnemyDeath() {
  if (!ctx || !sfxEnabled) return;
  tone(320, 0.18, { type: 'square', gain: 0.1, sweepTo: 60, sweepTime: 0.18 });
  noiseBurst(0.12, { filterType: 'bandpass', freq: 500, gain: 0.06 });
}

export function playBaseHit() {
  if (!ctx) return;
  tone(140, 0.28, { type: 'sawtooth', gain: 0.2, sweepTo: 50, sweepTime: 0.26 });
  noiseBurst(0.2, { filterType: 'lowpass', freq: 300, gain: 0.15 });
}

export function playDomainExpansion() {
  if (!ctx) return;
  tone(80, 0.6, { type: 'sawtooth', gain: 0.24, decay: 0.55 });
  tone(1600, 0.9, { type: 'sine', gain: 0.1, delay: 0.02, decay: 0.85 });
  [880, 1108.7, 1318.5, 1760].forEach((f, i) => tone(f, 0.5, { type: 'triangle', gain: 0.09, delay: 0.05 + i * 0.05, decay: 0.4 }));
  noiseBurst(0.5, { filterType: 'bandpass', freq: 1200, gain: 0.14, delay: 0.02 });
}

export function playWaveStart() {
  if (!ctx) return;
  [349.23, 440, 523.25].forEach((f, i) => tone(f, 0.22, { type: 'sawtooth', gain: 0.14, delay: i * 0.12, decay: 0.3 }));
}

export function playVictory() {
  if (!ctx) return;
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.4, { type: 'triangle', gain: 0.16, delay: i * 0.1, decay: 0.38 }));
}

export function playDefeat() {
  if (!ctx) return;
  [220, 196, 164.81, 130.81].forEach((f, i) => tone(f, 0.5, { type: 'sawtooth', gain: 0.15, delay: i * 0.22, decay: 0.55 }));
}

// ---------- Background music ----------
// A tense 16-step loop: a pulsing sub-bass on the beat, a dissonant minor
// pad sustained underneath, and a nervous sixteenth-note arpeggio riding
// on top — built to feel like a threat is approaching, not a jaunty tune.
const STEP_DUR = 0.19;
const LOOP_STEPS = 16;
const BASS_NOTE = 55; // A1
const PAD_NOTES = [110, 130.81, 155.56]; // A2, C3, D#3-ish minor cluster
const ARP_NOTES = [220, 261.63, 293.66, 329.63, 293.66, 261.63];

function playBassPulse(t0) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(BASS_NOTE, t0);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 220;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.22, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + STEP_DUR * 1.7);
  osc.connect(filter);
  filter.connect(g);
  g.connect(musicGain);
  osc.start(t0);
  osc.stop(t0 + STEP_DUR * 1.8);
}

function playPad(t0) {
  PAD_NOTES.forEach((f) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f, t0);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.035, t0 + STEP_DUR * 3);
    g.gain.setValueAtTime(0.035, t0 + STEP_DUR * (LOOP_STEPS - 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + STEP_DUR * LOOP_STEPS);
    osc.connect(filter);
    filter.connect(g);
    g.connect(musicGain);
    osc.start(t0);
    osc.stop(t0 + STEP_DUR * LOOP_STEPS + 0.1);
  });
}

function playArpNote(t0, freq) {
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, t0);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.05, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + STEP_DUR * 0.85);
  osc.connect(g);
  g.connect(musicGain);
  osc.start(t0);
  osc.stop(t0 + STEP_DUR + 0.03);
}

function playMusicStep() {
  if (!ctx || !musicEnabled) return;
  const step = musicStep % LOOP_STEPS;
  musicStep++;
  const t0 = ctx.currentTime;

  if (step === 0) playPad(t0);
  if (step % 4 === 0) playBassPulse(t0);
  playArpNote(t0, ARP_NOTES[step % ARP_NOTES.length]);
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
  if (musicGain) musicGain.gain.value = on ? 0.22 : 0;
  if (on) startMusic(); else stopMusic();
}

export function setSfxEnabled(on) {
  sfxEnabled = on;
  if (sfxGain) sfxGain.gain.value = on ? 1 : 0;
}
