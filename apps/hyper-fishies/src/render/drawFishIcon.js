// Reusable procedural fish "shape archetypes" — every species reuses one of
// these with a different hue/pattern instead of needing bespoke art.
// Icons are drawn inside a local [-1,1] box, then scaled/translated to size.
const SHAPES = {
  round(ctx) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.62, 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.6, 0);
    ctx.lineTo(-0.95, -0.28);
    ctx.lineTo(-0.95, 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.05, -0.4);
    ctx.lineTo(0.28, -0.72);
    ctx.lineTo(0.4, -0.35);
    ctx.closePath();
    ctx.fill();
    eye(ctx, 0.32, -0.06, 0.07);
  },
  angel(ctx) {
    ctx.beginPath();
    ctx.moveTo(0.6, 0);
    ctx.quadraticCurveTo(0.2, -0.75, -0.15, -0.15);
    ctx.quadraticCurveTo(-0.6, -0.1, -0.85, 0);
    ctx.quadraticCurveTo(-0.6, 0.1, -0.15, 0.15);
    ctx.quadraticCurveTo(0.2, 0.75, 0.6, 0);
    ctx.closePath();
    ctx.fill();
    eye(ctx, 0.32, -0.04, 0.06);
  },
  eel(ctx) {
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.26;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(-0.85, 0.2);
    ctx.bezierCurveTo(-0.4, -0.5, 0.1, 0.5, 0.5, -0.15);
    ctx.bezierCurveTo(0.65, -0.3, 0.8, -0.15, 0.9, 0.05);
    ctx.stroke();
    eye(ctx, -0.78, 0.14, 0.055);
  },
  squid(ctx) {
    ctx.beginPath();
    ctx.ellipse(0, -0.25, 0.42, 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.09;
    ctx.strokeStyle = ctx.fillStyle;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 0.14, 0.2);
      ctx.quadraticCurveTo(i * 0.22, 0.6, i * 0.16 + (i > 0 ? 0.1 : -0.1), 0.92);
      ctx.stroke();
    }
    eye(ctx, -0.14, -0.28, 0.07);
    eye(ctx, 0.14, -0.28, 0.07);
  },
  shark(ctx) {
    ctx.beginPath();
    ctx.moveTo(0.9, 0);
    ctx.quadraticCurveTo(0.4, -0.34, -0.7, -0.16);
    ctx.quadraticCurveTo(-0.95, 0, -0.7, 0.2);
    ctx.quadraticCurveTo(0.4, 0.3, 0.9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.1, -0.16);
    ctx.lineTo(0.05, -0.6);
    ctx.lineTo(0.28, -0.14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.7, 0.05);
    ctx.lineTo(-0.98, -0.22);
    ctx.lineTo(-0.98, 0.28);
    ctx.closePath();
    ctx.fill();
    eye(ctx, 0.55, -0.05, 0.05);
  },
  sail(ctx) {
    ctx.beginPath();
    ctx.moveTo(0.95, 0.02);
    ctx.quadraticCurveTo(0.3, -0.22, -0.6, -0.05);
    ctx.quadraticCurveTo(0.3, 0.22, 0.95, 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.95, 0.02);
    ctx.lineTo(1.25, -0.02);
    ctx.lineTo(0.98, 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha *= 0.85;
    ctx.beginPath();
    ctx.moveTo(-0.3, -0.15);
    ctx.quadraticCurveTo(-0.05, -0.85, 0.3, -0.15);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha /= 0.85;
    ctx.beginPath();
    ctx.moveTo(-0.6, -0.03);
    ctx.lineTo(-0.95, -0.22);
    ctx.lineTo(-0.95, 0.2);
    ctx.closePath();
    ctx.fill();
    eye(ctx, 0.6, -0.02, 0.045);
  },
  whale(ctx) {
    ctx.beginPath();
    ctx.ellipse(-0.05, 0, 0.72, 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.55, 0);
    ctx.quadraticCurveTo(0.85, -0.3, 1.0, -0.05);
    ctx.quadraticCurveTo(0.85, 0.3, 0.55, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.4, -0.4);
    ctx.lineTo(-0.2, -0.62);
    ctx.lineTo(-0.05, -0.4);
    ctx.closePath();
    ctx.fill();
    eye(ctx, -0.42, -0.02, 0.06);
  },
  star(ctx) {
    ctx.beginPath();
    const spikes = 5, outerR = 0.85, innerR = 0.38;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (Math.PI * i) / spikes - Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    eye(ctx, -0.14, -0.05, 0.05);
    eye(ctx, 0.14, -0.05, 0.05);
  },
  // Not a fish — a jagged hunk of scrap, for rod-part salvage (see
  // data/rodParts.js). Reuses this same icon pipeline (drawFishIcon) so
  // the existing catch card / bag-row rendering works on it unmodified.
  wreck(ctx) {
    ctx.beginPath();
    ctx.moveTo(-0.75, 0.1);
    ctx.lineTo(-0.5, -0.55);
    ctx.lineTo(0.05, -0.7);
    ctx.lineTo(0.35, -0.3);
    ctx.lineTo(0.85, -0.15);
    ctx.lineTo(0.65, 0.4);
    ctx.lineTo(0.1, 0.65);
    ctx.lineTo(-0.35, 0.5);
    ctx.closePath();
    ctx.fill();
    const prev = ctx.fillStyle;
    ctx.globalAlpha *= 0.4;
    ctx.strokeStyle = '#0a1414';
    ctx.lineWidth = 0.06;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-0.4, -0.1);
    ctx.lineTo(0.05, -0.35);
    ctx.lineTo(-0.1, 0.05);
    ctx.lineTo(0.3, 0.15);
    ctx.stroke();
    ctx.globalAlpha /= 0.4;
    ctx.fillStyle = 'rgba(10, 20, 20, 0.6)';
    for (const [rx, ry] of [[-0.35, -0.2], [0.3, -0.35], [0.4, 0.2]]) {
      ctx.beginPath(); ctx.arc(rx, ry, 0.08, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = prev;
  },
  chest(ctx) {
    ctx.beginPath();
    ctx.rect(-0.7, -0.05, 1.4, 0.6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.7, -0.05);
    ctx.quadraticCurveTo(0, -0.55, 0.7, -0.05);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha *= 0.5;
    ctx.fillRect(-0.08, -0.05, 0.16, 0.6);
    ctx.globalAlpha /= 0.5;
  },

  // --- The rest below were added to break up species that used to share a
  // silhouette with something unrelated (a starfish, a crab, and a
  // trilobite all reading as the same icon). Genuinely similar species
  // still share a shape on purpose (see the file header) — these just give
  // each real body plan its own.
  clam(ctx) {
    ctx.beginPath();
    ctx.moveTo(-0.06, -0.7);
    ctx.quadraticCurveTo(-0.85, -0.5, -0.8, 0.15);
    ctx.quadraticCurveTo(-0.5, 0.55, -0.06, 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.06, -0.7);
    ctx.quadraticCurveTo(0.85, -0.5, 0.8, 0.15);
    ctx.quadraticCurveTo(0.5, 0.55, 0.06, 0.1);
    ctx.closePath();
    ctx.fill();
    const prevClam = ctx.fillStyle;
    ctx.globalAlpha *= 0.35;
    ctx.strokeStyle = '#0a1414';
    ctx.lineWidth = 0.04;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 0.06, -0.65);
      ctx.quadraticCurveTo(s * 0.5, -0.3, s * 0.5, 0.15);
      ctx.stroke();
    }
    ctx.globalAlpha /= 0.35;
    ctx.fillStyle = prevClam;
  },
  crab(ctx) {
    ctx.beginPath();
    ctx.ellipse(0, 0.05, 0.62, 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s * 0.7, -0.28, 0.22, 0.16, s * -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.07;
    ctx.strokeStyle = ctx.fillStyle;
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const y = -0.1 + i * 0.24;
        ctx.beginPath();
        ctx.moveTo(s * 0.5, y);
        ctx.lineTo(s * 0.92, y + 0.16);
        ctx.stroke();
      }
    }
    eye(ctx, -0.16, -0.06, 0.06);
    eye(ctx, 0.16, -0.06, 0.06);
  },
  jellyfish(ctx) {
    ctx.beginPath();
    ctx.arc(0, -0.15, 0.6, Math.PI, 0);
    ctx.quadraticCurveTo(0.4, 0.15, 0, -0.02);
    ctx.quadraticCurveTo(-0.4, 0.15, -0.6, -0.15);
    ctx.closePath();
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.06;
    ctx.strokeStyle = ctx.fillStyle;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 0.2, 0);
      ctx.quadraticCurveTo(i * 0.28 + 0.1, 0.5, i * 0.16, 0.9);
      ctx.stroke();
    }
  },
  manta(ctx) {
    ctx.beginPath();
    ctx.moveTo(0.95, 0);
    ctx.quadraticCurveTo(0.3, -0.55, -0.2, -0.1);
    ctx.quadraticCurveTo(-0.5, 0, -0.95, 0.05);
    ctx.quadraticCurveTo(-0.5, 0.15, -0.2, 0.15);
    ctx.quadraticCurveTo(0.3, 0.55, 0.95, 0);
    ctx.closePath();
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.045;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(-0.5, 0.02);
    ctx.quadraticCurveTo(-0.75, 0.3, -0.9, 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.15, -0.15);
    ctx.lineTo(-0.35, -0.38);
    ctx.lineTo(-0.08, -0.28);
    ctx.closePath();
    ctx.fill();
    eye(ctx, -0.08, -0.04, 0.05);
  },
  pike(ctx) {
    ctx.beginPath();
    ctx.moveTo(0.95, 0);
    ctx.quadraticCurveTo(0.5, -0.22, -0.55, -0.12);
    ctx.lineTo(-0.55, 0.12);
    ctx.quadraticCurveTo(0.5, 0.22, 0.95, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.55, 0);
    ctx.lineTo(-0.9, -0.24);
    ctx.lineTo(-0.68, 0);
    ctx.lineTo(-0.9, 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.05, -0.12);
    ctx.lineTo(0.22, -0.4);
    ctx.lineTo(0.34, -0.1);
    ctx.closePath();
    ctx.fill();
    eye(ctx, 0.68, -0.02, 0.045);
  },
  koi(ctx) {
    ctx.beginPath();
    ctx.ellipse(-0.1, 0, 0.5, 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.5, 0);
    ctx.quadraticCurveTo(-0.75, -0.5, -0.98, -0.3);
    ctx.quadraticCurveTo(-0.75, -0.05, -0.6, 0.02);
    ctx.quadraticCurveTo(-0.75, 0.1, -0.98, 0.35);
    ctx.quadraticCurveTo(-0.75, 0.5, -0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.035;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(0.38, 0.1);
    ctx.quadraticCurveTo(0.55, 0.22, 0.62, 0.36);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0.4, -0.02);
    ctx.quadraticCurveTo(0.6, 0.02, 0.7, 0.1);
    ctx.stroke();
    eye(ctx, 0.32, -0.08, 0.05);
  },
  urchin(ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.045;
    ctx.strokeStyle = ctx.fillStyle;
    const spikes = 14;
    for (let i = 0; i < spikes; i++) {
      const a = (Math.PI * 2 * i) / spikes;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 0.3, Math.sin(a) * 0.3);
      ctx.lineTo(Math.cos(a) * 0.92, Math.sin(a) * 0.92);
      ctx.stroke();
    }
  },
  serpent(ctx) {
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.34;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(-0.9, 0.25);
    ctx.bezierCurveTo(-0.4, -0.55, 0.15, 0.55, 0.55, -0.1);
    ctx.bezierCurveTo(0.7, -0.28, 0.85, -0.1, 0.95, 0.1);
    ctx.stroke();
    ctx.lineWidth = 0.05;
    const pts = [[-0.65, 0.0], [-0.35, -0.35], [-0.05, 0.05], [0.25, -0.15], [0.5, -0.3]];
    for (const [x, y] of pts) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.06, y - 0.22);
      ctx.stroke();
    }
    eye(ctx, -0.82, 0.18, 0.06);
  },
  trilobite(ctx) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.82, 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    const prevTri = ctx.fillStyle;
    ctx.globalAlpha *= 0.4;
    ctx.strokeStyle = '#0a1414';
    ctx.lineWidth = 0.035;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 0.28, -0.36);
      ctx.lineTo(i * 0.28, 0.36);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-0.75, 0);
    ctx.lineTo(0.75, 0);
    ctx.stroke();
    ctx.globalAlpha /= 0.4;
    ctx.fillStyle = prevTri;
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.04;
    ctx.strokeStyle = ctx.fillStyle;
    for (const s of [-1, 1]) {
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 0.28, s * 0.32);
        ctx.lineTo(i * 0.28 + 0.05, s * 0.5);
        ctx.stroke();
      }
    }
  },
  shrimp(ctx) {
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.3;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(-0.6, 0.35);
    ctx.quadraticCurveTo(-0.4, -0.55, 0.35, -0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.6, 0.35);
    ctx.lineTo(-0.95, 0.2);
    ctx.lineTo(-0.9, 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 0.03;
    ctx.beginPath();
    ctx.moveTo(0.4, -0.35);
    ctx.quadraticCurveTo(0.75, -0.55, 0.95, -0.85);
    ctx.stroke();
    eye(ctx, 0.33, -0.36, 0.045);
  },
  catfish(ctx) {
    ctx.beginPath();
    ctx.moveTo(0.7, 0);
    ctx.quadraticCurveTo(0.55, -0.42, -0.1, -0.3);
    ctx.quadraticCurveTo(-0.6, -0.2, -0.9, 0);
    ctx.quadraticCurveTo(-0.6, 0.2, -0.1, 0.3);
    ctx.quadraticCurveTo(0.55, 0.42, 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.03;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(0.6, 0.05);
    ctx.quadraticCurveTo(0.85, 0.15, 1.0, 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0.6, -0.05);
    ctx.quadraticCurveTo(0.9, -0.02, 1.05, 0.05);
    ctx.stroke();
    eye(ctx, 0.5, -0.12, 0.05);
  },
  piranha(ctx) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.58, 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.15, -0.36);
    ctx.lineTo(-0.05, -0.62);
    ctx.lineTo(0.05, -0.38);
    ctx.lineTo(0.15, -0.6);
    ctx.lineTo(0.25, -0.36);
    ctx.closePath();
    ctx.fill();
    const prevPir = ctx.fillStyle;
    ctx.fillStyle = '#fff8ec';
    ctx.beginPath();
    ctx.moveTo(0.48, -0.1);
    ctx.lineTo(0.58, -0.02);
    ctx.lineTo(0.48, 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.48, 0.08);
    ctx.lineTo(0.58, 0.12);
    ctx.lineTo(0.46, 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = prevPir;
    eye(ctx, 0.22, -0.12, 0.06);
  },
  turtle(ctx) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.68, 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    const prevTur = ctx.fillStyle;
    ctx.globalAlpha *= 0.35;
    ctx.strokeStyle = '#0a1414';
    ctx.lineWidth = 0.035;
    ctx.beginPath();
    ctx.moveTo(0, -0.44);
    ctx.lineTo(0, 0.44);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.4, -0.3);
    ctx.lineTo(0.4, -0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.4, 0.3);
    ctx.lineTo(0.4, 0.3);
    ctx.stroke();
    ctx.globalAlpha /= 0.35;
    ctx.fillStyle = prevTur;
    ctx.beginPath();
    ctx.ellipse(0.78, 0, 0.18, 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(0.3, s * 0.5, 0.24, 0.12, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-0.5, s * 0.4, 0.2, 0.11, s * -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    eye(ctx, 0.84, -0.03, 0.035);
  },
  flyingfish(ctx) {
    ctx.beginPath();
    ctx.moveTo(0.75, 0);
    ctx.quadraticCurveTo(0.3, -0.2, -0.5, -0.1);
    ctx.quadraticCurveTo(0.3, 0.2, 0.75, 0);
    ctx.closePath();
    ctx.fill();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0.15, s * 0.08);
      ctx.quadraticCurveTo(0.15, s * 0.6, -0.35, s * 0.85);
      ctx.quadraticCurveTo(0.05, s * 0.55, 0.3, s * 0.12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(-0.5, 0);
    ctx.lineTo(-0.85, -0.22);
    ctx.lineTo(-0.62, 0);
    ctx.lineTo(-0.85, 0.22);
    ctx.closePath();
    ctx.fill();
    eye(ctx, 0.55, -0.03, 0.045);
  },

  // --- A second wave, same reasoning as the first: each of these is a
  // genuinely different body plan (eight arms, a shell spiral, a snout and
  // a curled tail...) rather than another recolor of an existing archetype.
  octopus(ctx) {
    ctx.beginPath();
    ctx.ellipse(0, -0.15, 0.5, 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.1;
    ctx.strokeStyle = ctx.fillStyle;
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      ctx.beginPath();
      ctx.moveTo(i * 0.12, 0.15);
      ctx.quadraticCurveTo(i * 0.2 + (i > 0 ? 0.15 : -0.15), 0.55, i * 0.1, 0.9);
      ctx.stroke();
    }
    eye(ctx, -0.16, -0.18, 0.07);
    eye(ctx, 0.16, -0.18, 0.07);
  },
  lobster(ctx) {
    ctx.beginPath();
    ctx.ellipse(-0.05, 0, 0.55, 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.55, -0.16);
    ctx.lineTo(-0.9, -0.3);
    ctx.lineTo(-0.75, 0);
    ctx.lineTo(-0.9, 0.3);
    ctx.lineTo(-0.55, 0.16);
    ctx.closePath();
    ctx.fill();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(0.55, s * 0.18, 0.22, 0.14, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.05;
    ctx.strokeStyle = ctx.fillStyle;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0.3, s * 0.14);
      ctx.lineTo(0.55, s * 0.2);
      ctx.stroke();
    }
    eye(ctx, 0.4, -0.06, 0.045);
  },
  seahorse(ctx) {
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.32;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(-0.15, 0.85);
    ctx.bezierCurveTo(-0.4, 0.5, -0.4, 0.1, -0.1, -0.1);
    ctx.bezierCurveTo(0.2, -0.3, 0.15, -0.55, -0.1, -0.6);
    ctx.stroke();
    ctx.lineWidth = 0.14;
    ctx.beginPath();
    ctx.moveTo(-0.1, -0.6);
    ctx.lineTo(0.3, -0.72);
    ctx.stroke();
    ctx.lineWidth = 0.06;
    ctx.beginPath();
    ctx.moveTo(-0.15, -0.05);
    ctx.quadraticCurveTo(0.15, 0.05, 0.05, 0.35);
    ctx.stroke();
    eye(ctx, -0.08, -0.58, 0.045);
  },
  swordfish(ctx) {
    ctx.beginPath();
    ctx.moveTo(0.35, 0);
    ctx.quadraticCurveTo(0.1, -0.24, -0.6, -0.14);
    ctx.lineTo(-0.6, 0.14);
    ctx.quadraticCurveTo(0.1, 0.24, 0.35, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.35, -0.03);
    ctx.lineTo(0.98, -0.01);
    ctx.lineTo(0.98, 0.01);
    ctx.lineTo(0.35, 0.03);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.05, -0.14);
    ctx.lineTo(0.05, -0.5);
    ctx.lineTo(0.18, -0.12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.6, 0);
    ctx.lineTo(-0.92, -0.26);
    ctx.lineTo(-0.72, 0);
    ctx.lineTo(-0.92, 0.26);
    ctx.closePath();
    ctx.fill();
    eye(ctx, 0.22, -0.03, 0.04);
  },
  hammerhead(ctx) {
    ctx.beginPath();
    ctx.moveTo(0.55, 0);
    ctx.quadraticCurveTo(0.2, -0.3, -0.65, -0.14);
    ctx.quadraticCurveTo(-0.9, 0, -0.65, 0.18);
    ctx.quadraticCurveTo(0.2, 0.28, 0.55, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.35, -0.55);
    ctx.lineTo(0.5, -0.55);
    ctx.lineTo(0.4, -0.05);
    ctx.lineTo(0.28, -0.05);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.35, 0.5);
    ctx.lineTo(0.5, 0.5);
    ctx.lineTo(0.4, 0.02);
    ctx.lineTo(0.28, 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.1, -0.14);
    ctx.lineTo(0.02, -0.48);
    ctx.lineTo(0.16, -0.1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.65, 0.02);
    ctx.lineTo(-0.95, -0.2);
    ctx.lineTo(-0.72, 0.02);
    ctx.lineTo(-0.95, 0.24);
    ctx.closePath();
    ctx.fill();
    eye(ctx, 0.42, -0.4, 0.04);
    eye(ctx, 0.42, 0.35, 0.04);
  },
  stingray(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, -0.6);
    ctx.quadraticCurveTo(0.75, -0.1, 0.15, 0.1);
    ctx.quadraticCurveTo(0.05, 0.3, 0, 0.55);
    ctx.quadraticCurveTo(-0.05, 0.3, -0.15, 0.1);
    ctx.quadraticCurveTo(-0.75, -0.1, 0, -0.6);
    ctx.closePath();
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.05;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(0, 0.5);
    ctx.quadraticCurveTo(0.1, 0.8, -0.05, 0.98);
    ctx.stroke();
    eye(ctx, -0.1, -0.15, 0.05);
    eye(ctx, 0.1, -0.15, 0.05);
  },
  nautilus(ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, 0.62, 0, Math.PI * 2);
    ctx.fill();
    const prevNaut = ctx.fillStyle;
    ctx.globalAlpha *= 0.4;
    ctx.strokeStyle = '#0a1414';
    ctx.lineWidth = 0.045;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 3.2; a += 0.12) {
      const r = 0.06 + a * 0.07;
      const x = Math.cos(a + 2.2) * r, y = Math.sin(a + 2.2) * r;
      if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha /= 0.4;
    ctx.fillStyle = prevNaut;
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.05;
    ctx.strokeStyle = ctx.fillStyle;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(0.5 + i * 0.02, 0.2 + i * 0.05);
      ctx.lineTo(0.85 + i * 0.03, 0.3 + i * 0.08);
      ctx.stroke();
    }
  },
  anglerfish(ctx) {
    ctx.beginPath();
    ctx.moveTo(0.55, -0.05);
    ctx.quadraticCurveTo(0.3, -0.5, -0.5, -0.3);
    ctx.quadraticCurveTo(-0.85, 0.05, -0.5, 0.35);
    ctx.quadraticCurveTo(0.15, 0.5, 0.55, 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.045;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(0.4, -0.35);
    ctx.quadraticCurveTo(0.55, -0.6, 0.75, -0.55);
    ctx.stroke();
    const prevAng = ctx.fillStyle;
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(0.77, -0.56, 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8ec';
    ctx.beginPath();
    ctx.moveTo(0.35, 0.02);
    ctx.lineTo(0.5, 0.1);
    ctx.lineTo(0.34, 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = prevAng;
    eye(ctx, 0.15, -0.15, 0.05);
  },
  moray(ctx) {
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.3;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(-0.9, 0.1);
    ctx.bezierCurveTo(-0.5, -0.4, 0, 0.3, 0.35, -0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0.2, -0.28);
    ctx.lineTo(0.65, -0.2);
    ctx.lineTo(0.65, 0.16);
    ctx.lineTo(0.2, 0.22);
    ctx.closePath();
    ctx.fill();
    const prevMor = ctx.fillStyle;
    ctx.fillStyle = '#7a2020';
    ctx.beginPath();
    ctx.moveTo(0.62, -0.02);
    ctx.lineTo(0.95, -0.12);
    ctx.lineTo(0.95, 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = prevMor;
    eye(ctx, 0.4, -0.14, 0.05);
  },
  cuttlefish(ctx) {
    ctx.globalAlpha *= 0.55;
    ctx.beginPath();
    ctx.ellipse(0, -0.05, 0.72, 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha /= 0.55;
    ctx.beginPath();
    ctx.ellipse(0, -0.05, 0.55, 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.06;
    ctx.strokeStyle = ctx.fillStyle;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 0.1, 0.32);
      ctx.lineTo(i * 0.16, 0.68);
      ctx.stroke();
    }
    eye(ctx, -0.16, -0.1, 0.07);
    eye(ctx, 0.16, -0.1, 0.07);
  },
};

function eye(ctx, x, y, r) {
  const prev = ctx.fillStyle;
  ctx.fillStyle = 'rgba(10, 20, 20, 0.85)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = prev;
}

// A small deterministic hash of the fish's own id — the same id always
// produces the same detail, so a species never "flickers" between looks
// across re-renders, panels, or sessions, without persisting anything.
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Deliberately no straight-line patterns (stripes/bands) here — at the
// catch card's larger icon size those read as stray lines cutting across
// the fish rather than a marking on it. Organic/soft patterns only.
const PATTERNS = ['none', 'none', 'spots', 'speckle', 'fade'];

// Every species reuses one of the ~24 body-plan archetypes above (see the
// file header) — real families genuinely do share a silhouette. What makes
// each individual species its own fish, on top of its own hue, is this:
// a surface pattern and a body proportion, both derived from the fish's id
// rather than hand-authored per species, so all 148+ species (and any
// added later) get a real, stable, unique look for free.
export function fishVisualDetail(fishId) {
  if (!fishId) return { pattern: 'none', skewX: 0, skewY: 0 };
  const h = hashSeed(fishId);
  return {
    pattern: PATTERNS[h % PATTERNS.length],
    skewX: (((h >> 3) % 7) - 3) * 0.035,
    skewY: (((h >> 7) % 7) - 3) * 0.03,
  };
}

// Painted with `source-atop` so it only lands on pixels the body shape
// itself already painted — works for any of the 24 archetypes without
// needing each one to expose its own clip path.
function applyPattern(ctx, pattern, accentColor, baseAlpha) {
  if (!pattern || pattern === 'none') return;
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.38 * baseAlpha;
  ctx.fillStyle = accentColor;
  if (pattern === 'spots') {
    const spots = [[-0.4, -0.2], [0.1, -0.32], [0.32, 0.08], [-0.15, 0.28], [0.48, -0.05], [-0.52, 0.15]];
    for (const [sx, sy] of spots) { ctx.beginPath(); ctx.arc(sx, sy, 0.075, 0, Math.PI * 2); ctx.fill(); }
  } else if (pattern === 'speckle') {
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4, r = (i % 5) * 0.15;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 1.3, Math.sin(a) * r, 0.035, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pattern === 'fade') {
    const grad = ctx.createLinearGradient(-1, 0, 1, 0);
    grad.addColorStop(0, accentColor + '00');
    grad.addColorStop(1, accentColor + 'a0');
    ctx.fillStyle = grad;
    ctx.fillRect(-1.1, -1.1, 2.2, 2.2);
  }
  ctx.restore();
}

// `opts.pattern`/`opts.skewX`/`opts.skewY` (see fishVisualDetail above) are
// what turn a shared archetype into a specific-looking species — every
// call site that draws an actual fish (not a silhouette, not a salvage/
// chest fauxfish) should pass fishVisualDetail(fish.id) in through opts.
export function drawFishIcon(ctx, shape, x, y, size, color, opts = {}) {
  const fn = SHAPES[shape] || SHAPES.round;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 2, size / 2);
  if (opts.flip) ctx.scale(-1, 1);
  if (opts.skewX || opts.skewY) ctx.scale(1 + (opts.skewX || 0), 1 + (opts.skewY || 0));
  ctx.fillStyle = opts.silhouette ? (opts.silhouetteColor || '#0e2530') : color;
  const baseAlpha = opts.alpha != null ? opts.alpha : 1;
  ctx.globalAlpha = baseAlpha;
  fn(ctx);
  if (!opts.silhouette) applyPattern(ctx, opts.pattern, opts.patternColor || color, baseAlpha);
  ctx.restore();
}
