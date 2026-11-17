import { HALF, SQ } from '../../sim/constants.js';
import { calm } from '../env.js';
import { app } from '../state.js';
import { INK, RAINBOW, SUN, tint } from '../theme.js';
import { ctx } from './canvas.js';
import { bubble, drawGun } from './pickups.js';

export function iceBlock(x, y) {
  var e = HALF + 0.2;
  ctx.fillStyle = 'rgba(170,225,255,.72)'; ctx.fillRect(x - e, y - e, e * 2, e * 2);
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.beginPath(); ctx.moveTo(x - e + 0.15, y - e + 0.55); ctx.lineTo(x - e + 0.55, y - e + 0.15); ctx.lineTo(x - e + 0.8, y - e + 0.15); ctx.lineTo(x - e + 0.15, y - e + 0.8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#2b7bbf'; ctx.lineWidth = 0.1; ctx.strokeRect(x - e, y - e, e * 2, e * 2);
}

/* body, outline and face of one square, in level units, onto any 2D context (game and menu share it) */
export function drawFace(c, col, x, y, now, o) {
  var skin = col.skin, stunned = o.stunned, ux = o.ux || 0, uy = o.uy || 0;
  var L = x - HALF, T = y - HALF, R = x + HALF, B = y + HALF, i;
  function tri(ax, ay, bx, by, px, py, fill, edge) {
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(px, py); c.closePath();
    c.fillStyle = fill; c.fill(); if (edge) c.stroke();
  }
  c.lineJoin = 'miter'; c.strokeStyle = INK; c.lineWidth = 0.07;
  if (skin === 'tiger') {
    tri(L + 0.02, T + 0.1, L + 0.5, T + 0.1, L + 0.16, T - 0.3, col.fill, true); tri(R - 0.02, T + 0.1, R - 0.5, T + 0.1, R - 0.16, T - 0.3, col.fill, true);
    tri(L + 0.17, T + 0.06, L + 0.38, T + 0.06, L + 0.22, T - 0.13, '#ffb3c1'); tri(R - 0.17, T + 0.06, R - 0.38, T + 0.06, R - 0.22, T - 0.13, '#ffb3c1');
  } else if (skin === 'dragon') {
    tri(L + 0.06, T + 0.1, L + 0.4, T + 0.1, L + 0.1, T - 0.36, '#fff1c7', true); tri(R - 0.06, T + 0.1, R - 0.4, T + 0.1, R - 0.1, T - 0.36, '#fff1c7', true);
  } else if (skin === 'robot') {
    c.fillStyle = INK; c.fillRect(x - 0.04, T - 0.24, 0.08, 0.3);
    c.fillStyle = SUN; c.fillRect(x - 0.12, T - 0.42, 0.24, 0.2); c.strokeRect(x - 0.12, T - 0.42, 0.24, 0.2);
  } else if (skin === 'ninja') {
    tri(R - 0.05, T + 0.1, R + 0.38, T + 0.0, R + 0.32, T + 0.26, '#e8372f', true); tri(R - 0.05, T + 0.2, R + 0.32, T + 0.36, R + 0.16, T + 0.54, '#e8372f', true);
  }
  if (col.rainbow && !stunned) {
    var shift = calm() ? 0 : Math.floor(now / 110);
    for (i = 0; i < 6; i++) { c.fillStyle = RAINBOW[(i + shift) % 6]; c.fillRect(L, T + i * SQ / 6, SQ, SQ / 6 + 0.02); }
  } else {
    c.fillStyle = stunned ? (Math.floor(now / 90) % 2 ? '#c9ced4' : col.light) : col.fill;
    c.fillRect(L, T, SQ, SQ);
  }
  if (skin === 'ninja') {
    c.fillStyle = '#e8372f'; c.fillRect(L, T + 0.1, SQ, 0.2);
    c.fillStyle = '#f4cfa6'; c.fillRect(L + 0.1, y - 0.3, SQ - 0.2, 0.38);
  } else if (skin === 'robot') {
    c.fillStyle = '#22303c'; c.fillRect(L + 0.13, y - 0.37, SQ - 0.26, 0.44);
    c.fillStyle = INK; for (i = 0; i < 4; i++) c.fillRect(x - 0.28 + i * 0.16, y + 0.26, 0.08, 0.2);
    c.fillStyle = '#6a737d'; c.fillRect(L + 0.12, T + 0.1, 0.1, 0.1); c.fillRect(R - 0.22, T + 0.1, 0.1, 0.1);
  } else if (skin === 'dragon') {
    c.fillStyle = '#f7d21c'; c.fillRect(L, B - 0.32, SQ, 0.32);
    c.fillStyle = INK; c.fillRect(x - 0.15, y + 0.12, 0.08, 0.08); c.fillRect(x + 0.07, y + 0.12, 0.08, 0.08);
    tri(x - 0.4, B - 0.32, x - 0.18, B - 0.32, x - 0.29, B - 0.08, '#ffffff', true); tri(x + 0.4, B - 0.32, x + 0.18, B - 0.32, x + 0.29, B - 0.08, '#ffffff', true);
  } else if (skin === 'tiger') {
    for (i = 0; i < 3; i++) {
      var sy = y - 0.3 + i * 0.36;
      tri(L, sy - 0.09, L, sy + 0.09, L + 0.25, sy, INK); tri(R, sy - 0.09, R, sy + 0.09, R - 0.25, sy, INK);
    }
    tri(x - 0.09, T, x + 0.09, T, x, T + 0.24, INK);
    c.fillStyle = '#ffffff'; c.fillRect(x - 0.3, y + 0.14, 0.6, 0.38);
    tri(x - 0.11, y + 0.19, x + 0.11, y + 0.19, x, y + 0.32, '#ff7b93', true);
    c.fillStyle = INK; c.fillRect(x - 0.025, y + 0.32, 0.05, 0.12);
  }
  c.strokeStyle = o.flash ? '#ffffff' : INK; c.lineWidth = 0.1;
  c.strokeRect(L + 0.05, T + 0.05, SQ - 0.1, SQ - 0.1);
  var ex = 0.27, ey = skin === 'tiger' ? -0.2 : skin === 'ninja' ? -0.11 : -0.14, es = skin === 'ninja' || skin === 'tiger' ? 0.3 : 0.34, ps = 0.19;
  if (stunned) {
    c.fillStyle = skin === 'robot' ? '#4de3ff' : INK; c.fillRect(x - ex - es / 2, y + ey - 0.05, es, 0.1); c.fillRect(x + ex - es / 2, y + ey - 0.05, es, 0.1);
  } else if (skin === 'robot') {
    c.fillStyle = '#4de3ff';
    c.fillRect(x - ex - 0.12 + ux * 0.05, y + ey - 0.12 + uy * 0.05, 0.24, 0.24); c.fillRect(x + ex - 0.12 + ux * 0.05, y + ey - 0.12 + uy * 0.05, 0.24, 0.24);
  } else {
    c.fillStyle = skin === 'dragon' ? SUN : '#ffffff';
    c.fillRect(x - ex - es / 2, y + ey - es / 2, es, es); c.fillRect(x + ex - es / 2, y + ey - es / 2, es, es);
    var pxo = ux * 0.075, pyo = uy * 0.075, pw = skin === 'dragon' ? 0.1 : ps, ph = skin === 'dragon' ? 0.28 : ps;
    c.fillStyle = '#111';
    c.fillRect(x - ex - pw / 2 + pxo, y + ey - ph / 2 + (skin === 'dragon' ? 0 : pyo), pw, ph); c.fillRect(x + ex - pw / 2 + pxo, y + ey - ph / 2 + (skin === 'dragon' ? 0 : pyo), pw, ph);
    if (skin === 'ninja') {
      tri(x - ex - es / 2 - 0.02, y + ey - es / 2 - 0.03, x - ex + es / 2 + 0.02, y + ey - es / 2 - 0.03, x - ex + es / 2 + 0.02, y + ey - es / 2 + 0.11, '#232a3d');
      tri(x + ex + es / 2 + 0.02, y + ey - es / 2 - 0.03, x + ex - es / 2 - 0.02, y + ey - es / 2 - 0.03, x + ex - es / 2 - 0.02, y + ey - es / 2 + 0.11, '#232a3d');
    }
  }
}
export function drawSquare(s, now) {
  if (s.dead) return;
  var col = s.col, x = s.x, y = s.y, moving = app.g.state === 'playing' && s.stun <= 0;
  var iced = s.ice > 0, stunned = s.stun > 0 && !iced, stag = s.stag > 0 && !s.isPlayer;
  if (stunned && !calm()) { x += Math.sin(now / 28 + s.id) * 0.05; }
  if (s.inv > 0 && !stunned && !iced && Math.floor(now / 80) % 2 === 0) ctx.globalAlpha = 0.45;
  if (moving) {
    var bx = -s.uy, by = s.ux, len = SQ * (s.boost > 0 ? 2.2 : 1.4);
    ctx.fillStyle = s.boost > 0 ? SUN : tint(col, now, true);
    ctx.beginPath(); ctx.moveTo(x + bx * HALF * 0.92, y + by * HALF * 0.92); ctx.lineTo(x - bx * HALF * 0.92, y - by * HALF * 0.92);
    ctx.lineTo(x - s.ux * len, y - s.uy * len); ctx.closePath(); ctx.fill();
    if (app.g.mode === 'battle' && !app.g.level.gun) {
      ctx.fillStyle = '#f4f6f8'; ctx.strokeStyle = INK; ctx.lineWidth = 0.07; ctx.lineJoin = 'round';
      var reach = HALF * (Math.abs(s.ux) + Math.abs(s.uy)) + 0.34, root = reach - 0.62;
      ctx.beginPath(); ctx.moveTo(x + s.ux * root + bx * 0.3, y + s.uy * root + by * 0.3);
      ctx.lineTo(x + s.ux * reach, y + s.uy * reach); ctx.lineTo(x + s.ux * root - bx * 0.3, y + s.uy * root - by * 0.3);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  drawFace(ctx, col, x, y, now, { stunned: stunned, flash: stag && Math.floor(now / 90) % 2 === 1, ux: s.ux, uy: s.uy });
  ctx.globalAlpha = 1;
  if (iced) iceBlock(x, y);
  if (s.shield) bubble(x, y, 1.05, 1, now);
  if (s.gun) drawGun(s.x + Math.cos(s.gun.aim) * 0.42, s.y + 0.3 + Math.sin(s.gun.aim) * 0.42, s.gun.aim, 0.7, 1);
  if (stunned) {
    for (var k = 0; k < 3; k++) {
      var a = now / 160 + k * 2.094;
      ctx.fillStyle = SUN; ctx.fillRect(x + Math.cos(a) * 0.7 - 0.09, y - HALF - 0.32 + Math.sin(a) * 0.14 - 0.09, 0.18, 0.18);
    }
  }
  if (app.g.mode === 'battle') {
    var n = s.maxHp, pw = 0.26, gap = 0.1, tot = n * pw + (n - 1) * gap, py = y - HALF - (col.skin && col.skin !== 'ninja' ? 0.88 : 0.62);
    if (n > 5) {
      ctx.fillStyle = 'rgba(255,251,227,.7)'; ctx.fillRect(s.x - HALF, py, SQ, pw);
      ctx.fillStyle = tint(col, now); ctx.fillRect(s.x - HALF, py, SQ * Math.max(0, s.hp) / n, pw);
      ctx.strokeStyle = INK; ctx.lineWidth = 0.06; ctx.strokeRect(s.x - HALF, py, SQ, pw);
    } else for (var h = 0; h < n; h++) {
      var px = s.x - tot / 2 + h * (pw + gap);
      ctx.fillStyle = h < s.hp ? tint(col, now) : 'rgba(255,251,227,.55)'; ctx.fillRect(px, py, pw, pw);
      ctx.strokeStyle = INK; ctx.lineWidth = 0.06; ctx.strokeRect(px, py, pw, pw);
    }
  }
}
