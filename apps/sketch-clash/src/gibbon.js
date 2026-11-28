// Gibbondore The Great: what he looks like and how he moves.
// He has the original ape's anatomy, redrawn from measuring it on screen: the same high humped back, the head with
// its peaked crown and heavy brow slung forward of great round shoulders, thick arms ending in round fists, and short
// back legs, at the same size. A gibbon's colouring on that (brown fur, white face ring and brow, white hands and
// feet), and a wizard's outfit: hat, cloak, belted robe with wide sleeves, and staff.
// Drawn in art units, facing +x, with the ground about 28 below the origin. His limbs are drawn live, from where his
// hands and feet are, so they can move smoothly through any pose.
import { TAU, K, FEET } from './config.js?v=257';
import { makeLayer, drawLayer, OUT } from './sprites.js?v=257';
import { rigStep, applyBotBody, applyBotCap, stepDust } from './botrig.js?v=257';
import { STORM } from './gibbonfx.js?v=257';

const C = {
  fur: '#5a463e', furDark: '#3d2f2a', furFar: '#342826', white: '#f4eddf', whiteShade: '#c9bda8',
  skin: '#6e5054', robe: '#6c3db0', robeDark: '#4c2587', robeFar: '#381e66', cloak: '#35206a', cloakDark: '#1f1244',
  lining: '#b03a6c', gold: '#f3bf37', goldLite: '#ffe58a', wood: '#8f5f2e', woodDark: '#65401d',
};

function shape(g, fill, lw, path) {
  g.beginPath();
  path();
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (!lw) return;
  g.strokeStyle = OUT;
  g.lineWidth = lw;
  g.lineJoin = 'round';
  g.stroke();
}

const oval = (g, fill, lw, x, y, rx, ry, turn = 0) => shape(g, fill, lw, () => g.ellipse(x, y, rx, ry, turn, 0, TAU));

function stroke(g, col, wide, path) {
  g.strokeStyle = col;
  g.lineWidth = wide;
  g.lineCap = 'round';
  g.beginPath();
  path();
  g.stroke();
}

function star(g, x, y, r, fill) {
  shape(g, fill, 0, () => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU - Math.PI / 2;
      const k = i % 2 ? r * 0.45 : r;
      if (i) g.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
      else g.moveTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
    }
  });
}

// ---------------------------------------------------------------- the parts that keep their shape
// the ape's trunk: a big back that humps up to the shoulders, over a belly that tucks in at the hips. It is dressed in
// a plain robe: a skirt with a gold hem and one gold sash
function drawBody(g) {
  const outline = () => {
    g.moveTo(-32.5, -6.3);
    g.bezierCurveTo(-35, -13, -31, -22, -25.8, -25.8);
    g.bezierCurveTo(-20, -31, -14, -33.4, -8.3, -35);
    g.bezierCurveTo(-1, -38.4, 4, -41.6, 10, -40.9);
    g.bezierCurveTo(15, -40.4, 19, -37, 21, -32);
    g.bezierCurveTo(25, -22, 24, -11, 18.3, -4.7);
    g.bezierCurveTo(14, -0.2, 8, 2.4, -1.7, 2.9);
    g.bezierCurveTo(-12, 3.3, -24, 1.2, -29, -1.5);
    g.bezierCurveTo(-31.6, -3, -32.7, -4.6, -32.5, -6.3);
  };
  // the skirt of the robe, hanging in one smooth sweep below the belly
  shape(g, C.robeDark, 1.7, () => {
    g.moveTo(-23, -3);
    g.lineTo(13, -3);
    g.lineTo(13.4, 9.4);
    g.quadraticCurveTo(-5, 15, -24, 8.6);
  });
  stroke(g, C.gold, 2.2, () => {
    g.moveTo(-22.8, 6.8);
    g.quadraticCurveTo(-5, 12.6, 12.4, 7.4);
  });
  const gr = g.createLinearGradient(0, -36, 0, 4);
  gr.addColorStop(0, C.robe);
  gr.addColorStop(1, C.robeDark);
  shape(g, gr, 0, outline);
  g.save();
  g.beginPath();
  outline();
  g.clip();
  const sash = () => {
    g.moveTo(-16.5, -34);
    g.quadraticCurveTo(-4.6, -17, -6.4, 6);
  };
  stroke(g, OUT, 7.4, sash);
  stroke(g, C.gold, 4.8, sash);
  g.restore();
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  outline();
  g.closePath();
  g.stroke();
}

