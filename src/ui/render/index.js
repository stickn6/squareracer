import { $ } from '../dom.js';
import { HALF } from '../../sim/constants.js';
import { predictPath } from '../../sim/world.js';
import { calm } from '../env.js';
import { parts, pops, rings, shakeAmount } from '../fx.js';
import { ptr, steering } from '../input.js';
import { app } from '../state.js';
import { FINISH, GRASS, INK, MIDFLOOR, ORCHID, PAPER, STEEL } from '../theme.js';
import { drawBoss, drawBossFx, drawBossUnder, drawGhosts, drawShards, drawSparks } from './boss.js';
import { ctx, cv, label, off, view } from './canvas.js';
import { drawBullets, drawGuns, drawHeats } from './pickups.js';
import { drawSquare } from './squares.js';
import { drawSaws, drawTiles } from './tiles.js';

/* ----- layout, the static level picture (walls, floor, spikes) cached in `base`, and the per-frame draw ----- */
let dpr = 1, base = null;
const pathBuf = [];

export function layout() {
  if (cv.hidden) return;
  var cr = cv.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = Math.max(1, Math.round(cr.width * dpr)), h = Math.max(1, Math.round(cr.height * dpr));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  if (!app.g) return;
  var r = $('field').getBoundingClientRect();
  var aw = r.width * dpr, ah = r.height * dpr;
  var c = Math.max(3, Math.floor(Math.min(aw / (app.g.W + 1), ah / (app.g.H + 1))));
  view.c = c;
  view.ox = Math.round((r.left - cr.left) * dpr + (aw - app.g.W * c) / 2);
  /* sit just under the HUD so any spare height is free thumb room below the level */
  view.oy = Math.round((r.top - cr.top) * dpr + Math.min((ah - app.g.H * c) / 2, c * 0.7));
  buildBase();
}
export function buildBase() {
  var c = view.c, pad = Math.ceil(c * 0.9), W = app.g.W, H = app.g.H, m = app.g.level.map, x, y;
  if (!base) base = document.createElement('canvas');
  base.width = W * c + pad * 2; base.height = H * c + pad * 2; base.pad = pad;
  var b = base.getContext('2d');
  b.setTransform(1, 0, 0, 1, pad, pad);
  var fr = Math.max(3, Math.round(c * 0.28));
  b.fillStyle = 'rgba(18,48,26,.32)'; b.fillRect(0, 0, W * c + fr * 2, H * c + fr * 2);
  b.fillStyle = INK; b.fillRect(-fr, -fr, W * c + fr * 2, H * c + fr * 2);
  b.fillStyle = GRASS; b.fillRect(0, 0, W * c, H * c);
  var gr = b.createLinearGradient(0, 0, 0, H * c);
  gr.addColorStop(0, ORCHID); gr.addColorStop(0.55, MIDFLOOR); gr.addColorStop(1, PAPER);
  b.fillStyle = gr; b.beginPath();
  for (y = 0; y < H; y++) for (x = 0; x < W; x++) if (m[y][x] !== '#') b.rect(x * c, y * c, c, c);
  b.fill();
  var hf = Math.floor(c / 2);
  for (y = 0; y < H; y++) for (x = 0; x < W; x++) if (m[y][x] === 'F') {
    b.fillStyle = FINISH; b.fillRect(x * c, y * c, c, c);
    b.fillStyle = 'rgba(255,255,255,.18)'; b.fillRect(x * c, y * c, hf, hf); b.fillRect(x * c + hf, y * c + hf, c - hf, c - hf);
  }
  var lw = Math.max(2, 2 * Math.round(c * 0.05)), wall = function (px, py) { return px < 0 || py < 0 || px >= W || py >= H || m[py][px] === '#'; };
  b.fillStyle = INK;
  for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
    if (m[y][x] === '#') continue;
    if (wall(x, y - 1)) b.fillRect(x * c - lw / 2, y * c - lw / 2, c + lw, lw);
    if (wall(x, y + 1)) b.fillRect(x * c - lw / 2, (y + 1) * c - lw / 2, c + lw, lw);
    if (wall(x - 1, y)) b.fillRect(x * c - lw / 2, y * c - lw / 2, lw, c + lw);
    if (wall(x + 1, y)) b.fillRect((x + 1) * c - lw / 2, y * c - lw / 2, lw, c + lw);
  }
  for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
    var k = 'A>V<'.indexOf(m[y][x]);
    if (k >= 0) spike(b, x, y, c, k * Math.PI / 2);
  }
}
export function spike(b, x, y, c, rot) {
  var h = c / 2;
  b.save(); b.translate((x + 0.5) * c, (y + 0.5) * c); b.rotate(rot);
  b.beginPath(); b.moveTo(-h * 0.94, h); b.lineTo(0, -h * 0.9); b.lineTo(h * 0.94, h); b.closePath(); b.fillStyle = STEEL; b.fill();
  b.beginPath(); b.moveTo(-h * 0.94, h); b.lineTo(0, -h * 0.9); b.lineTo(-h * 0.2, h); b.closePath(); b.fillStyle = '#eef1f4'; b.fill();
  b.beginPath(); b.moveTo(h * 0.94, h); b.lineTo(0, -h * 0.9); b.lineTo(h * 0.36, h); b.closePath(); b.fillStyle = '#66707a'; b.fill();
  b.beginPath(); b.moveTo(-h * 0.94, h); b.lineTo(0, -h * 0.9); b.lineTo(h * 0.94, h);
  b.strokeStyle = INK; b.lineWidth = Math.max(1.5, c * 0.07); b.lineJoin = 'round'; b.stroke();
  b.restore();
}

