import { HEAT_R } from '../sim/constants.js';
import { noise, tone } from './audio.js';
import { calm } from './env.js';
import { app } from './state.js';
import { OUTCOL, OUTWORD, PAPER, RAINBOW, SUN, hue } from './theme.js';

/* ----- effects: particles, pop-up words, rings, screen shake, and turning sim events into sound + visuals ----- */
export const parts = [], pops = [], rings = [], ghosts = [], bolts = [], flashes = [];
let shake = 0, lastBounce = 0;
export function shakeAmount() { return shake; }
export function resetFx() {
  parts.length = 0; pops.length = 0; rings.length = 0; shake = 0;
  ghosts.length = 0; bolts.length = 0; flashes.length = 0;
}
export function burst(x, y, color, n, speed, size) {
  if (parts.length > 420) return;
  for (var i = 0; i < n; i++) {
    var a = Math.random() * 6.283, v = speed * (0.35 + Math.random() * 0.65);
    parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.3 + Math.random() * 0.4, size: size * (0.6 + Math.random() * 0.7),
      color: color === 'rainbow' ? RAINBOW[(Math.random() * 6) | 0] : color });
  }
}
export function pop(x, y, text, color) { pops.push({ x: x, y: y, text: text, color: color || PAPER, life: 0, max: 0.9 }); }
export function jolt(k) { if (!calm()) shake = Math.max(shake, k); }