// the ape's head with a gibbon's markings: a peaked crown, a heavy brow, a short muzzle, seen from the side. A white
// ring runs round the dark face and the brow is white too. Origin at the middle of it. `mouth` 0..1 how far open
export function drawGibbonFace(g, o) {
  shape(g, C.fur, 1.8, () => {
    g.moveTo(-7.3, -18);
    g.bezierCurveTo(-5.4, -15.4, -3.6, -13.8, -1.7, -12.7);
    g.bezierCurveTo(2, -11, 5, -8.6, 6.6, -5.6);
    g.bezierCurveTo(9.2, -4.6, 10.8, -2.4, 10.4, -0.8);
    g.bezierCurveTo(13.2, 1, 13.4, 4, 12.4, 6.5);
    g.bezierCurveTo(13.8, 9.4, 12, 11.8, 9.6, 12.2);
    g.bezierCurveTo(8, 14.2, 5, 14.6, 3.2, 14.2);
    g.bezierCurveTo(0, 14, -3, 12.8, -5.8, 10.2);
    g.bezierCurveTo(-10.4, 7, -14, 3, -13.5, -1.5);
    g.bezierCurveTo(-14, -6.4, -11.6, -11.4, -9.4, -13.8);
    g.bezierCurveTo(-8.6, -15.2, -8, -16.8, -7.3, -18);
  });
  // the white ring, tufted at the back
  shape(g, C.white, 1.3, () => {
    g.moveTo(-4.6, -3.6);
    g.lineTo(-7.8, -0.2);
    g.lineTo(-6.2, 0.8);
    g.lineTo(-9, 4.6);
    g.lineTo(-6.8, 5.4);
    g.lineTo(-7.8, 9.4);
    g.bezierCurveTo(-5, 10.4, -3.6, 12, -2, 13);
    g.bezierCurveTo(2, 15.6, 8, 15.4, 11, 12.8);
    g.bezierCurveTo(14.6, 10, 14.6, 2.6, 11.2, -1);
    g.bezierCurveTo(7.6, -5.4, 0.4, -6.8, -4.6, -3.6);
  });
  shape(g, C.skin, 1, () => {
    g.moveTo(-3.2, -0.6);
    g.bezierCurveTo(-3, -3.8, 3, -4.2, 6, -2.2);
    g.bezierCurveTo(9, -3.2, 11, -1.2, 10.4, 0.8);
    g.bezierCurveTo(13, 2.2, 13, 5, 12, 7);
    g.bezierCurveTo(13.2, 10, 11, 12.2, 8.6, 11.8);
    g.bezierCurveTo(6, 13.8, 1, 13.2, -1.6, 10.8);
    g.bezierCurveTo(-4.6, 8, -4.8, 3, -3.2, -0.6);
  });
  const x = 2;
  const y = 2.8;
  const shut = o.shut || 0;
  if (o.dead) {
    stroke(g, C.white, 1.3, () => {
      g.moveTo(x - 2, y - 2);
      g.lineTo(x + 2, y + 2);
      g.moveTo(x + 2, y - 2);
      g.lineTo(x - 2, y + 2);
    });
  } else if (o.happy || shut > 0.6) {
    stroke(g, C.white, 1.6, () => {
      if (o.happy) g.arc(x, y + 1.2, 2.4, Math.PI * 1.12, Math.PI * 1.88);
      else g.arc(x, y - 1.4, 2.4, Math.PI * 0.18, Math.PI * 0.82);
    });
  } else {
    if (o.angry) {
      oval(g, 'rgba(255, 206, 40, 0.24)', 0, x, y, 6.6, 5.6);
      oval(g, 'rgba(255, 224, 70, 0.42)', 0, x, y, 4.6, 4);
    }
    oval(g, o.angry ? '#fff3a8' : '#ffffff', 1, x, y, 2.9, 2.9 * (1 - shut));
    oval(g, o.angry ? '#ffb300' : '#c9801c', 0, x + 0.4 + o.lx * 0.6, y + o.ly * 0.6, 1.9, 1.9 * (1 - shut));
    oval(g, OUT, 0, x + 0.6 + o.lx * 0.7, y + o.ly * 0.7, 1.15, 1.15 * (1 - shut));
    oval(g, '#ffffff', 0, x + 0.2 + o.lx * 0.7, y - 0.7 + o.ly * 0.7, 0.45, 0.45);
  }
  // the heavy brow, dipping toward the nose when he is angry
  const dip = o.angry ? 0.2 : 0;
  oval(g, C.white, 1.3, 1.8, -1.9 + dip * 5, 8.9, 2.4, 0.2 + dip);
  // nose
  stroke(g, '#241419', 1.8, () => {
    g.moveTo(7.2, 6.2);
    g.lineTo(10.8, 6.6);
  });
  const open = o.mouth || 0;
  if (open > 0.12) {
    shape(g, '#2a1218', 1.1, () => {
      g.moveTo(1.2, 9.8);
      g.quadraticCurveTo(6.5, 8.6, 11.2, 9.4);
      g.quadraticCurveTo(7.4, 10.4 + open * 7, 1.2, 9.8);
    });
    // a fang
    shape(g, C.white, 0.7, () => {
      g.moveTo(7.6, 9.3);
      g.lineTo(9.4, 9.2);
      g.lineTo(8.6, 10.6 + open * 1.4);
    });
  } else {
    stroke(g, '#241419', 1.15, () => {
      g.moveTo(1.4, 10.4);
      g.quadraticCurveTo(5, 9.6, 8.6, 10.2);
    });
  }
}

