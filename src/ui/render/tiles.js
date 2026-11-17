import { calm } from '../env.js';
import { app } from '../state.js';
import { INK, PAPER, SUN } from '../theme.js';
import { ctx, label } from './canvas.js';

export function drawTiles(now) {
  var t = now / 1000, i, d, ch, x, y;
  for (i = 0; i < app.g.dyn.length; i++) {
    d = app.g.dyn[i]; x = d.x; y = d.y; ch = app.g.grid[y][x];
    if (ch === ' ') continue;
    if (ch === 'C') {
      ctx.fillStyle = '#c99f58'; ctx.fillRect(x + 0.04, y + 0.04, 0.92, 0.92);
      ctx.strokeStyle = '#8d6a30'; ctx.lineWidth = 0.07;
      ctx.beginPath(); ctx.moveTo(x + 0.36, y + 0.08); ctx.lineTo(x + 0.36, y + 0.92); ctx.moveTo(x + 0.66, y + 0.08); ctx.lineTo(x + 0.66, y + 0.92); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 0.08; ctx.strokeRect(x + 0.04, y + 0.04, 0.92, 0.92);
    } else if (ch === 'T') {
      var lit = false;
      for (var f = 0; f < app.g.fuses.length; f++) if (app.g.fuses[f].x === x && app.g.fuses[f].y === y) lit = true;
      ctx.fillStyle = lit ? '#ffffff' : '#d8322c'; ctx.fillRect(x + 0.04, y + 0.04, 0.92, 0.92);
      ctx.fillStyle = '#a81f1a';
      ctx.fillRect(x + 0.27, y + 0.04, 0.06, 0.92); ctx.fillRect(x + 0.67, y + 0.04, 0.06, 0.92);
      ctx.fillStyle = PAPER; ctx.fillRect(x + 0.04, y + 0.3, 0.92, 0.4);
      ctx.strokeStyle = INK; ctx.lineWidth = 0.08; ctx.strokeRect(x + 0.04, y + 0.04, 0.92, 0.92);
      label('TNT', x + 0.5, y + 0.52, 0.3, INK);
    } else if (ch === '+') {
      var pulse = 0.5 + 0.5 * Math.sin(t * 6 + x + y);
      ctx.fillStyle = SUN; ctx.globalAlpha = 0.75 + 0.25 * pulse; ctx.fillRect(x + 0.08, y + 0.08, 0.84, 0.84); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#a97800'; ctx.lineWidth = 0.07; ctx.strokeRect(x + 0.08, y + 0.08, 0.84, 0.84);
      ctx.fillStyle = INK; ctx.beginPath();
      ctx.moveTo(x + 0.6, y + 0.14); ctx.lineTo(x + 0.28, y + 0.56); ctx.lineTo(x + 0.47, y + 0.56); ctx.lineTo(x + 0.4, y + 0.86);
      ctx.lineTo(x + 0.72, y + 0.44); ctx.lineTo(x + 0.53, y + 0.44); ctx.closePath(); ctx.fill();
    } else {
      var o = calm() ? 0 : ((t * 1.4 + (x + y) * 0.13) % 1) * 0.24 - 0.12;
      ctx.fillStyle = 'rgba(30,170,190,.22)'; ctx.fillRect(x, y, 1, 1);
      ctx.strokeStyle = 'rgba(18,48,26,.6)'; ctx.lineWidth = 0.13; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
      ctx.beginPath();
      if (ch === 'r') { ctx.moveTo(x + 0.34 + o, y + 0.2); ctx.lineTo(x + 0.66 + o, y + 0.5); ctx.lineTo(x + 0.34 + o, y + 0.8); }
      else if (ch === 'l') { ctx.moveTo(x + 0.66 - o, y + 0.2); ctx.lineTo(x + 0.34 - o, y + 0.5); ctx.lineTo(x + 0.66 - o, y + 0.8); }
      else if (ch === 'd') { ctx.moveTo(x + 0.2, y + 0.34 + o); ctx.lineTo(x + 0.5, y + 0.66 + o); ctx.lineTo(x + 0.8, y + 0.34 + o); }
      else { ctx.moveTo(x + 0.2, y + 0.66 - o); ctx.lineTo(x + 0.5, y + 0.34 - o); ctx.lineTo(x + 0.8, y + 0.66 - o); }
      ctx.stroke();
    }
  }
}
export function drawSaws() {
  for (var i = 0; i < app.g.saws.length; i++) {
    var w = app.g.saws[i], k;
    ctx.strokeStyle = 'rgba(18,48,26,.28)'; ctx.lineWidth = 0.1; ctx.setLineDash([0.25, 0.25]);
    ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(calm() ? 0 : w.rot);
    ctx.beginPath();
    for (k = 0; k < 20; k++) {
      var a = k / 20 * 6.283, rr = k % 2 ? w.r * 0.74 : w.r * 1.02;
      if (k) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fillStyle = '#d5dbe1'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.08; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, w.r * 0.34, 0, 6.283); ctx.fillStyle = '#66707a'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = PAPER; ctx.fillRect(-0.07, -w.r * 0.34, 0.14, w.r * 0.3);
    ctx.restore();
  }
}