export function draw(now) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (!app.g || !base) return;
  var c = view.c, p = app.g.squares[0], i, q, shake = shakeAmount();
  off.x = shake > 0 ? Math.round((Math.random() * 2 - 1) * shake * c * 0.5) : 0;
  off.y = shake > 0 ? Math.round((Math.random() * 2 - 1) * shake * c * 0.5) : 0;
  ctx.drawImage(base, view.ox - base.pad + off.x, view.oy - base.pad + off.y);
  ctx.setTransform(c, 0, 0, c, view.ox + off.x, view.oy + off.y);
  drawTiles(now);
  drawSaws();
  drawGuns(now);
  drawHeats(now);
  if (app.g.boss) drawBossUnder(now);

  var aiming = steering() && app.g.state === 'playing' && !app.g.over && !p.dead && p.stun <= 0;
  if (aiming) {
    predictPath(app.g, p, 7.5, pathBuf);
    for (i = 0; i < pathBuf.length; i += 2) {
      var fade = 1 - i / pathBuf.length;
      ctx.globalAlpha = 0.25 + 0.6 * fade;
      ctx.fillStyle = INK; ctx.fillRect(pathBuf[i] - 0.13, pathBuf[i + 1] - 0.13, 0.26, 0.26);
      ctx.fillStyle = PAPER; ctx.fillRect(pathBuf[i] - 0.08, pathBuf[i + 1] - 0.08, 0.16, 0.16);
    }
    ctx.globalAlpha = 1;
  }
  for (i = app.g.squares.length - 1; i >= 0; i--) drawSquare(app.g.squares[i], now);
  drawBullets();
  if (app.g.boss) { drawGhosts(now); if (!app.g.boss.duel || app.g.boss.hp > 0) drawBoss(now); drawShards(); drawSparks(now); drawBossFx(); }

  for (i = 0; i < rings.length; i++) {
    q = rings[i]; var k = q.life / q.max;
    ctx.strokeStyle = 'rgba(255,138,30,' + (1 - k) + ')'; ctx.lineWidth = 0.35 * (1 - k) + 0.05;
    ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (0.25 + 0.75 * k), 0, 6.283); ctx.stroke();
  }
  for (i = 0; i < parts.length; i++) {
    q = parts[i]; var sz = q.size * (1 - q.life / q.max);
    ctx.fillStyle = q.color; ctx.fillRect(q.x - sz / 2, q.y - sz / 2, sz, sz);
  }
  for (i = 0; i < pops.length; i++) {
    q = pops[i]; ctx.globalAlpha = Math.min(1, (q.max - q.life) * 3);
    label(q.text, q.x, q.y, 0.62, q.color, INK);
  }
  ctx.globalAlpha = 1;
  if (app.g.state === 'ready' && !p.dead) {
    var bob = calm() ? 0 : Math.sin(now / 220) * 0.14, ty = p.y - HALF - 0.5 + bob;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(p.x - 0.34, ty - 0.4); ctx.lineTo(p.x + 0.34, ty - 0.4); ctx.lineTo(p.x, ty); ctx.closePath(); ctx.fill();
    label('YOU', p.x, ty - 0.86, 0.66, PAPER, INK);
  }

  /* screen-space: slow-motion vignette and the drag stick */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  var slow = (1 - app.ts) / 0.75;
  if (slow > 0.02) {
    var R = Math.max(cv.width, cv.height) * 0.72, vg = ctx.createRadialGradient(cv.width / 2, cv.height / 2, R * 0.45, cv.width / 2, cv.height / 2, R);
    vg.addColorStop(0, 'rgba(18,48,26,0)'); vg.addColorStop(1, 'rgba(18,48,26,' + (0.5 * slow).toFixed(3) + ')');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, cv.width, cv.height);
  }
  if (ptr.active) {
    var ax = ptr.ax * dpr, ay = ptr.ay * dpr, kx = ptr.x * dpr, ky = ptr.y * dpr;
    ctx.lineWidth = 2.5 * dpr; ctx.strokeStyle = 'rgba(18,48,26,.5)'; ctx.fillStyle = 'rgba(255,251,227,.14)';
    ctx.beginPath(); ctx.arc(ax, ay, 46 * dpr, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(kx, ky); ctx.stroke();
    ctx.fillStyle = PAPER; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.arc(kx, ky, 12 * dpr, 0, 6.283); ctx.fill(); ctx.stroke();
  }
}