// a tall bent hat with a wide brim, in royal purple with a gold band and stars. Its brim's middle is at (1, -9.2)
function drawHat(g) {
  g.lineJoin = 'round';
  // the cone, its point flopping over backwards
  const gr = g.createLinearGradient(-12, -36, 10, -10);
  gr.addColorStop(0, C.cloakDark);
  gr.addColorStop(1, C.robe);
  shape(g, gr, 1.7, () => {
    g.moveTo(-10.5, -9);
    g.bezierCurveTo(-8, -20, -5, -29, -2, -34);
    g.bezierCurveTo(-7, -35, -13, -33, -18, -27);
    g.bezierCurveTo(-15, -38, -5, -43, 3, -36);
    g.bezierCurveTo(6, -27, 9, -18, 11.5, -10);
  });
  shape(g, C.gold, 1.2, () => {
    g.moveTo(-10, -11.4);
    g.quadraticCurveTo(1, -13.6, 11.4, -12.2);
    g.lineTo(9.8, -16.4);
    g.quadraticCurveTo(0, -17.8, -8.8, -15.6);
  });
  oval(g, C.robe, 1.7, 1, -9.2, 18.5, 3.9, 0.04);
  star(g, 1.8, -23, 4.6, C.goldLite);
}

export function drawGibbonHatDrop(g) {
  g.save();
  g.scale(0.62, 0.62);
  g.translate(2, 24);
  drawHat(g);
  g.restore();
}

// the hat with the middle of its brim at the origin, for whatever is wearing it
export function drawGibbonHatWorn(g) {
  g.save();
  g.translate(-1, 9.2);
  drawHat(g);
  g.restore();
}

// a long gnarled staff with a crooked head holding a golden orb. Origin: where he grips it, near its foot
function drawStaff(g) {
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const wood = () => {
    g.beginPath();
    g.moveTo(0.4, 6);
    g.quadraticCurveTo(-2.2, -9, 0, -22);
    g.quadraticCurveTo(2.4, -36, -0.6, -47);
    g.quadraticCurveTo(-2, -53, -1, -55);
    g.bezierCurveTo(-8, -59, -7.4, -70, 1.4, -70.4);
    g.bezierCurveTo(7, -70.4, 9.6, -65, 7.4, -61);
  };
  for (const [col, wide] of [[OUT, 6], [C.wood, 3.6]]) {
    g.strokeStyle = col;
    g.lineWidth = wide;
    wood();
    g.stroke();
  }
  stroke(g, C.woodDark, 1, () => {
    g.moveTo(-0.9, -8);
    g.quadraticCurveTo(0.6, -16, 0.5, -24);
  });
  // a knot and a gold collar
  oval(g, C.woodDark, 1.2, 1, -39, 2.4, 3);
  shape(g, C.gold, 1.1, () => g.rect(-3.4, -54.6, 6, 3.2));
  const orb = g.createRadialGradient(-0.4, -64.6, 0.4, 1, -63, 6);
  orb.addColorStop(0, '#fffbe0');
  orb.addColorStop(0.5, '#ffd23c');
  orb.addColorStop(1, '#e58a12');
  oval(g, orb, 1.4, 1, -63, 5.4, 5.4);
}
const ORB_AT = [1, -63];

export function buildGibbonArt() {
  return {
    body: makeLayer(-37, -44, 28, 16, drawBody),
    hat: makeLayer(-22, -46, 23, -3, drawHat),
    staff: makeLayer(-11, -74, 13, 10, drawStaff),
  };
}

// ---------------------------------------------------------------- the parts drawn live
// where an elbow or knee goes, given both ends and how long each half is; `bend` picks which way it sticks out
function joint(a, b, len, bend) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy) || 1;
  const out = Math.sqrt(Math.max(0, len * len - (d / 2) * (d / 2)));
  return [mx - (dy / d) * out * bend, my + (dx / d) * out * bend];
}

// a limb as one smooth shape through three points, thick at the top
function limb(g, a, m, b, widths, fill) {
  const pts = [a, m, b];
  const path = (extra) => {
    for (let i = 0; i < 2; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const r0 = widths[i] + extra;
      const r1 = widths[i + 1] + extra;
      const an = Math.atan2(y1 - y0, x1 - x0);
      g.moveTo(x0 + Math.cos(an + Math.PI / 2) * r0, y0 + Math.sin(an + Math.PI / 2) * r0);
      g.lineTo(x1 + Math.cos(an + Math.PI / 2) * r1, y1 + Math.sin(an + Math.PI / 2) * r1);
      g.arc(x1, y1, r1, an + Math.PI / 2, an - Math.PI / 2, true);
      g.lineTo(x0 + Math.cos(an - Math.PI / 2) * r0, y0 + Math.sin(an - Math.PI / 2) * r0);
      g.arc(x0, y0, r0, an - Math.PI / 2, an + Math.PI / 2, true);
      g.closePath();
    }
  };
  // the outline goes down first and the fur over it, so no line is left across the joint
  g.fillStyle = OUT;
  g.beginPath();
  path(1.5);
  g.fill();
  g.fillStyle = fill;
  g.beginPath();
  path(0);
  g.fill();
}

