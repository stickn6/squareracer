import { DUEL_GAP, DUEL_INV, DUEL_SPARKS, DUEL_SPEED, FROST_FAN, HALF, ICE_SPEED, ICE_TELL, WAVE_STEP, WAVE_TELL } from './constants.js';
import { hurt, tileAt } from './world.js';

/* ----- the duel ----- */
export function spotMid(sp) { return sp.length >= 4 ? [(sp[0] + sp[2]) / 2, (sp[1] + sp[3]) / 2] : sp; }
export function pickByHp(arr, hp) { return arr[Math.max(0, Math.min(arr.length - 1, hp - 1))]; }
export function burnBoss(g, b, p) {
  b.hp -= 1;
  g.events.push({ type: 'bosshit', x: b.x, y: b.y, hp: b.hp });
  g.sparks.length = 0; g.shards.length = 0;
  if (b.hp <= 0) { g.over = { win: true, reason: 'bossdown' }; g.events.push({ type: 'bossdown', x: b.x, y: b.y }); return; }
  /* he jumps to the spot furthest from the player and needs a moment before he can be burned again */
  var best = null, bd = -1, next = null, i, m;
  for (i = 0; i < b.spots.length; i++) {
    m = spotMid(b.spots[i]); var d = Math.hypot(m[0] - p.x, m[1] - p.y);
    if (d > bd) { next = best; bd = d; best = b.spots[i]; }
  }
  /* now and then he picks the second-furthest spot instead, so no two fights go the same way */
  if (next) { m = spotMid(next); if (Math.hypot(m[0] - p.x, m[1] - p.y) > 9 && g.rnd() < 0.4) best = next; }
  var nx = best[0], ny = best[1];
  if (best.length >= 4) {
    /* a spot can be a track he skates along: he lands on the end further from the player */
    var far1 = Math.hypot(best[0] - p.x, best[1] - p.y) >= Math.hypot(best[2] - p.x, best[3] - p.y);
    b.px1 = best[0]; b.py1 = best[1]; b.px2 = best[2]; b.py2 = best[3]; b.plen = Math.hypot(best[2] - best[0], best[3] - best[1]);
    b.pp = far1 ? 0 : b.plen; b.dir = far1 ? 1 : -1;
    if (!far1) { nx = best[2]; ny = best[3]; }
  } else { b.px1 = b.px2 = nx; b.py1 = b.py2 = ny; b.plen = 0; b.pp = 0; }
  g.events.push({ type: 'blink', x1: b.x, y1: b.y, x2: nx, y2: ny, how: b.type });
  b.x = nx; b.y = ny; b.inv = DUEL_INV; b.t = 0; b.lock = false; b.tell = 0;
  /* Frost throws soon after he reappears: reaim is how long that takes at each hp */
  if (b.reaim) b.t = Math.max(0, pickByHp(b.gaps, b.hp) - pickByHp(b.reaim, b.hp));
}
export function stepIceDuel(g, b, dt) {
  var p = g.squares[0], gap = pickByHp(b.gaps, b.hp), n = pickByHp(b.fans, b.hp);
  if (b.inv > 0) b.inv = Math.max(0, b.inv - dt);
  b.t += dt; b.fanN = n;
  if (!b.lock) {
    b.aim = Math.atan2(p.y - b.y, p.x - b.x);
    if (b.t >= gap - ICE_TELL) b.lock = true;
  }
  b.tell = b.lock ? Math.min(1, (b.t - (gap - ICE_TELL)) / ICE_TELL) : 0;
  if (b.lock && b.t >= gap) {
    for (var i = 0; i < n; i++) {
      var a = b.aim + (i - (n - 1) / 2) * FROST_FAN;
      g.shards.push({ x: b.x + Math.cos(a) * 0.9, y: b.y + Math.sin(a) * 0.9, vx: Math.cos(a) * ICE_SPEED, vy: Math.sin(a) * ICE_SPEED, life: 5 });
    }
    g.events.push({ type: 'throw', x: b.x, y: b.y });
    b.t = 0; b.lock = false; b.tell = 0;
  }
}
export function stepDuel(g, b, dt) {
  if (b.type === 'frost') { stepIceDuel(g, b, dt); return; }
  var p = g.squares[0], k = Math.max(0, Math.min(2, b.hp - 1)), gap = DUEL_GAP[k];
  if (b.inv > 0) b.inv = Math.max(0, b.inv - dt);
  b.t += dt;
  if (!b.lock) {
    b.aim = Math.atan2(p.y - b.y, p.x - b.x);
    if (b.t >= gap - WAVE_TELL) b.lock = true;
  }
  b.tell = b.lock ? Math.min(1, (b.t - (gap - WAVE_TELL)) / WAVE_TELL) : 0;
  if (b.lock && b.t >= gap) {
    var dx = Math.cos(b.aim), dy = Math.sin(b.aim), n = DUEL_SPARKS[k], half = (n - 1) / 2, id = ++g.waveId;
    for (var i = 0; i < n; i++) {
      var o = (i - half) * WAVE_STEP, back = Math.abs(i - half) * 0.16;
      g.sparks.push({ x: b.x + dx * (1.1 - back) - dy * o, y: b.y + dy * (1.1 - back) + dx * o, vx: dx * DUEL_SPEED[k], vy: dy * DUEL_SPEED[k], w: id, life: 6 });
    }
    g.events.push({ type: 'wave', x: b.x, y: b.y });
    b.t = 0; b.lock = false; b.tell = 0;
  }
}
export function stepSparks(g, dt) {
  var p = g.squares[0];
  for (var i = g.sparks.length - 1; i >= 0; i--) {
    var q = g.sparks[i];
    q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
    var t = tileAt(g, Math.floor(q.x), Math.floor(q.y)), gone = q.life <= 0;
    if (t === '#' || t === 'C' || t === 'T') { gone = true; g.events.push({ type: 'fizz', x: q.x, y: q.y }); }
    else if (!g.over && !p.dead && Math.abs(q.x - p.x) < HALF + 0.2 && Math.abs(q.y - p.y) < HALF + 0.2) { gone = true; hurt(g, p, 'wave'); }
    if (gone) g.sparks.splice(i, 1);
  }
}