export function handleEvents() {
  var ev = app.g.events, p = app.g.squares[0];
  for (var i = 0; i < ev.length; i++) {
    var e = ev[i], s = e.s;
    switch (e.type) {
      case 'bounce':
        if (s === p && performance.now() - lastBounce > 70) { lastBounce = performance.now(); tone(210, 150, 0.05, 'square', 0.03); }
        break;
      case 'bump':
        burst(e.x, e.y, PAPER, 4, 4, 0.16);
        if (e.a === p || e.b === p) tone(300, 200, 0.06, 'triangle', 0.06);
        break;
      case 'clash':
        burst(e.x, e.y, SUN, 10, 7, 0.18); pop(e.x, e.y - 0.6, 'CLASH', SUN);
        tone(900, 500, 0.08, 'square', 0.05); jolt(0.1);
        break;
      case 'ram':
        burst(e.on.x, e.on.y, hue(e.on.col), 14, 8, 0.24); pop(e.on.x, e.on.y - 1, '-1', e.on === p ? '#ff9c94' : PAPER);
        if (e.by === p) tone(520, 1040, 0.12, 'square', 0.06); else { tone(200, 70, 0.25, 'sawtooth', 0.08); jolt(0.3); }
        jolt(0.14);
        break;
      case 'hurt':
        if (e.src !== 'ram') {
          burst(s.x, s.y, hue(s.col), 12, 7, 0.22); pop(s.x, s.y - 1, '-1', s === p ? '#ff9c94' : PAPER);
          if (s === p) { tone(200, 70, 0.25, 'sawtooth', 0.08); jolt(0.3); } else tone(700, 350, 0.1, 'square', 0.04);
        }
        break;
      case 'stun':
        burst(s.x, s.y, PAPER, 8, 6, 0.18); pop(s.x, s.y - 1, 'STUN', s === p ? '#ff9c94' : PAPER);
        if (s === p) { tone(240, 90, 0.22, 'sawtooth', 0.08); jolt(0.25); }
        break;
      case 'tink':
        burst(s.x, s.y, '#ffffff', 3, 4, 0.12);
        break;
      case 'crate':
        burst(e.x, e.y, '#c99f58', 7, 6, 0.24); noise(0.07, 0.07, 1800);
        break;
      case 'explode':
        rings.push({ x: e.x, y: e.y, r: e.r, life: 0, max: 0.4 });
        burst(e.x, e.y, '#ff8a1e', 26, 13, 0.3); burst(e.x, e.y, SUN, 14, 9, 0.22);
        noise(0.4, 0.25, 700); tone(120, 40, 0.35, 'sine', 0.2); jolt(0.5);
        break;
      case 'death':
        burst(s.x, s.y, hue(s.col), 30, 11, 0.32); burst(s.x, s.y, s.col.rainbow ? 'rainbow' : s.col.light, 12, 6, 0.22);
        rings.push({ x: s.x, y: s.y, r: 1.6, life: 0, max: 0.3 });
        noise(0.18, 0.12, 900); jolt(0.3);
        break;
      case 'boost':
        burst(s.x, s.y, SUN, 8, 6, 0.18);
        if (s === p) tone(400, 1200, 0.16, 'sawtooth', 0.04);
        break;
      case 'heat':
        pop(s.x, s.y - 1.2, 'HEAT', '#ff8a1e'); burst(s.x, s.y, '#ff8a1e', 22, 10, 0.26); burst(s.x, s.y, SUN, 12, 7, 0.2);
        rings.push({ x: s.x, y: s.y, r: HEAT_R, life: 0, max: 0.35 });
        tone(220, 880, 0.3, 'sawtooth', 0.06); jolt(0.2);
        break;
      case 'burn':
        burst(s.x, s.y, '#ff8a1e', 22, 10, 0.28); pop(s.x, s.y - 1, 'MELTED', '#ff8a1e');
        noise(0.25, 0.14, 1400);
        break;
      case 'pickup':
        pop(s.x, s.y - 1.1, 'GUN', SUN); burst(s.x, s.y, SUN, 10, 6, 0.2); tone(300, 900, 0.12, 'square', 0.06);
        break;
      case 'shot':
        burst(e.x, e.y, SUN, 5, 7, 0.16); burst(e.x, e.y, '#ffffff', 2, 4, 0.14);
        noise(0.06, 0.16, 2600); tone(180, 60, 0.07, 'square', 0.07); jolt(0.08);
        break;
      case 'drop':
        burst(e.x, e.y, PAPER, 5, 4, 0.14);
        break;
      case 'spark':
        burst(e.x, e.y, '#ffffff', 4, 5, 0.12);
        break;
      case 'out':
        ghosts.push({ x: s.x, y: s.y, col: s.col, how: e.how, ux: s.ux, uy: s.uy, life: 0, max: e.how === 'volt' ? 1.1 : 2.2 });
        pop(s.x, s.y - 1.1, OUTWORD[e.how], OUTCOL[e.how]);
        if (e.how === 'volt') { bolts.push({ x1: e.bx, y1: e.by, x2: s.x, y2: s.y, life: 0, max: 0.32 }); burst(s.x, s.y, SUN, 18, 9, 0.22); burst(s.x, s.y, '#ffffff', 8, 6, 0.16); }
        else if (e.how === 'frost') { burst(s.x, s.y, '#d8f3ff', 16, 7, 0.24); burst(s.x, s.y, '#ffffff', 8, 5, 0.18); tone(1900, 700, 0.3, 'triangle', 0.07); }
        else { burst(s.x, s.y, '#9fb6ff', 14, 7, 0.22); tone(520, 0, 0.09, 'square', 0.06); tone(390, 0, 0.09, 'square', 0.06, 0.1); tone(260, 0, 0.2, 'square', 0.06, 0.2); }
        if (s === p) jolt(0.4); else jolt(0.12);
        break;
      case 'charge':
        tone(240, 720, 0.5, 'sawtooth', 0.035);
        break;
      case 'zap':
        flashes.push({ x: e.x, y: e.y, r: e.r, life: 0, max: 0.3 });
        noise(0.22, 0.2, 3200); tone(1500, 180, 0.22, 'sawtooth', 0.07); jolt(0.16);
        break;
      case 'throw':
        burst(e.x, e.y, '#ffffff', 6, 6, 0.16); tone(1300, 1900, 0.09, 'triangle', 0.06); noise(0.05, 0.05, 4000);
        break;
      case 'chip':
        burst(e.x, e.y, '#d8f3ff', 4, 4, 0.14);
        break;
      case 'siren':
        tone(660, 0, 0.13, 'square', 0.045); tone(880, 0, 0.13, 'square', 0.045, 0.14); tone(660, 0, 0.13, 'square', 0.045, 0.28); tone(880, 0, 0.13, 'square', 0.045, 0.42);
        if (s) pop(app.g.boss.x, app.g.boss.y - 2.3, 'STOP!', '#ff9c94');
        break;
      case 'phew':
        pop(e.x, e.y - 2.3, e.bust ? 'GOTCHA' : 'PHEW', PAPER); tone(300, 160, 0.3, 'sine', 0.06);
        break;
      case 'wave':
        burst(e.x, e.y, '#fff7b0', 8, 7, 0.18); noise(0.12, 0.12, 3600); tone(900, 260, 0.16, 'sawtooth', 0.05);
        break;
      case 'fizz':
        burst(e.x, e.y, '#fff7b0', 3, 4, 0.12);
        break;
      case 'bosshit':
        burst(e.x, e.y, '#ff8a1e', 30, 12, 0.3); burst(e.x, e.y, SUN, 16, 9, 0.24);
        rings.push({ x: e.x, y: e.y, r: 2.6, life: 0, max: 0.35 });
        pop(e.x, e.y - 2.2, e.hp > 0 ? 'BURNED!' : 'DONE FOR!', '#ffb347');
        noise(0.25, 0.2, 1500); tone(700, 1400, 0.14, 'square', 0.07); jolt(0.3);
        break;
      case 'blink':
        if (e.how === 'frost') {
          /* Frost goes in a flurry of snow */
          for (var bi = 0; bi <= 6; bi++) burst(e.x1 + (e.x2 - e.x1) * bi / 6, e.y1 + (e.y2 - e.y1) * bi / 6, bi % 2 ? '#ffffff' : '#bfe9ff', bi === 0 || bi === 6 ? 14 : 5, 6, 0.26);
          tone(2200, 900, 0.22, 'triangle', 0.05); noise(0.18, 0.08, 5000);
        } else {
          bolts.push({ x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, life: 0, max: 0.4 });
          burst(e.x2, e.y2, '#fff7b0', 14, 8, 0.2); tone(1600, 500, 0.18, 'triangle', 0.05);
        }
        break;
      case 'frozen':
        burst(s.x, s.y, '#d8f3ff', 16, 7, 0.24); burst(s.x, s.y, '#ffffff', 8, 5, 0.18);
        pop(s.x, s.y - 1.7, 'FROZEN', '#bfe9ff'); tone(1900, 700, 0.3, 'triangle', 0.07);
        break;
      case 'bossdown':
        burst(e.x, e.y, app.g.boss.type === 'frost' ? '#a8e0ff' : SUN, 40, 14, 0.34); burst(e.x, e.y, '#ffffff', 20, 10, 0.26); burst(e.x, e.y, app.g.boss.type === 'frost' ? '#4aa3d8' : '#3b4046', 16, 8, 0.3);
        rings.push({ x: e.x, y: e.y, r: 4.5, life: 0, max: 0.5 }); flashes.push({ x: e.x, y: e.y, r: 4.5, life: 0, max: 0.4 });
        noise(0.5, 0.26, 800); tone(160, 40, 0.5, 'sine', 0.2); jolt(0.6);
        break;
      case 'finish':
        burst(s.x, s.y, hue(s.col), 30, 10, 0.3); burst(s.x, s.y, PAPER, 16, 7, 0.22);
        break;
    }
  }
  ev.length = 0;
}
export function updateFx(dt) {
  var i, q;
  for (i = parts.length - 1; i >= 0; i--) {
    q = parts[i]; q.life += dt;
    if (q.life >= q.max) { parts.splice(i, 1); continue; }
    q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - 3.2 * dt; q.vy *= 1 - 3.2 * dt;
  }
  for (i = pops.length - 1; i >= 0; i--) { q = pops[i]; q.life += dt; q.y -= 1.3 * dt; if (q.life >= q.max) pops.splice(i, 1); }
  for (i = rings.length - 1; i >= 0; i--) { q = rings[i]; q.life += dt; if (q.life >= q.max) rings.splice(i, 1); }
  for (i = ghosts.length - 1; i >= 0; i--) { q = ghosts[i]; q.life += dt; if (q.life >= q.max) ghosts.splice(i, 1); }
  for (i = bolts.length - 1; i >= 0; i--) { q = bolts[i]; q.life += dt; if (q.life >= q.max) bolts.splice(i, 1); }
  for (i = flashes.length - 1; i >= 0; i--) { q = flashes[i]; q.life += dt; if (q.life >= q.max) flashes.splice(i, 1); }
  shake = Math.max(0, shake - dt * 1.6);
}
