import { COP_CHASE, COP_REST, COP_WIND, DUEL_SPARKS, FROST_FAN, HALF, SQ, WAVE_STEP } from '../../sim/constants.js';
import { tileAt } from '../../sim/world.js';
import { calm } from '../env.js';
import { bolts, flashes, ghosts } from '../fx.js';
import { app } from '../state.js';
import { INK, SUN } from '../theme.js';
import { ctx } from './canvas.js';
import { drawFace, iceBlock } from './squares.js';

/* ----- bosses ----- */
export function rayLen(x, y, a, max) {
  var dx = Math.cos(a) * 0.25, dy = Math.sin(a) * 0.25, n = Math.round(max / 0.25);
  for (var i = 1; i <= n; i++) { var t = tileAt(app.g, Math.floor(x + dx * i), Math.floor(y + dy * i)); if (t === '#' || t === 'C' || t === 'T') return i * 0.25; }
  return max;
}
/* what sits on the floor under the squares: Volt's ring, Frost's aim lines, Sarge's room and torch beam */
export function drawBossUnder(now) {
  var b = app.g.boss, z = b.zone, i;
  if (b.duel && b.type === 'frost') {
    /* the track he skates along, and one red line per shard he is about to throw */
    if (b.plen > 0 && b.hp > 0) {
      ctx.strokeStyle = 'rgba(74,163,216,.45)'; ctx.lineWidth = 0.12; ctx.lineCap = 'round'; ctx.setLineDash([0.2, 0.5]);
      ctx.beginPath(); ctx.moveTo(b.px1, b.py1); ctx.lineTo(b.px2, b.py2); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
    }
    if (b.tell > 0 && b.hp > 0 && !app.g.over) {
      ctx.lineWidth = 0.2; ctx.setLineDash([0.4, 0.3]);
      ctx.strokeStyle = 'rgba(232,55,47,' + (0.35 + 0.55 * b.tell).toFixed(2) + ')';
      for (i = 0; i < b.fanN; i++) {
        var fa = b.aim + (i - (b.fanN - 1) / 2) * FROST_FAN, fl = rayLen(b.x, b.y, fa, 30);
        ctx.beginPath(); ctx.moveTo(b.x + Math.cos(fa) * 1.2, b.y + Math.sin(fa) * 1.2); ctx.lineTo(b.x + Math.cos(fa) * fl, b.y + Math.sin(fa) * fl); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    return;
  }
  if (b.duel) {
    /* the strip his next wave will sweep */
    if (b.tell > 0 && b.hp > 0 && !app.g.over) {
      /* one lane per spark, each as long as that spark will fly, so cover behind a pillar shows up as cover */
      var n = DUEL_SPARKS[Math.max(0, Math.min(2, b.hp - 1))], half = (n - 1) / 2, dx = Math.cos(b.aim), dy = Math.sin(b.aim), o, len;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.aim);
      ctx.beginPath(); ctx.moveTo(1.2, -half * WAVE_STEP - 0.3);
      for (i = 0; i < n; i++) {
        o = (i - half) * WAVE_STEP; len = Math.max(1.4, 1.1 + rayLen(b.x + dx * 1.1 - dy * o, b.y + dy * 1.1 + dx * o, b.aim, 30));
        ctx.lineTo(len, o - 0.3); ctx.lineTo(len, o + 0.3);
      }
      ctx.lineTo(1.2, half * WAVE_STEP + 0.3); ctx.closePath();
      ctx.fillStyle = 'rgba(232,55,47,' + (0.1 + 0.2 * b.tell).toFixed(2) + ')'; ctx.fill();
      ctx.strokeStyle = 'rgba(232,55,47,' + (0.4 + 0.5 * b.tell).toFixed(2) + ')'; ctx.lineWidth = 0.12; ctx.lineJoin = 'round'; ctx.setLineDash([0.4, 0.3]);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    return;
  }
  if (b.type === 'volt') {
    var VOLT_R = b.R;
    var ch = b.charge, hot = ch > 0, blink = hot && ch > 0.6 && !calm() && Math.floor(now / 70) % 2 === 0;
    ctx.beginPath(); ctx.arc(b.x, b.y, VOLT_R, 0, 6.283);
    ctx.fillStyle = 'rgba(255,212,58,' + (hot ? 0.2 : 0.1) + ')'; ctx.fill();
    if (hot) {
      ctx.beginPath(); ctx.arc(b.x, b.y, VOLT_R * ch, 0, 6.283);
      ctx.fillStyle = blink ? 'rgba(255,255,255,.55)' : 'rgba(255,225,70,' + (0.3 + 0.35 * ch).toFixed(2) + ')'; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(b.x, b.y, VOLT_R, 0, 6.283);
    ctx.strokeStyle = hot ? '#e8372f' : '#a97800'; ctx.lineWidth = hot ? 0.16 : 0.1;
    ctx.setLineDash([0.45, 0.3]); ctx.lineDashOffset = calm() ? 0 : -now / 90; ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
    return;
  }
  /* the boss's room, with a line where the safe strip begins */
  var tx, ty, seg = 0.5, n = Math.round((z[2] - z[0]) / seg);
  ctx.fillStyle = b.type === 'frost' ? 'rgba(190,232,255,.3)' : 'rgba(60,90,200,.1)';
  for (ty = z[1]; ty < z[3]; ty++) for (tx = z[0]; tx < z[2]; tx++) if (app.g.grid[ty][tx] !== '#') ctx.fillRect(tx, ty, 1, 1);
  for (i = 0; i < n; i++) {
    if (app.g.grid[z[3] - 1][Math.floor(z[0] + i * seg)] === '#') continue;
    ctx.fillStyle = b.type === 'frost' ? (i % 2 ? '#ffffff' : '#4aa3d8') : (i % 2 ? INK : SUN);
    ctx.fillRect(z[0] + i * seg, z[3] - 0.07, seg, 0.14);
  }
  if (b.type === 'frost') {
    if (b.tell > 0) {
      ctx.lineWidth = 0.18; ctx.setLineDash([0.4, 0.3]);
      for (i = -1; i <= 1; i++) {
        var a = b.aim + i * FROST_FAN, len = rayLen(b.x, b.y, a, 16);
        ctx.strokeStyle = 'rgba(232,55,47,' + (0.35 + 0.55 * b.tell).toFixed(2) + ')';
        ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * 1.2, b.y + Math.sin(a) * 1.2); ctx.lineTo(b.x + Math.cos(a) * len, b.y + Math.sin(a) * len); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  } else if (b.phase === 'chase' && b.run >= COP_WIND) {
    var a0 = b.aim, L2 = 4.6;
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(a0 - 0.36) * L2, b.y + Math.sin(a0 - 0.36) * L2);
    ctx.lineTo(b.x + Math.cos(a0 + 0.36) * L2, b.y + Math.sin(a0 + 0.36) * L2); ctx.closePath();
    ctx.fillStyle = 'rgba(255,240,150,.38)'; ctx.fill();
  }
}

/* how many burns a duel boss can still take */
export function bossPips(b, x, top, fill) {
  var pw = 0.42, gap = 0.16, tot = b.maxHp * pw + (b.maxHp - 1) * gap, py = Math.max(1.14, top);
  for (var i = 0; i < b.maxHp; i++) {
    ctx.fillStyle = i < b.hp ? fill : 'rgba(255,251,227,.55)'; ctx.fillRect(x - tot / 2 + i * (pw + gap), py, pw, pw);
    ctx.strokeStyle = INK; ctx.lineWidth = 0.08; ctx.strokeRect(x - tot / 2 + i * (pw + gap), py, pw, pw);
  }
}
export function drawGhosts(now) {
  for (var i = 0; i < ghosts.length; i++) {
    var q = ghosts[i], left = q.max - q.life, x = q.x, y = q.y, k;
    ctx.globalAlpha = Math.min(1, left * 2.5);
    if (q.how === 'volt') {
      var flick = Math.floor(now / 60) % 2 === 0;
      ctx.fillStyle = flick ? '#2a2f36' : '#ffffff'; ctx.fillRect(x - HALF, y - HALF, SQ, SQ);
      ctx.strokeStyle = SUN; ctx.lineWidth = 0.12; ctx.strokeRect(x - HALF + 0.05, y - HALF + 0.05, SQ - 0.1, SQ - 0.1);
      ctx.fillStyle = flick ? '#ffffff' : '#2a2f36';
      ctx.fillRect(x - 0.42, y - 0.3, 0.3, 0.3); ctx.fillRect(x + 0.12, y - 0.3, 0.3, 0.3); ctx.fillRect(x - 0.3, y + 0.22, 0.6, 0.14);
    } else {
      drawFace(ctx, q.col, x, y, now, { ux: q.ux, uy: q.uy });
      if (q.how === 'frost') iceBlock(x, y);
      else {
        ctx.strokeStyle = INK; ctx.lineWidth = 0.12; ctx.strokeRect(x - HALF - 0.14, y - HALF - 0.14, SQ + 0.28, SQ + 0.28);
        ctx.fillStyle = '#3d4650';
        for (k = 0; k < 4; k++) ctx.fillRect(x - HALF + 0.08 + k * 0.345, y - HALF - 0.14, 0.13, SQ + 0.28);
      }
    }
  }
  ctx.globalAlpha = 1;
}
export function bossEyes(x, y, lx, ly, white, pupil, shut) {
  var ex = 0.56, ey = -0.3, es = 0.58, ps = 0.3;
  if (shut) { ctx.fillStyle = pupil; ctx.fillRect(x - ex - es / 2, y + ey - 0.07, es, 0.14); ctx.fillRect(x + ex - es / 2, y + ey - 0.07, es, 0.14); return; }
  ctx.fillStyle = white; ctx.fillRect(x - ex - es / 2, y + ey - es / 2, es, es); ctx.fillRect(x + ex - es / 2, y + ey - es / 2, es, es);
  ctx.fillStyle = pupil;
  ctx.fillRect(x - ex - ps / 2 + lx * 0.12, y + ey - ps / 2 + ly * 0.12, ps, ps); ctx.fillRect(x + ex - ps / 2 + lx * 0.12, y + ey - ps / 2 + ly * 0.12, ps, ps);
}
export function tri3(ax, ay, bx, by, cx, cy, fill, edge) {
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); if (edge) ctx.stroke();
}
export function drawBoss(now) {
  var b = app.g.boss, h = b.half, S2 = h * 2, bob = calm() ? 0 : Math.sin(now / 320) * 0.05;
  var x = b.x, y = b.y + (b.type === 'cop' ? 0 : bob), L = x - h, T = y - h, i;
  var lx = Math.cos(b.aim), ly = Math.sin(b.aim);
  ctx.lineJoin = 'miter'; ctx.strokeStyle = INK;
  if (b.type === 'volt') {
    var near = null, nd = 1e9;
    for (i = 0; i < app.g.squares.length; i++) { var s = app.g.squares[i]; if (s.dead) continue; var d = Math.hypot(s.x - x, s.y - y); if (d < nd) { nd = d; near = s; } }
    if (near) { lx = (near.x - x) / (nd || 1); ly = (near.y - y) / (nd || 1); }
    var hot = b.duel ? b.tell > 0 : b.charge > 0, flick = hot && !calm() && Math.floor(now / 70) % 2 === 0;
    if (b.duel && b.inv > 0 && Math.floor(now / 80) % 2 === 0) ctx.globalAlpha = 0.45;
    /* two prongs with a spark jumping between them */
    ctx.lineWidth = 0.08;
    ctx.fillStyle = '#3b4046'; ctx.fillRect(x - 0.78, T - 0.42, 0.2, 0.46); ctx.strokeRect(x - 0.78, T - 0.42, 0.2, 0.46); ctx.fillRect(x + 0.58, T - 0.42, 0.2, 0.46); ctx.strokeRect(x + 0.58, T - 0.42, 0.2, 0.46);
    ctx.fillStyle = hot ? '#ffffff' : SUN; ctx.fillRect(x - 0.84, T - 0.62, 0.32, 0.26); ctx.strokeRect(x - 0.84, T - 0.62, 0.32, 0.26); ctx.fillRect(x + 0.52, T - 0.62, 0.32, 0.26); ctx.strokeRect(x + 0.52, T - 0.62, 0.32, 0.26);
    if (hot && !calm()) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.09; ctx.beginPath(); ctx.moveTo(x - 0.52, T - 0.5);
      for (i = 1; i < 5; i++) ctx.lineTo(x - 0.52 + i * 0.21, T - 0.5 + (Math.random() - 0.5) * 0.4);
      ctx.lineTo(x + 0.52, T - 0.5); ctx.stroke(); ctx.strokeStyle = INK;
    }
    ctx.fillStyle = flick ? '#fff6b8' : '#ffd43a'; ctx.fillRect(L, T, S2, S2);
    ctx.fillStyle = flick ? '#ffe680' : '#f0b400'; ctx.fillRect(L, y + h - 0.5, S2, 0.5);
    ctx.lineWidth = 0.14; ctx.strokeRect(L + 0.07, T + 0.07, S2 - 0.14, S2 - 0.14);
    /* bolt on the belly */
    ctx.beginPath(); ctx.moveTo(x + 0.22, y + 0.12); ctx.lineTo(x - 0.34, y + 0.66); ctx.lineTo(x - 0.02, y + 0.66); ctx.lineTo(x - 0.2, y + 1.08);
    ctx.lineTo(x + 0.4, y + 0.5); ctx.lineTo(x + 0.06, y + 0.5); ctx.lineTo(x + 0.34, y + 0.12); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
    bossEyes(x, y, lx, ly, '#ffffff', hot ? '#e8372f' : '#111', false);
    tri3(x - 0.9, y - 0.78, x - 0.22, y - 0.56, x - 0.9, y - 0.56, INK); tri3(x + 0.9, y - 0.78, x + 0.22, y - 0.56, x + 0.9, y - 0.56, INK);
    ctx.globalAlpha = 1;
    if (b.duel) bossPips(b, x, T - 1.3, '#ffd43a');
  } else if (b.type === 'frost') {
    if (b.duel && b.inv > 0 && Math.floor(now / 80) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#a8e0ff'; ctx.fillRect(L, T, S2, S2);
    ctx.fillStyle = '#7cc7f2'; ctx.fillRect(L, y + h - 0.5, S2, 0.5);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(L + 0.2, T + 0.62, 0.14, 1.2); ctx.fillRect(L + 0.42, T + 0.62, 0.08, 0.7);
    ctx.lineWidth = 0.14; ctx.strokeRect(L + 0.07, T + 0.07, S2 - 0.14, S2 - 0.14);
    /* snow cap with icicles */
    ctx.lineWidth = 0.08;
    for (i = 0; i < 4; i++) tri3(L + 0.14 + i * 0.62, T + 0.3, L + 0.56 + i * 0.62, T + 0.3, L + 0.35 + i * 0.62, T + 0.3 + (i % 2 ? 0.5 : 0.34), '#ffffff', true);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(L - 0.1, T - 0.14, S2 + 0.2, 0.46); ctx.strokeRect(L - 0.1, T - 0.14, S2 + 0.2, 0.46);
    bossEyes(x, y + 0.12, lx, ly, '#ffffff', '#1b3a66', false);
    /* mouth: puffs up while taking aim */
    ctx.fillStyle = '#1b3a66';
    if (b.tell > 0) { ctx.fillRect(x - 0.2, y + 0.5, 0.4, 0.4); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 0.1, y + 0.6, 0.2, 0.2); }
    else ctx.fillRect(x - 0.3, y + 0.62, 0.6, 0.12);
    ctx.globalAlpha = 1;
    if (b.duel) bossPips(b, x, T - 0.86, '#6cc4f5');
  } else {
    var rest = b.phase === 'rest', chase = b.phase === 'chase' && b.run >= COP_WIND, warm = b.phase === 'chase' && !chase, puff = rest && !calm() ? Math.sin(now / 130) * 0.05 : 0;
    ctx.fillStyle = '#2f4a9e'; ctx.fillRect(L - puff, T - puff, S2 + puff * 2, S2 + puff * 2);
    ctx.fillStyle = '#263c82'; ctx.fillRect(L - puff, y + h - 0.5, S2 + puff * 2, 0.5 + puff);
    ctx.lineWidth = 0.14; ctx.strokeRect(L + 0.07 - puff, T + 0.07 - puff, S2 - 0.14 + puff * 2, S2 - 0.14 + puff * 2);
    /* cap, badge and the light on top */
    ctx.lineWidth = 0.08;
    var lamp = chase ? (Math.floor(now / 140) % 2 ? '#e8372f' : '#3aa0ff') : warm ? '#ffb020' : rest ? '#56606c' : '#9b2f2a';
    if (chase && !calm()) { ctx.beginPath(); ctx.arc(x, T - 0.86, 0.5, 0, 6.283); ctx.fillStyle = Math.floor(now / 140) % 2 ? 'rgba(232,55,47,.35)' : 'rgba(58,160,255,.35)'; ctx.fill(); }
    ctx.fillStyle = lamp; ctx.fillRect(x - 0.24, T - 1.0, 0.48, 0.34); ctx.strokeRect(x - 0.24, T - 1.0, 0.48, 0.34);
    ctx.fillStyle = '#16224d'; ctx.fillRect(L + 0.2, T - 0.68, S2 - 0.4, 0.7); ctx.strokeRect(L + 0.2, T - 0.68, S2 - 0.4, 0.7);
    ctx.fillStyle = '#0e1733'; ctx.fillRect(L - 0.14, T - 0.06, S2 + 0.28, 0.26); ctx.strokeRect(L - 0.14, T - 0.06, S2 + 0.28, 0.26);
    ctx.fillStyle = SUN; ctx.fillRect(x - 0.18, T - 0.52, 0.36, 0.36); ctx.strokeRect(x - 0.18, T - 0.52, 0.36, 0.36);
    bossEyes(x, y + 0.14, lx, ly, '#ffffff', '#111', rest);
    if (!rest) { ctx.fillStyle = INK; ctx.fillRect(x - 0.92, y - 0.6, 0.72, 0.16); ctx.fillRect(x + 0.2, y - 0.6, 0.72, 0.16); }
    /* moustache and chest badge */
    tri3(x - 0.04, y + 0.36, x - 0.74, y + 0.36, x - 0.6, y + 0.68, INK); tri3(x + 0.04, y + 0.36, x + 0.74, y + 0.36, x + 0.6, y + 0.68, INK);
    ctx.lineWidth = 0.06;
    ctx.beginPath(); ctx.moveTo(L + 0.5, y + 0.66); ctx.lineTo(L + 0.72, y + 0.88); ctx.lineTo(L + 0.5, y + 1.1); ctx.lineTo(L + 0.28, y + 0.88); ctx.closePath(); ctx.fillStyle = SUN; ctx.fill(); ctx.stroke();
    if (rest && !calm()) {
      ctx.fillStyle = '#9be9ff';
      var dy2 = (now / 500) % 1;
      ctx.fillRect(L - 0.36, T + 0.3 + dy2 * 0.7, 0.18, 0.26); ctx.fillRect(x + h + 0.2, T + 0.6 + ((dy2 + 0.5) % 1) * 0.7, 0.18, 0.26);
    }
    /* breath bar: red while he has puff left, green while he gets it back */
    var frac = rest ? 1 - Math.max(0, b.t) / COP_REST : Math.max(0, b.stam) / COP_CHASE, bw = 2.0;
    ctx.fillStyle = 'rgba(255,251,227,.85)'; ctx.fillRect(x - bw / 2, T - 1.42, bw, 0.24);
    ctx.fillStyle = rest ? '#2fc33a' : '#e8372f'; ctx.fillRect(x - bw / 2, T - 1.42, bw * frac, 0.24);
    ctx.lineWidth = 0.06; ctx.strokeRect(x - bw / 2, T - 1.42, bw, 0.24);
  }
}
export function drawShards() {
  for (var i = 0; i < app.g.shards.length; i++) {
    var q = app.g.shards[i], m = Math.hypot(q.vx, q.vy) || 1, ux = q.vx / m, uy = q.vy / m, px = -uy, py = ux;
    ctx.beginPath(); ctx.moveTo(q.x + ux * 0.5, q.y + uy * 0.5); ctx.lineTo(q.x + px * 0.24, q.y + py * 0.24);
    ctx.lineTo(q.x - ux * 0.5, q.y - uy * 0.5); ctx.lineTo(q.x - px * 0.24, q.y - py * 0.24); ctx.closePath();
    ctx.fillStyle = '#e4f7ff'; ctx.fill(); ctx.strokeStyle = '#1f6fb0'; ctx.lineWidth = 0.1; ctx.lineJoin = 'round'; ctx.stroke();
  }
}
/* Volt's waves in the duel: a crackling arc strung between a row of sparks */
export function drawSparks(now) {
  var S = app.g.sparks, i, q, r, pass;
  if (!S.length) return;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (pass = 0; pass < 3; pass++) {
    ctx.strokeStyle = pass === 0 ? 'rgba(255,212,58,.38)' : pass === 1 ? INK : '#fff7b0';
    ctx.lineWidth = pass === 0 ? 0.95 : pass === 1 ? 0.36 : 0.19;
    for (i = 0; i + 1 < S.length; i++) {
      q = S[i]; r = S[i + 1];
      if (q.w !== r.w || Math.hypot(r.x - q.x, r.y - q.y) > WAVE_STEP * 1.6) continue;
      var m = Math.hypot(q.vx, q.vy) || 1, nx = q.vx / m, ny = q.vy / m;
      var j = pass === 0 ? 0 : calm() ? (i % 2 ? 0.14 : -0.14) : Math.sin(now / 37 + i * 2.4 + q.w) * 0.22;
      ctx.beginPath(); ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x + (r.x - q.x) * 0.35 + nx * j, q.y + (r.y - q.y) * 0.35 + ny * j);
      ctx.lineTo(q.x + (r.x - q.x) * 0.7 - nx * j, q.y + (r.y - q.y) * 0.7 - ny * j);
      ctx.lineTo(r.x, r.y); ctx.stroke();
    }
  }
  ctx.lineCap = 'butt';
  for (i = 0; i < S.length; i++) {
    q = S[i];
    var k = calm() ? 0.22 : 0.19 + 0.06 * Math.sin(now / 40 + i);
    ctx.fillStyle = 'rgba(255,212,58,.38)'; ctx.fillRect(q.x - 0.46, q.y - 0.46, 0.92, 0.92);
    ctx.fillStyle = INK; ctx.fillRect(q.x - k - 0.07, q.y - k - 0.07, (k + 0.07) * 2, (k + 0.07) * 2);
    ctx.fillStyle = Math.floor(now / 60 + i) % 2 ? '#ffffff' : '#ffd43a'; ctx.fillRect(q.x - k, q.y - k, k * 2, k * 2);
  }
}
export function drawBossFx() {
  var i, q, k;
  for (i = 0; i < flashes.length; i++) {
    q = flashes[i]; k = q.life / q.max;
    ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fillStyle = 'rgba(255,255,220,' + (0.75 * (1 - k)).toFixed(2) + ')'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,212,58,' + (1 - k).toFixed(2) + ')'; ctx.lineWidth = 0.3 * (1 - k) + 0.05; ctx.stroke();
  }
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (i = 0; i < bolts.length; i++) {
    q = bolts[i];
    var dx = q.x2 - q.x1, dy = q.y2 - q.y1, m = Math.hypot(dx, dy) || 1, nx = -dy / m, ny = dx / m;
    ctx.beginPath(); ctx.moveTo(q.x1, q.y1);
    for (k = 1; k < 6; k++) { var j = calm() ? (k % 2 ? 0.25 : -0.25) : (Math.random() - 0.5) * 0.9; ctx.lineTo(q.x1 + dx * k / 6 + nx * j, q.y1 + dy * k / 6 + ny * j); }
    ctx.lineTo(q.x2, q.y2);
    ctx.strokeStyle = INK; ctx.lineWidth = 0.3; ctx.stroke(); ctx.strokeStyle = '#fff7b0'; ctx.lineWidth = 0.16; ctx.stroke();
  }
  ctx.lineCap = 'butt';
}
