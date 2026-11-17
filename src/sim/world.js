import { BLAST, EPS, HALF, INV_TIME, JIT, SHIELD_INV, STUN_TIME } from './constants.js';
import { warp } from './goodies.js';

export function tileAt(g, cx, cy) {
  return (cx < 0 || cy < 0 || cx >= g.W || cy >= g.H) ? '#' : g.grid[cy][cx];
}

/* AI squares travel on diagonals: keep the signs, re-roll the angle a hair so they never lock into a loop */
export function rejit(g, s) {
  var th = Math.PI / 4 + (g.rnd() * 2 - 1) * JIT;
  s.ux = (s.ux < 0 ? -1 : 1) * Math.cos(th);
  s.uy = (s.uy < 0 ? -1 : 1) * Math.sin(th);
}

export function blocks(t, axis, d, px, py, cx, cy) {
  switch (t) {
    case '#': case 'A': case 'V': case '<': case '>': case 'C': case 'T': return true;
    case 'd': return axis === 1 && d < 0 && (py - HALF) >= cy + 1 - 0.06;
    case 'u': return axis === 1 && d > 0 && (py + HALF) <= cy + 0.06;
    case 'r': return axis === 0 && d < 0 && (px - HALF) >= cx + 1 - 0.06;
    case 'l': return axis === 0 && d > 0 && (px + HALF) <= cx + 0.06;
  }
  return false;
}

/* move one axis, clamp against tiles. Returns true when blocked. dry = no tile effects. */
export function moveAxis(g, s, axis, d, dry) {
  if (d === 0) return false;
  var px = s.x, py = s.y;
  if (axis === 0) s.x += d; else s.y += d;
  var x0 = Math.floor(s.x - HALF + EPS), x1 = Math.floor(s.x + HALF - EPS);
  var y0 = Math.floor(s.y - HALF + EPS), y1 = Math.floor(s.y + HALF - EPS);
  var hits = null, lo = 1e9, hi = -1e9;
  for (var cy = y0; cy <= y1; cy++) for (var cx = x0; cx <= x1; cx++) {
    var t = tileAt(g, cx, cy);
    if (t === ' ' || t === 'F' || t === '+') continue;
    if (blocks(t, axis, d, px, py, cx, cy)) {
      (hits || (hits = [])).push(cx, cy);
      var k = axis === 0 ? cx : cy;
      if (k < lo) lo = k; if (k > hi) hi = k;
    }
  }
  if (!hits) return false;
  if (axis === 0) s.x = d > 0 ? lo - HALF : hi + 1 + HALF;
  else s.y = d > 0 ? lo - HALF : hi + 1 + HALF;
  if (!dry) {
    for (var i = 0; i < hits.length; i += 2) {
      var hx = hits[i], hy = hits[i + 1], ht = tileAt(g, hx, hy);
      if (ht === 'A' || ht === 'V' || ht === '<' || ht === '>') hurt(g, s, 'spike');
      else if (ht === 'C') breakCrate(g, hx, hy);
      else if (ht === 'T') explode(g, hx, hy);
    }
  }
  return true;
}

export function hurt(g, s, src) {
  if (s.dead || s.inv > 0 || g.over) return false;
  /* gun rounds: bullets are the only thing that hurts */
  if (g.level.gun && src !== 'bullet') return false;
  if (s.shield) { popShield(g, s); return false; }
  /* races are about time: a hazard stuns. battles are about lives: a hazard takes one. */
  if (g.mode === 'race') {
    s.stun = STUN_TIME; s.inv = STUN_TIME + 0.6;
    g.events.push({ type: 'stun', s: s, src: src });
    return true;
  }
  /* in battles rivals are armoured against spikes and saws until the player staggers them */
  if (!s.isPlayer && s.stag <= 0 && (src === 'spike' || src === 'saw')) {
    if (s.tink <= 0) { s.tink = 0.3; g.events.push({ type: 'tink', s: s }); }
    return false;
  }
  s.hp -= 1; s.inv = INV_TIME;
  g.events.push({ type: 'hurt', s: s, src: src });
  if (s.hp <= 0) { s.dead = true; g.events.push({ type: 'death', s: s }); }
  return true;
}

