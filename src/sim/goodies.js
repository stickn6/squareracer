import { BUBBLE_BACK, EPS, HALF, WARP_COOL } from './constants.js';

/* ----- goodies: stars to collect (player only), bubble shields (player only), portals (everyone) -----
   '*' tiles stay in the grid until collected. Bubbles come from 'B' tiles. Portals come from level.portals:
   [[ax, ay, bx, by], ...] in tile columns/rows, and a square whose centre enters one end pops out of the other. */
export function stepGoodies(g, dt) {
  var S = g.squares, i, k, s, b, cx, cy;
  /* once the round is decided nothing more counts (the sim keeps running briefly in slow motion) */
  if (g.over) return;
  for (k = 0; k < g.bubbles.length; k++) if (g.bubbles[k].cool > 0) g.bubbles[k].cool = Math.max(0, g.bubbles[k].cool - dt);
  for (i = 0; i < S.length; i++) {
    s = S[i]; if (s.dead) continue;
    if (g.portals.length && warp(g, s)) g.events.push({ type: 'warp', s: s, x1: s.wx, y1: s.wy, x2: s.x, y2: s.y });
    if (!s.isPlayer) continue;
    if (g.stars.got < g.stars.total) {
      /* any star the square touches, not just the one under its centre: small hands, big squares */
      var x0 = Math.floor(s.x - HALF + EPS), x1 = Math.floor(s.x + HALF - EPS), y0 = Math.floor(s.y - HALF + EPS), y1 = Math.floor(s.y + HALF - EPS);
      for (cy = y0; cy <= y1; cy++) for (cx = x0; cx <= x1; cx++) {
        if (cy < 0 || cx < 0 || cy >= g.H || cx >= g.W || g.grid[cy][cx] !== '*') continue;
        g.grid[cy][cx] = ' '; g.stars.got++;
        g.events.push({ type: 'star', x: cx + 0.5, y: cy + 0.5, got: g.stars.got, total: g.stars.total });
      }
    }
    for (k = 0; k < g.bubbles.length; k++) {
      b = g.bubbles[k];
      if (s.shield || b.cool > 0) continue;
      if (Math.abs(s.x - b.x) < HALF + 0.45 && Math.abs(s.y - b.y) < HALF + 0.45) {
        s.shield = true; b.cool = BUBBLE_BACK;
        g.events.push({ type: 'bubble', s: s, x: b.x, y: b.y });
      }
    }
  }
}

/* move a square (or the path-preview ghost) through a portal if its centre is on one. s.warp remembers the tile it
   arrived on, so it does not bounce straight back; it clears once the square is 1.5 tiles clear of it. s.warpT (WARP_COOL)
   also blocks any jump for a moment, so a bounce off a wall beside the exit cannot send it straight back. Returns true on a jump. */
export function warp(g, s) {
  var cx = Math.floor(s.x), cy = Math.floor(s.y), here = cy * g.W + cx, k, p, tx = -1, ty = -1;
  if (s.warp >= 0) {
    /* the exit stays locked until the square is 1.5 tiles clear of it, so bouncing between walls beside it cannot
       re-trigger it. Other ends are 2+ tiles away (validate-level), so they still work from inside that range. */
    var ax = s.warp % g.W + 0.5, ay = Math.floor(s.warp / g.W) + 0.5;
    if (Math.max(Math.abs(s.x - ax), Math.abs(s.y - ay)) >= 1.5) s.warp = -1;
    else if (here === s.warp) return false;
  }
  if (s.warpT > 0) return false;
  for (k = 0; k < g.portals.length; k++) {
    p = g.portals[k];
    if (cx === p.ax && cy === p.ay) { tx = p.bx; ty = p.by; break; }
    if (cx === p.bx && cy === p.by) { tx = p.ax; ty = p.ay; break; }
  }
  if (tx < 0) return false;
  s.wx = s.x; s.wy = s.y;
  s.x = tx + 0.5; s.y = ty + 0.5; s.warp = ty * g.W + tx; s.warpT = WARP_COOL;
  return true;
}
