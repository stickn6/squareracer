import { HALF, HEAT_R } from './constants.js';
import { burnBoss } from './duel.js';

/* ----- the heat ring: first square to touch it keeps it, and it melts any other square the ring reaches ----- */
export function stepHeats(g, dt) {
  for (var k = 0; k < g.heats.length; k++) {
    var h = g.heats[k], s = h.holder, i, o;
    if (s && s.dead) { h.x = s.x; h.y = s.y; s.heat = null; h.holder = null; h.t = 0; h.cool = 1; s = null; }
    if (!s) {
      if (h.cool > 0) { h.cool = Math.max(0, h.cool - dt); continue; }
      var pt = h.path;
      if (pt && pt.len > 0) {
        pt.p += pt.sgn * pt.speed * dt;
        if (pt.p > pt.len) { pt.p = 2 * pt.len - pt.p; pt.sgn = -1; } else if (pt.p < 0) { pt.p = -pt.p; pt.sgn = 1; }
        h.x = pt.x1 + (pt.x2 - pt.x1) * pt.p / pt.len; h.y = pt.y1 + (pt.y2 - pt.y1) * pt.p / pt.len;
      }
      var best = null, bd = 1e9;
      for (i = 0; i < g.squares.length; i++) {
        o = g.squares[i];
        if (o.dead || o.heat) continue;
        if (Math.abs(o.x - h.x) < HALF + 0.5 && Math.abs(o.y - h.y) < HALF + 0.5) {
          var d = Math.hypot(o.x - h.x, o.y - h.y);
          if (d < bd) { bd = d; best = o; }
        }
      }
      if (best) { h.holder = best; best.heat = h; h.t = 0; g.events.push({ type: 'heat', s: best }); }
      continue;
    }
    h.t += dt;
    if (g.over) continue;
    for (i = 0; i < g.squares.length; i++) {
      o = g.squares[i];
      if (o === s || o.dead) continue;
      var dx = Math.max(Math.abs(o.x - s.x) - HALF, 0), dy = Math.max(Math.abs(o.y - s.y) - HALF, 0);
      if (dx * dx + dy * dy < HEAT_R * HEAT_R) {
        o.hp = 0; o.dead = true; o.burnedBy = s;
        g.events.push({ type: 'burn', s: o, by: s }); g.events.push({ type: 'death', s: o });
      }
    }
    var b = g.boss;
    if (b && b.duel && b.hp > 0 && b.inv <= 0) {
      var bx = Math.max(Math.abs(b.x - s.x) - b.half, 0), by = Math.max(Math.abs(b.y - s.y) - b.half, 0);
      if (bx * bx + by * by < HEAT_R * HEAT_R) burnBoss(g, b, s);
    }
  }
}