export function knock(g, s, fx, fy) {
  var dx = s.x - fx, dy = s.y - fy, m = Math.hypot(dx, dy);
  if (m < 0.01) return;
  if (s.isPlayer) { s.ux = dx / m; s.uy = dy / m; }
  else {
    if (Math.abs(dx) > 0.2) s.ux = dx > 0 ? 1 : -1;
    if (Math.abs(dy) > 0.2) s.uy = dy > 0 ? 1 : -1;
    rejit(g, s);
  }
}

export function breakCrate(g, cx, cy) {
  if (g.grid[cy][cx] !== 'C') return;
  g.grid[cy][cx] = ' ';
  g.events.push({ type: 'crate', x: cx + 0.5, y: cy + 0.5 });
}

export function explode(g, cx, cy) {
  if (g.grid[cy][cx] !== 'T') return;
  g.grid[cy][cx] = ' ';
  var ex = cx + 0.5, ey = cy + 0.5, R = BLAST, n = Math.ceil(R);
  g.events.push({ type: 'explode', x: ex, y: ey, r: R });
  for (var y = cy - n; y <= cy + n; y++) for (var x = cx - n; x <= cx + n; x++) {
    if (x < 0 || y < 0 || x >= g.W || y >= g.H) continue;
    if (Math.hypot(x - cx, y - cy) > R) continue;
    var t = g.grid[y][x];
    if (t === 'C') breakCrate(g, x, y);
    else if (t === 'T') g.fuses.push({ x: x, y: y, t: 0.14 });
  }
  for (var i = 0; i < g.squares.length; i++) {
    var s = g.squares[i];
    if (s.dead) continue;
    if (Math.hypot(s.x - ex, s.y - ey) < R + 0.3) { if (hurt(g, s, 'tnt') && g.mode === 'battle') knock(g, s, ex, ey); }
  }
}

export function placeSaws(g, dt) {
  for (var i = 0; i < g.saws.length; i++) {
    var w = g.saws[i];
    w.p += w.sgn * w.speed * dt;
    if (w.p > w.len) { w.p = 2 * w.len - w.p; w.sgn = -1; }
    else if (w.p < 0) { w.p = -w.p; w.sgn = 1; }
    var k = w.len > 0 ? w.p / w.len : 0;
    w.x = w.x1 + (w.x2 - w.x1) * k; w.y = w.y1 + (w.y2 - w.y1) * k;
    w.rot += dt * 9;
  }
}

/* a bubble shield takes the hit instead of the square, then leaves a moment of safety */
export function popShield(g, s) {
  s.shield = false; s.inv = SHIELD_INV; s.safe = SHIELD_INV;
  g.events.push({ type: 'saved', s: s });
}

/* dotted preview of where the player is headed */
export function predictPath(g, s, dist, out) {
  var gh = { x: s.x, y: s.y, ux: s.ux, uy: s.uy, warp: s.warp, ghost: true }, step = 0.12, n = Math.round(dist / step), b = g.boss;
  out.length = 0;
  for (var i = 1; i <= n; i++) {
    var dx = gh.ux * step, dy = gh.uy * step;
    if (moveAxis(g, gh, 0, dx, true)) gh.ux = -gh.ux;
    if (moveAxis(g, gh, 1, dy, true)) gh.uy = -gh.uy;
    if (b && b.type !== 'cop') {
      var ox = b.half + HALF - Math.abs(gh.x - b.x), oy = b.half + HALF - Math.abs(gh.y - b.y);
      if (ox > 0 && oy > 0) {
        if (ox < oy) { gh.ux = (gh.x >= b.x ? 1 : -1) * Math.abs(gh.ux); gh.x += (gh.x >= b.x ? 1 : -1) * ox; }
        else { gh.uy = (gh.y >= b.y ? 1 : -1) * Math.abs(gh.uy); gh.y += (gh.y >= b.y ? 1 : -1) * oy; }
      }
    }
    if (g.portals.length) warp(g, gh);
    if (i % 5 === 0) out.push(gh.x, gh.y);
  }
  return out;
}
