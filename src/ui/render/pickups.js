import { GUN_COOL, HEAT_R } from '../../sim/constants.js';
import { calm } from '../env.js';
import { parts } from '../fx.js';
import { app } from '../state.js';
import { INK, SUN } from '../theme.js';
import { ctx } from './canvas.js';

/* a stubby AK-style rifle: wooden stock, grip and handguard, curved magazine, long barrel */
export function drawGun(x, y, ang, k, alpha) {
  var wood = '#b06f2c', steel = '#3b4046', dark = '#24272b';
  function box(bx, by, w, h, fill) { ctx.fillStyle = fill; ctx.fillRect(bx, by, w, h); ctx.strokeRect(bx, by, w, h); }
  function poly(pts, fill) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
  }
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  if (Math.cos(ang) < 0) ctx.scale(1, -1);
  ctx.scale(k, k); ctx.globalAlpha = alpha;
  ctx.lineJoin = 'round'; ctx.lineWidth = 0.055; ctx.strokeStyle = INK;
  poly([-1.0, -0.05, -0.46, -0.11, -0.46, 0.1, -1.0, 0.25], wood);
  box(0.5, -0.07, 0.5, 0.09, steel); box(0.98, -0.1, 0.1, 0.15, dark);
  box(0.2, -0.18, 0.46, 0.07, steel); box(0.84, -0.22, 0.06, 0.15, dark);
  box(-0.46, -0.13, 0.66, 0.26, steel); box(-0.12, -0.2, 0.1, 0.07, dark);
  box(0.2, -0.11, 0.36, 0.22, wood);
  poly([-0.02, 0.13, 0.17, 0.13, 0.31, 0.35, 0.4, 0.58, 0.21, 0.64, 0.1, 0.39], dark);
  poly([-0.34, 0.13, -0.18, 0.13, -0.26, 0.42, -0.43, 0.37], wood);
  ctx.restore();
}
export function drawGuns(now) {
  for (var i = 0; i < app.g.guns.length; i++) {
    var gun = app.g.guns[i];
    if (gun.holder) continue;
    var ready = gun.cool <= 0, pulse = calm() ? 0.5 : 0.5 + 0.5 * Math.sin(now / 160);
    ctx.beginPath(); ctx.arc(gun.x, gun.y, 0.95 + (ready ? pulse * 0.12 : 0), 0, 6.283);
    ctx.fillStyle = ready ? 'rgba(255,212,58,' + (0.3 + 0.25 * pulse).toFixed(2) + ')' : 'rgba(18,48,26,.12)'; ctx.fill();
    ctx.strokeStyle = ready ? SUN : 'rgba(18,48,26,.35)'; ctx.lineWidth = 0.09; ctx.stroke();
    if (!ready) {
      ctx.beginPath(); ctx.arc(gun.x, gun.y, 0.95, -Math.PI / 2, -Math.PI / 2 + (1 - gun.cool / GUN_COOL) * 6.283);
      ctx.strokeStyle = INK; ctx.lineWidth = 0.12; ctx.stroke();
    }
    drawGun(gun.x - 0.02, gun.y - 0.08 + (ready && !calm() ? Math.sin(now / 260) * 0.06 : 0), -0.32, 0.8, ready ? 1 : 0.4);
  }
}
export function flame(x, y, k) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.beginPath(); ctx.moveTo(0, -0.62);
  ctx.quadraticCurveTo(0.55, -0.1, 0.4, 0.3); ctx.quadraticCurveTo(0.28, 0.62, 0, 0.62);
  ctx.quadraticCurveTo(-0.32, 0.62, -0.42, 0.28); ctx.quadraticCurveTo(-0.5, -0.02, -0.18, -0.2);
  ctx.quadraticCurveTo(-0.12, -0.42, 0, -0.62); ctx.closePath();
  ctx.fillStyle = '#ff5a1a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.07; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0.02, -0.12);
  ctx.quadraticCurveTo(0.3, 0.14, 0.2, 0.36); ctx.quadraticCurveTo(0.12, 0.5, 0, 0.5);
  ctx.quadraticCurveTo(-0.2, 0.5, -0.2, 0.3); ctx.quadraticCurveTo(-0.2, 0.08, 0.02, -0.12); ctx.closePath();
  ctx.fillStyle = SUN; ctx.fill();
  ctx.restore();
}
export function drawHeats(now) {
  for (var i = 0; i < app.g.heats.length; i++) {
    var h = app.g.heats[i], s = h.holder, pulse = calm() ? 0.5 : 0.5 + 0.5 * Math.sin(now / 150);
    if (!s) {
      var ready = h.cool <= 0;
      if (h.path) {
        ctx.strokeStyle = 'rgba(255,90,26,.4)'; ctx.lineWidth = 0.1; ctx.setLineDash([0.25, 0.25]);
        ctx.beginPath(); ctx.moveTo(h.path.x1, h.path.y1); ctx.lineTo(h.path.x2, h.path.y2); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.globalAlpha = ready ? 1 : 0.4;
      ctx.beginPath(); ctx.arc(h.x, h.y, 0.95 + pulse * 0.14, 0, 6.283);
      ctx.fillStyle = 'rgba(255,120,20,' + (0.25 + 0.25 * pulse).toFixed(2) + ')'; ctx.fill();
      ctx.strokeStyle = '#ff5a1a'; ctx.lineWidth = 0.1; ctx.stroke();
      flame(h.x, h.y - 0.04, 1.05 + (calm() ? 0 : pulse * 0.08));
      ctx.globalAlpha = 1;
      continue;
    }
    if (s.dead) continue;
    var gr = ctx.createRadialGradient(s.x, s.y, HEAT_R * 0.35, s.x, s.y, HEAT_R);
    gr.addColorStop(0, 'rgba(255,170,40,0)'); gr.addColorStop(0.72, 'rgba(255,120,20,' + (0.22 + 0.1 * pulse).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(232,55,47,.6)');
    ctx.beginPath(); ctx.arc(s.x, s.y, HEAT_R, 0, 6.283); ctx.fillStyle = gr; ctx.fill();
    ctx.strokeStyle = '#e8372f'; ctx.lineWidth = 0.12; ctx.setLineDash([0.4, 0.24]); ctx.lineDashOffset = calm() ? 0 : -now / 110;
    ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
    if (!calm() && !app.paused && parts.length < 300 && Math.random() < 0.35) {
      var a = Math.random() * 6.283;
      parts.push({ x: s.x + Math.cos(a) * HEAT_R, y: s.y + Math.sin(a) * HEAT_R, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5 - 1.2, life: 0, max: 0.45, size: 0.2, color: Math.random() < 0.5 ? '#ff8a1e' : SUN });
    }
  }
}

export function drawBullets() {
  ctx.lineCap = 'round';
  for (var i = 0; i < app.g.bullets.length; i++) {
    var b = app.g.bullets[i], m = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / m, uy = b.vy / m;
    ctx.strokeStyle = INK; ctx.lineWidth = 0.28;
    ctx.beginPath(); ctx.moveTo(b.x - ux * 0.5, b.y - uy * 0.5); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = SUN; ctx.lineWidth = 0.15;
    ctx.beginPath(); ctx.moveTo(b.x - ux * 0.5, b.y - uy * 0.5); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.lineCap = 'butt';
}
