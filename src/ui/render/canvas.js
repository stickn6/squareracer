import { $ } from '../dom.js';
/* The game canvas and the level-to-screen transform shared by every render module.
   view.c = device pixels per tile, view.ox/oy = where tile (0, 0) sits; off = this frame's screen-shake offset. */
export const cv = $('cv'), ctx = cv.getContext('2d');
export const view = { c: 16, ox: 0, oy: 0 }, off = { x: 0, y: 0 };

/* text in level units, drawn in screen space so it stays crisp */

export function label(str, x, y, size, fill, edge) {
  var c = view.c;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, view.ox + off.x, view.oy + off.y);
  ctx.font = Math.max(8, Math.round(size * c)) + 'px Bungee, "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (edge) { ctx.lineWidth = Math.max(2, c * 0.16); ctx.strokeStyle = edge; ctx.lineJoin = 'round'; ctx.strokeText(str, x * c, y * c); }
  ctx.fillStyle = fill; ctx.fillText(str, x * c, y * c);
  ctx.restore();
}