// the ape's round fist, knuckles to the ground, in a gibbon's white fur. `from` is the elbow
function fist(g, x, y, from, far) {
  const r = far ? 6.4 : 7.5;
  const lean = Math.atan2(y - from[1], x - from[0]) - Math.PI / 2;
  g.save();
  g.translate(x, y);
  g.rotate(lean);
  // a ragged edge where the white starts, and round at the end
  shape(g, far ? C.whiteShade : C.white, 1.4, () => {
    g.moveTo(-r, -3.2);
    g.lineTo(-r * 0.55, -5.8);
    g.lineTo(-r * 0.25, -3.4);
    g.lineTo(r * 0.18, -6.2);
    g.lineTo(r * 0.45, -3.4);
    g.lineTo(r, -4.6);
    g.lineTo(r, 0);
    g.arc(0, 0, r, 0, Math.PI);
  });
  stroke(g, OUT, 1, () => g.arc(r * 0.24, r * 0.24, r * 0.46, 0.5, Math.PI * 1.72));
  g.restore();
}

// the wide sleeve of the robe: round over the shoulder, down past the elbow, and open at a gold cuff
function sleeve(g, s, e, w, far) {
  const c = [e[0] + (w[0] - e[0]) * 0.2, e[1] + (w[1] - e[1]) * 0.2];
  const [rs, re, rc] = far ? [9.4, 7.8, 9.4] : [11.4, 9.2, 11.2];
  const a1 = Math.atan2(e[1] - s[1], e[0] - s[0]);
  const a2 = Math.atan2(c[1] - e[1], c[0] - e[0]);
  const side = (p, a, r, k) => [p[0] + Math.cos(a + (Math.PI / 2) * k) * r, p[1] + Math.sin(a + (Math.PI / 2) * k) * r];
  const mid = Math.atan2(Math.sin(a1) + Math.sin(a2), Math.cos(a1) + Math.cos(a2));
  const down = [Math.cos(a2), Math.sin(a2)];
  const l = side(c, a2, rc, 1);
  const r = side(c, a2, rc, -1);
  shape(g, far ? C.robeFar : C.robe, 1.7, () => {
    g.moveTo(...side(s, a1, rs, 1));
    g.quadraticCurveTo(...side(e, mid, re, 1), ...l);
    g.quadraticCurveTo(c[0] + down[0] * 3.4, c[1] + down[1] * 3.4, ...r);
    g.quadraticCurveTo(...side(e, mid, re, -1), ...side(s, a1, rs, -1));
    g.arc(s[0], s[1], rs, a1 - Math.PI / 2, a1 + Math.PI / 2, true);
  });
  shape(g, far ? '#b98a26' : C.gold, 1.2, () => {
    g.moveTo(...l);
    g.quadraticCurveTo(c[0] + down[0] * 3.4, c[1] + down[1] * 3.4, ...r);
    g.lineTo(r[0] - down[0] * 3.6, r[1] - down[1] * 3.6);
    g.quadraticCurveTo(c[0] - down[0] * 0.2, c[1] - down[1] * 0.2, l[0] - down[0] * 3.6, l[1] - down[1] * 3.6);
  });
}

// the ape's arm: a great round shoulder and a thick forearm hardly narrower than the top of it
function arm(g, shoulder, wrist, far, bend = -1) {
  const elbow = joint(shoulder, wrist, bend < 0 ? 20 : 13, bend);
  limb(g, shoulder, elbow, wrist, far ? [8.4, 6.2, 6.2] : [10.6, 7.6, 7.4], far ? C.furFar : C.fur);
  // the few ticks of fur down the forearm
  if (!far) {
    stroke(g, OUT, 0.9, () => {
      for (const q of [0.5, 0.64, 0.78]) {
        const x = elbow[0] + (wrist[0] - elbow[0]) * q - 4.4;
        const y = elbow[1] + (wrist[1] - elbow[1]) * q;
        g.moveTo(x, y + 1.6);
        g.lineTo(x + 2, y - 1.4);
      }
    });
  }
  sleeve(g, shoulder, elbow, wrist, far);
  fist(g, wrist[0], wrist[1], elbow, far);
}

// his back leg: a round thigh, a short shin and a flat foot
function leg(g, hip, ankle, far) {
  const knee = joint(hip, ankle, 11.4, 1);
  limb(g, hip, knee, ankle, far ? [7.2, 5.6, 4] : [8.4, 6.8, 4.6], far ? C.furFar : C.fur);
  const [x, y] = ankle;
  shape(g, far ? C.whiteShade : C.white, 1.4, () => {
    g.moveTo(x - 4.6, y - 1);
    g.bezierCurveTo(x - 5.6, y + 3.4, x - 1, y + 4.8, x + 4, y + 4);
    g.quadraticCurveTo(x + 11.4, y + 3.8, x + 10.8, y + 0.8);
    g.quadraticCurveTo(x + 10, y - 1.8, x + 6.6, y - 0.6);
    g.quadraticCurveTo(x + 3, y - 3.4, x - 1, y - 3.4);
  });
}

