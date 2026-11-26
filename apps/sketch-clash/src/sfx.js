// Tiny synthesised sound effects (no audio files): noise bursts and blips through WebAudio.
// `play(name, x)` is cheap and rate-limited so a big battle doesn't turn into a wall of noise.
const SOUNDS = {
  shot: { gap: 0.06, vol: 0.18, noise: { dur: 0.07, f0: 2600, f1: 900, type: 'lowpass' }, tone: { f0: 220, f1: 90, dur: 0.05, type: 'square', vol: 0.5 } },
  snipe: { gap: 0.1, vol: 0.45, noise: { dur: 0.3, f0: 2200, f1: 400, type: 'lowpass' }, tone: { f0: 140, f1: 38, dur: 0.22, type: 'sine', vol: 1 } },
  boom: { gap: 0.05, vol: 0.55, noise: { dur: 0.7, f0: 1400, f1: 90, type: 'lowpass' }, tone: { f0: 90, f1: 30, dur: 0.5, type: 'sine', vol: 1 } },
  slam: { gap: 0.1, vol: 0.5, noise: { dur: 0.35, f0: 700, f1: 80, type: 'lowpass' }, tone: { f0: 80, f1: 28, dur: 0.35, type: 'sine', vol: 1 } },
  bow: { gap: 0.07, vol: 0.14, tone: { f0: 420, f1: 120, dur: 0.1, type: 'triangle', vol: 1 }, noise: { dur: 0.06, f0: 3200, f1: 1800, type: 'highpass', vol: 0.4 } },
  whoosh: { gap: 0.06, vol: 0.12, noise: { dur: 0.16, f0: 900, f1: 2800, type: 'bandpass' } },
  flame: { gap: 0.1, vol: 0.1, noise: { dur: 0.16, f0: 600, f1: 350, type: 'bandpass' } },
  hit: { gap: 0.045, vol: 0.12, noise: { dur: 0.05, f0: 1600, f1: 700, type: 'highpass' } },
  bite: { gap: 0.06, vol: 0.12, tone: { f0: 260, f1: 140, dur: 0.07, type: 'square', vol: 1 } },
  smash: { gap: 0.08, vol: 0.28, noise: { dur: 0.14, f0: 900, f1: 200, type: 'lowpass' }, tone: { f0: 110, f1: 50, dur: 0.14, type: 'sine', vol: 1 } },
  slip: { gap: 0.1, vol: 0.18, tone: { f0: 900, f1: 220, dur: 0.35, type: 'sine', vol: 1 } },
  magic: { gap: 0.1, vol: 0.14, tone: { f0: 520, f1: 1300, dur: 0.22, type: 'sine', vol: 1 } },
  zap: { gap: 0.12, vol: 0.22, noise: { dur: 0.45, f0: 5200, f1: 1500, type: 'bandpass' }, tone: { f0: 210, f1: 55, dur: 0.5, type: 'sawtooth', vol: 0.7 } },
  summon: { gap: 0.2, vol: 0.2, tone: { f0: 160, f1: 55, dur: 0.5, type: 'sawtooth', vol: 1 } },
};

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.last = {};
    this.recent = [];
    this.noiseBuf = null;
  }

  ensure() {
    if (this.muted) return null;
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.7;
        this.master.connect(this.ctx.destination);
        const n = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, n, n);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      } catch {
        this.ctx = null;
        return null;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  setMuted(m) {
    this.muted = m;
    if (!m) this.ensure();
  }

  play(name, x = 430, w = 860) {
    const s = SOUNDS[name];
    if (!s || this.muted) return;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    if (this.last[name] !== undefined && t - this.last[name] < s.gap) return;
    this.recent = this.recent.filter((r) => t - r < 0.1);
    if (this.recent.length > 9) return;
    this.recent.push(t);
    this.last[name] = t;
    const out = ctx.createGain();
    out.gain.value = s.vol;
    let node = out;
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.max(-0.8, Math.min(0.8, (x / w) * 2 - 1));
      out.connect(pan);
      pan.connect(this.master);
    } else out.connect(this.master);
    if (s.noise) {
      const n = s.noise;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter();
      f.type = n.type;
      f.frequency.setValueAtTime(n.f0, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(30, n.f1), t + n.dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime((n.vol || 1) * 1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + n.dur);
      src.connect(f);
      f.connect(g);
      g.connect(node);
      src.start(t, Math.random() * 0.5);
      src.stop(t + n.dur + 0.02);
    }
    if (s.tone) {
      const o = s.tone;
      const osc = ctx.createOscillator();
      osc.type = o.type;
      osc.frequency.setValueAtTime(o.f0, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + o.dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(o.vol || 1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + o.dur);
      osc.connect(g);
      g.connect(node);
      osc.start(t);
      osc.stop(t + o.dur + 0.02);
    }
  }
}
