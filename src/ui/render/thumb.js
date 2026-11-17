import { BOSSC, FINISH, GRASS, INK, MIDFLOOR, ORCHID, PAPER } from '../theme.js';

export function drawThumb(el, L, me) {
  var c = el.getContext('2d'), m = L.map, H = m.length, W = m[0].length, u = 4;
  var ox = Math.floor((20 - W) / 2) * u, oy = Math.floor((30 - H) / 2) * u;
  c.fillStyle = GRASS; c.fillRect(0, 0, 80, 120);
  var gr = c.createLinearGradient(0, oy, 0, oy + H * u);
  gr.addColorStop(0, ORCHID); gr.addColorStop(0.55, MIDFLOOR); gr.addColorStop(1, PAPER);
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
    var ch = m[y][x]; if (ch === '#') continue;
    c.fillStyle = gr; c.fillRect(ox + x * u, oy + y * u, u, u);
    var col = ch === 'F' ? FINISH : 'AV<>'.indexOf(ch) >= 0 ? '#707a84' : ch === 'C' ? '#c99f58' : ch === 'T' ? '#d8322c' :
      ch === '+' ? '#f0b400' : ch === 'G' ? '#7a4a1c' : ch === 'H' ? '#ff5a1a' : 'durl'.indexOf(ch) >= 0 ? 'rgba(20,150,170,.45)' : ch === '1' ? me.fill : (ch >= '2' && ch <= '7') ? INK : null;
    if (col) { c.fillStyle = col; c.fillRect(ox + x * u, oy + y * u, u, u); }
  }
  (L.saws || []).forEach(function (w) { c.fillStyle = '#707a84'; c.fillRect(ox + w[0] * u - 3, oy + w[1] * u - 3, 6, 6); });
  (L.flames || []).forEach(function (f) { c.fillStyle = '#ff5a1a'; c.fillRect(Math.round(ox + f[0] * u) - 2, Math.round(oy + f[1] * u) - 2, 4, 4); });
  if (L.boss) {
    var bx = Math.round(ox + (L.boss.x - 1.3) * u), by = Math.round(oy + (L.boss.y - 1.3) * u), bs = Math.round(2.6 * u);
    c.fillStyle = INK; c.fillRect(bx - 1, by - 1, bs + 2, bs + 2);
    c.fillStyle = BOSSC[L.boss.type]; c.fillRect(bx, by, bs, bs);
  }
}