// the cloak over his shoulders and back, gold at the hem; `sweep` carries it out behind, `wave` ripples it
function cloak(g, sweep, wave) {
  const flick = wave * 0.8;
  shape(g, C.cloakDark, 1.7, () => {
    g.moveTo(-4, -39);
    g.quadraticCurveTo(-9 - flick, -47, -14 - flick, -55);
    g.quadraticCurveTo(-3, -52, 3, -47);
    g.quadraticCurveTo(7, -53, 9 + flick, -58);
    g.quadraticCurveTo(14, -48, 19, -34);
    g.lineTo(6, -31);
  });
  shape(g, C.lining, 0, () => {
    g.moveTo(-8 - flick, -49);
    g.quadraticCurveTo(-1, -48, 4, -43);
    g.quadraticCurveTo(6, -48, 8 + flick, -53);
    g.quadraticCurveTo(11, -45, 13, -37);
    g.lineTo(2, -38);
  });
  stroke(g, C.gold, 2, () => {
    g.moveTo(-14 - flick, -55);
    g.quadraticCurveTo(-3, -52, 3, -47);
    g.quadraticCurveTo(7, -53, 9 + flick, -58);
  });
  const tx = -43 - sweep * 14;
  const ty = 5 - sweep * 21 + wave * 3;
  const hem = () => {
    g.moveTo(tx, ty);
    g.quadraticCurveTo(tx + 7, ty + 5 - sweep * 3 + wave * 2, -31 - sweep * 6, 3 - sweep * 9 - wave * 2);
    g.bezierCurveTo(-28 - sweep * 3, -13 - sweep * 4 + wave, -13, -23, 4, -22);
  };
  const gr = g.createLinearGradient(0, -42, -30, 4);
  gr.addColorStop(0, C.cloak);
  gr.addColorStop(1, C.cloakDark);
  shape(g, gr, 1.7, () => {
    hem();
    g.bezierCurveTo(10, -22, 16, -27, 15, -33);
    g.bezierCurveTo(14, -41, 6, -45, -2, -42.6);
    g.bezierCurveTo(-12, -40, -22, -34, -28, -28);
    g.bezierCurveTo(-35 - sweep * 4, -21 - sweep * 5, -36 - sweep * 9 + wave * 2, -7 - sweep * 10, tx, ty);
  });
  g.lineCap = 'round';
  for (const [col, wide] of [[OUT, 4.6], [C.gold, 2.4]]) {
    g.strokeStyle = col;
    g.lineWidth = wide;
    g.beginPath();
    hem();
    g.stroke();
  }
}

// the gold star that holds it
function clasp(g) {
  shape(g, C.gold, 1.3, () => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU - Math.PI / 2;
      const r = i % 2 ? 2.7 : 5.6;
      g.lineTo(11.5 + Math.cos(a) * r, -27.5 + Math.sin(a) * r);
    }
  });
}

// ---------------------------------------------------------------- poses
// nw / fw: near and far wrist, nf / ff: near and far ankle, staff: its tilt (0 upright, + forward),
// lean: the whole upper body about the hips, head: its nod (+ down), bob: how high he bounds, mouth: 0..1
// At rest he stands as the ape does, on his knuckles, the staff planted by his front fist and leaning out past his face.
const REST = { nwx: 15, nwy: 21.5, fwx: 25, fwy: 18.5, nfx: -19, nfy: 17.5, ffx: -12, ffy: 20, staff: 0.62, lean: 0, head: 0, bob: 0, mouth: 0 };
const POSES = {
  // reared up, the staff and both fists swung up over his head...
  raise: { nwx: -3, nwy: -60, fwx: -17, fwy: -52, staff: -0.75, lean: -0.21, head: -0.1, mouth: 0.8 },
  // ...and brought down on the ground
  slam: { nwx: 34, nwy: 14, fwx: 28, fwy: 20, staff: 1.75, lean: 0.2, head: 0.12, mouth: 0.45 },
  leap: { nwx: 37, nwy: -30, fwx: 30, fwy: -20, nfx: -34, nfy: 10, ffx: -24, ffy: 16, staff: 0.7, lean: 0.1, head: -0.05, mouth: 0.6 },
  draw: { nwx: -6, nwy: -50, fwx: 30, fwy: 6, staff: -0.75, lean: -0.2, head: -0.1, mouth: 0.15 },
  cast: { nwx: 39, nwy: -15, fwx: 12, fwy: 20, staff: 1.12, lean: 0.07, head: 0.03, mouth: 0.65 },
  cheer: { nwx: 16, nwy: -62, fwx: -24, fwy: -48, staff: 0, lean: -0.26, head: -0.14, mouth: 0.9 },
};
const STIFF = { calm: [230, 21], snap: [620, 35] };

function posed(u, R, dead, t) {
  const d = u.def;
  let want = { ...REST };
  let snap = false;
  if (R.move > 0.05 && !dead) {
    // he bounds along as the ape does: both arms reach out together while the back legs trail, and he leaves the
    // ground; then the arms plant and come back as the legs swing in under him (the far pair a touch behind)
    const k = R.move;
    for (const [hand, foot, late] of [['nw', 'nf', 0], ['fw', 'ff', 0.55]]) {
      const c = Math.cos(R.phase - late);
      const s = Math.sin(R.phase - late);
      want[hand + 'x'] += c * 12 * k;
      want[hand + 'y'] += -Math.max(0, -s) * 12 * k;
      want[foot + 'x'] += -c * 11 * k;
      want[foot + 'y'] += -Math.max(0, s) * 9 * k;
    }
    want.bob = -Math.max(0, Math.cos(R.phase)) * 5 * k;
    want.lean += Math.sin(R.phase) * 0.09 * k;
    want.staff += -Math.cos(R.phase) * 0.18 * k;
    want.head += -Math.sin(R.phase) * 0.07 * k;
  }
  if (!dead) {
    if (u.leap) {
      want = { ...want, ...POSES.leap };
      // coming down, he hauls the staff back to strike
      if (u.leap.t / d.leap.time > 0.62) want = { ...want, ...POSES.raise, nfx: -30, nfy: 14, ffx: -20, ffy: 18 };
      snap = true;
    } else if (u.stormT !== null && u.stormT !== undefined) {
      // up, down; up again, higher; and down; and then he holds the staff to the sky as it breaks
      const q = u.stormT;
      const up = q < STORM.tap1 - 0.1 || (q > STORM.tap1 + 0.1 && q < STORM.tap2 - 0.1);
      want = { ...want, ...(up ? POSES.raise : q > STORM.strike - 0.04 ? POSES.cheer : POSES.slam), bob: 0 };
      snap = true;
    } else if (u.landT > 0.08) {
      want = { ...want, ...POSES.slam };
      snap = true;
    } else if (u.slamT > 0) {
      want = { ...want, ...(u.slamT > d.slam.time * 0.48 ? POSES.raise : POSES.slam) };
      snap = true;
    } else if (u.castT > 0) want = { ...want, ...POSES.draw };
    else if (u.castFlash > 0) {
      want = { ...want, ...POSES.cast };
      snap = true;
    } else if (R.happy) want = { ...want, ...POSES.cheer };
    else if (R.fidget === 'scratch' && R.q < 0.88) {
      // a good scratch at the back of his head
      want = { ...want, fwx: 12 + Math.sin(t * 24) * 2.2, fwy: -37 + Math.cos(t * 24) * 1.8, head: 0.2, lean: -0.05 };
    } else if (R.fidget === 'twirl') {
      want = { ...want, nwx: 40, nwy: -8, staff: 0.62 + R.q * TAU * 2 };
      snap = true;
    } else if (R.fidget === 'hoot') {
      // gibbons sing
      const swell = Math.sin(R.q * Math.PI);
      want = { ...want, head: -0.38 * swell, mouth: swell * (0.65 + 0.35 * Math.abs(Math.sin(t * 13))), lean: -0.13 * swell, fwx: 25 - 20 * swell, fwy: 18.5 - 24 * swell };
    }
  }
  if (dead) return { ...REST, mouth: 0.3, nwy: 14, staff: 1.1 };
  let s = u.gib;
  const dt = Math.min(0.15, Math.max(0, u.breath - (s ? s.at : u.breath)));
  if (!s) {
    s = u.gib = { at: u.breath, p: {} };
    for (const k in REST) s.p[k] = { x: REST[k], v: 0 };
  }
  s.at = u.breath;
  const [stiff, damp] = snap ? STIFF.snap : STIFF.calm;
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  const out = {};
  for (const k in REST) {
    const p = s.p[k];
    // (a twirl is a full turn or two: when it ends, unwind to the same angle rather than spin back)
    if (k === 'staff' && Math.abs(p.x - want[k]) > Math.PI * 1.5) p.x -= Math.round((p.x - want[k]) / TAU) * TAU;
    for (let i = 0; i < steps; i++) {
      p.v += ((want[k] - p.x) * stiff - p.v * damp) * h;
      p.x += p.v * h;
    }
    out[k] = p.x;
  }
  return out;
}

// where the upper body turns: about his hips
const HIP = [-18, 0];
// the middle of his head
const HEAD = [25, -22];

// the whole of him, in art units about his middle. `live` is left out for the menu picture
function paint(g, A, P, face, live) {
  const art = (fn) => {
    g.save();
    g.scale(K, K);
    fn();
    g.restore();
  };
  const upper = (fn) => {
    g.save();
    g.translate(HIP[0] * K, (HIP[1] + P.bob) * K);
    g.rotate(P.lean);
    g.translate(-HIP[0] * K, -HIP[1] * K);
    fn();
    g.restore();
  };
  // a point on the upper body, after it has turned
  const turned = (x, y) => {
    const c = Math.cos(P.lean);
    const s = Math.sin(P.lean);
    return [HIP[0] + (x - HIP[0]) * c - (y - HIP[1]) * s, HIP[1] + P.bob + (x - HIP[0]) * s + (y - HIP[1]) * c];
  };
  const farWrist = [P.fwx, P.fwy];
  const nearWrist = [P.nwx, P.nwy];
  // an arm lifted high passes in front of his head; otherwise his head is in front of it
  const raised = P.nwy < -24;
  const staff = () => {
    g.save();
    g.translate(nearWrist[0] * K, nearWrist[1] * K);
    g.rotate(P.staff);
    if (live && live.power > 0.02) live.orb(g, ORB_AT[0], ORB_AT[1]);
    drawLayer(g, A.staff);
    if (live && live.power > 0.02) live.shine(g, ORB_AT[0], ORB_AT[1]);
    g.restore();
  };
  const nearArm = () => {
    staff();
    art(() => arm(g, turned(9, -18), nearWrist, false));
  };
  const head = () => upper(() => {
    // head, and the hat riding its own spring on top
    g.save();
    g.translate(HEAD[0] * K, HEAD[1] * K);
    g.rotate(P.head);
    art(() => drawGibbonFace(g, face));
    g.translate(-6 * K, -12.6 * K);
    g.rotate(0.08);
    if (live) applyBotCap(g, { cap: live.cap, capRot: live.capRot });
    g.scale(0.84, 0.84);
    g.translate(-1 * K, 9.2 * K);
    drawLayer(g, A.hat);
    g.restore();
  });
  art(() => {
    if (!(live && live.farFront)) arm(g, turned(17, -17), farWrist, true);
    leg(g, [-16, -6 + P.bob], [P.ffx, P.ffy], true);
  });
  upper(() => {
    drawLayer(g, A.body);
    art(() => cloak(g, live ? live.sweep : 0.1, live ? live.wave : 0));
  });
  art(() => leg(g, [-22, -4.5 + P.bob], [P.nfx, P.nfy], false));
  if (!raised) nearArm();
  head();
  if (raised) nearArm();
  upper(() => art(() => clasp(g)));
  // (a hand up scratching his head has to come round in front of it)
  if (live && live.farFront) art(() => arm(g, turned(6, -20), farWrist, false, 1));
}

function glow(g, x, y, r, rgb, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb}, ${a})`);
  gr.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
}

export function drawGibbonStill(g, A) {
  paint(g, A, REST, { lx: 0.7, ly: 0.2, mouth: 0 }, null);
}

// `overlay(ctx, u, rx, ry, cx, cy)` paints burning / frozen / poisoned tints
export function drawGibbondore(ctx, dpr, sprites, u, overlay) {
  const A = sprites.gibbondore;
  const d = u.def;
  const dead = !!u.tilt;
  const clock = performance.now() / 1000;
  const t = clock + (u.id || 0) * 0.737;
  if (u.born === undefined) u.born = clock;
  const age = dead ? 9 : clock - u.born;
  const alt = dead ? 0 : u.alt || 0;
  const storming = u.stormT !== null && u.stormT !== undefined;
  const busy = !!u.leap || u.slamT > 0 || u.castT > 0 || u.landT > 0 || storming;
  const R = rigStep(u, {
    age, dead, moving: u.moving && !dead, alt,
    bang: u.castFlash > 0 ? 1 : 0,
    kick: 0.45,
    cadence: 1.8,
    calm: !u.target && !u.moving,
    busy,
    fidgets: ['look', 'scratch', 'scratch', 'twirl', 'hoot', 'hops'],
    aim: {},
  });
  const P = posed(u, R, dead, t);

  const wobble = u.hit > 0.14 ? (Math.random() - 0.5) * 1.4 : 0;
  ctx.setTransform(u.facing * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
  if (u.tilt) {
    ctx.translate(0, FEET);
    ctx.rotate(u.tilt);
    ctx.translate(0, -FEET);
  }
  // his shadow stays on the ground, shrinking while he is in the air
  if (!dead) {
    ctx.save();
    ctx.translate(-1, FEET + 0.6);
    ctx.scale(1, 0.28);
    const r = 36 * K * d.scale * (1 - alt * 0.35);
    glow(ctx, 0, 0, r, '0, 0, 0', 0.46 - alt * 0.22);
    ctx.restore();
  }
  // ground effects of what he is up to: gold light gathering as he rears up or winds a spell
  const gather = !dead && u.castT > 0 ? 1 - u.castT / d.spell.cast : !dead && u.slamT > d.slam.time * 0.48 ? (d.slam.time - u.slamT) / (d.slam.time * 0.52) : 0;
  if (gather > 0) {
    for (let i = 0; i < 2; i++) {
      const q = (t * 2.2 + i / 2) % 1;
      ctx.strokeStyle = `rgba(240, 175, 35, ${0.8 * q * gather})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, FEET + 1, 30 - 19 * q, (30 - 19 * q) * 0.34, 0, 0, TAU);
      ctx.stroke();
    }
  }
  if (!dead) stepDust(ctx, R, 1.2);

  const fall = age < 0.28 ? age / 0.28 : 0;
  if (age < 0.28) ctx.translate(0, -46 * (1 - fall ** 2));
  if (alt > 0.01) ctx.translate(0, -alt * d.leap.height);
  ctx.translate(0, FEET);
  ctx.scale(d.scale * (1 - 0.08 * fall), d.scale * (1 + 0.14 * fall));
  ctx.translate(0, -FEET);
  applyBotBody(ctx, R);

  const blink = t % 3.6;
  let shut = !busy && blink < 0.15 ? Math.sin((blink / 0.15) * Math.PI) : 0;
  if (R.fidget === 'scratch' || R.fidget === 'hoot') shut = 1;
  const look = u.target ? [1, 0.2] : R.fidget === 'look' ? [Math.sin(R.q * TAU) * 1.4, -0.2] : [Math.sin(t * 0.8) * 0.8, Math.sin(t * 1.5) * 0.5];
  const power = dead ? 0 : storming ? 1 : u.castT > 0 ? 1 - u.castT / d.spell.cast : u.castFlash > 0 ? u.castFlash / 0.28 : u.slamT > 0 || u.leap ? 0.8 : 0.16 + 0.06 * Math.sin(t * 3);
  paint(ctx, A, P, { lx: look[0], ly: look[1], shut, happy: R.happy, angry: busy && !R.happy, mouth: Math.max(0, Math.min(1, P.mouth)), dead }, {
    sweep: dead ? 0 : Math.max(0.1 + Math.sin(t * 1.9) * 0.1, R.move * 0.7 + Math.sin(R.phase) * 0.08 * R.move, alt, busy ? 0.5 : 0),
    wave: dead ? 0 : Math.sin(t * (R.move > 0.3 || busy ? 11 : 2.6)),
    cap: R.cap * 0.8,
    capRot: R.capRot,
    power,
    farFront: !dead && P.fwy < -26 && R.fidget === 'scratch',
    orb: (g, x, y) => glow(g, x * K, y * K, (11 + 15 * power) * K, '255, 190, 40', 0.45 + 0.4 * power),
    shine: (g, x, y) => {
      // (the angle is built up bit by bit, so a change of speed never makes them jump)
      const turned = Math.min(0.15, Math.max(0, t - (u.starAt === undefined ? t : u.starAt)));
      u.starAt = t;
      u.starAn = (u.starAn || 0) + turned * (2.4 + 7 * power);
      g.lineJoin = 'round';
      for (let i = 0; i < 3; i++) {
        const an = u.starAn + (i / 3) * TAU;
        const sx = x + Math.cos(an) * (11 + 4 * power);
        const sy = y + Math.sin(an) * (4.6 + 2 * power);
        const r = (2.6 + 0.7 * Math.sin(an)) * (1 + 0.35 * power);
        g.beginPath();
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * TAU - Math.PI / 2;
          const q = k % 2 ? r * 0.46 : r;
          g.lineTo((sx + Math.cos(a) * q) * K, (sy + Math.sin(a) * q) * K);
        }
        g.closePath();
        g.strokeStyle = OUT;
        g.lineWidth = 1.2 * K;
        g.stroke();
        g.fillStyle = '#ffe14a';
        g.fill();
      }
      if (power < 0.3) return;
      g.fillStyle = `rgba(255, 250, 215, ${power})`;
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = t * 4 + (i / 8) * TAU;
        const r = (i % 2 ? 1.8 : 7 + 7 * power) * K;
        if (i) g.lineTo(x * K + Math.cos(a) * r, y * K + Math.sin(a) * r);
        else g.moveTo(x * K + Math.cos(a) * r, y * K + Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
    },
  });
  // his song rings out
  if (R.fidget === 'hoot') {
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const q = (R.q * 3 + i / 3) % 1;
      ctx.strokeStyle = `rgba(200, 140, 40, ${0.85 * (1 - q) * Math.sin(R.q * Math.PI)})`;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(37 * K, -18 * K, (6 + 24 * q) * K, -1.1, 0.5);
      ctx.stroke();
    }
  }
  if (overlay) overlay(ctx, u, d.body[0] * K, d.body[1] * K, 0, d.body[2] * K);
  // he takes a lot of knocks, so a soft flash rather than turning solid white
  if (!dead && u.hit > 0) glow(ctx, 0, -17 * K, 40 * K, '240, 246, 255', Math.min(0.75, u.hit * 3.8));
}
