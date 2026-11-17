import { COP_CHASE, COP_REST, COP_SPEED, COP_WIND, FROST_FAN, FROST_GAP, FROST_TELL, HALF, ICE_FREEZE, SHARD_R, SHARD_SPEED } from './constants.js';
import { stepDuel } from './duel.js';
import { breakCrate, hurt, moveAxis, rejit, tileAt } from './world.js';

/* ----- bosses ----- */
export function inZone(b, s) { var z = b.zone; return s.x > z[0] && s.x < z[2] && s.y > z[1] && s.y < z[3]; }
export function nearInZone(g, b) {
  var best = null, bd = 1e9;
  for (var i = 0; i < g.squares.length; i++) {
    var s = g.squares[i];
    if (s.dead || !inZone(b, s)) continue;
    var d = Math.hypot(s.x - b.x, s.y - b.y);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}
export function knockOut(g, s, b) {
  s.hp = 0; s.dead = true; s.outBy = b.type;
  g.events.push({ type: 'out', s: s, how: b.type, bx: b.x, by: b.y });
}
export function stepBoss(g, dt) {
  var b = g.boss, S = g.squares, i, s, t, dx, dy;
  if (g.over) return;
  if (b.type === 'cop') {
    /* Sarge: runs at the nearest square in his room and busts it on contact. After a catch, or when he runs
       out of puff, he has to stop for breath, and while he rests he is harmless. */
    t = nearInZone(g, b);
    if (b.phase === 'rest') {
      b.t -= dt;
      if (b.t <= 0) { b.phase = 'home'; b.stam = COP_CHASE; }
    } else {
      if (t) {
        if (b.phase !== 'chase') { b.phase = 'chase'; b.run = 0; g.events.push({ type: 'siren', s: t }); }
        b.stam -= dt; b.run += dt;
        if (b.stam <= 0) { b.phase = 'rest'; b.t = COP_REST; g.events.push({ type: 'phew', x: b.x, y: b.y }); }
      } else b.phase = 'home';
      if (b.phase !== 'rest') {
        var gx = t ? t.x : b.hx, gy = t ? t.y : b.hy;
        dx = gx - b.x; dy = gy - b.y;
        /* he needs a moment to get going, so a square right beside him can still slip away */
        var m = Math.hypot(dx, dy), step = COP_SPEED * (t ? Math.min(1, 0.2 + b.run / COP_WIND) : 0.6) * dt;
        if (m > 1e-6) {
          if (m <= step) { b.x = gx; b.y = gy; } else { b.x += dx / m * step; b.y += dy / m * step; }
          b.aim = Math.atan2(dy, dx);
        }
        var z = b.zone;
        b.x = Math.max(z[0] + b.half, Math.min(z[2] - b.half, b.x));
        b.y = Math.max(z[1] + b.half, Math.min(z[3] - b.half, b.y));
      }
    }
    b.target = b.phase === 'chase' ? t : null;
  } else {
    /* Volt and Frost pace side to side in front of the exit */
    if (b.speed > 0 && b.plen > 0 && !(b.duel && b.lock)) {
      b.pp += b.dir * b.speed * dt;
      if (b.pp > b.plen) { b.pp = b.plen; b.dir = -1; } else if (b.pp < 0) { b.pp = 0; b.dir = 1; }
      b.x = b.px1 + (b.px2 - b.px1) * b.pp / b.plen; b.y = b.py1 + (b.py2 - b.py1) * b.pp / b.plen;
    }
    if (b.duel) stepDuel(g, b, dt);
    else b.t += dt;
    if (b.duel) { /* waves instead of the ring */ }
    else if (b.type === 'volt') {
      /* Volt: charges up, then shocks every square inside the ring */
      if (b.charge === 0 && b.t >= b.idle) g.events.push({ type: 'charge', x: b.x, y: b.y });
      b.charge = Math.max(0, (b.t - b.idle) / b.chargeT);
      if (b.t >= b.idle + b.chargeT) {
        b.t = 0; b.charge = 0;
        g.events.push({ type: 'zap', x: b.x, y: b.y, r: b.R });
        for (i = 0; i < S.length; i++) {
          s = S[i]; if (s.dead) continue;
          dx = Math.max(Math.abs(s.x - b.x) - HALF, 0); dy = Math.max(Math.abs(s.y - b.y) - HALF, 0);
          if (dx * dx + dy * dy < b.R * b.R) knockOut(g, s, b);
        }
      }
    } else {
      /* Frost: takes aim at the nearest square, shows the aim, then throws three ice shards along it */
      t = nearInZone(g, b);
      b.target = t;
      if (!b.lock) {
        if (t) b.aim = Math.atan2(t.y - b.y, t.x - b.x);
        if (b.t >= FROST_GAP - FROST_TELL) { if (t) b.lock = true; else b.t = FROST_GAP - FROST_TELL; }
      }
      b.tell = b.lock ? Math.min(1, (b.t - (FROST_GAP - FROST_TELL)) / FROST_TELL) : 0;
      if (b.lock && b.t >= FROST_GAP) {
        for (i = -1; i <= 1; i++) {
          var a = b.aim + i * FROST_FAN;
          g.shards.push({ x: b.x + Math.cos(a) * 0.9, y: b.y + Math.sin(a) * 0.9, vx: Math.cos(a) * SHARD_SPEED, vy: Math.sin(a) * SHARD_SPEED, life: 5 });
        }
        g.events.push({ type: 'throw', x: b.x, y: b.y });
        b.t = 0; b.lock = false; b.tell = 0;
      }
    }
  }
  /* body contact: Sarge busts you once he is up to speed (not while resting or just setting off); otherwise bosses are solid and you bounce off */
  for (i = 0; i < S.length; i++) {
    s = S[i]; if (s.dead) continue;
    var ox = b.half + HALF - Math.abs(s.x - b.x), oy = b.half + HALF - Math.abs(s.y - b.y);
    if (ox <= 0 || oy <= 0) continue;
    if (b.type === 'cop' && b.phase === 'chase' && b.run >= COP_WIND) { knockOut(g, s, b); b.phase = 'rest'; b.t = COP_REST; b.target = null; g.events.push({ type: 'phew', x: b.x, y: b.y, bust: true }); continue; }
    var sgn;
    if (ox < oy) { sgn = s.x >= b.x ? 1 : -1; moveAxis(g, s, 0, sgn * (ox + 0.002), true); s.ux = sgn * Math.abs(s.ux); }
    else { sgn = s.y >= b.y ? 1 : -1; moveAxis(g, s, 1, sgn * (oy + 0.002), true); s.uy = sgn * Math.abs(s.uy); }
    if (!s.isPlayer) rejit(g, s);
    g.events.push({ type: 'bounce', s: s });
  }
}
export function stepShards(g, dt) {
  for (var i = g.shards.length - 1; i >= 0; i--) {
    var q = g.shards[i];
    q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
    var cx = Math.floor(q.x), cy = Math.floor(q.y), t = tileAt(g, cx, cy), gone = q.life <= 0;
    /* shards melt at the edge of Frost's room, so the strip below it stays safe */
    if (q.y > g.boss.zone[3] || t === '#' || t === 'A' || t === 'V' || t === '<' || t === '>' || t === 'C' || t === 'T') {
      gone = true;
      if (t === 'C') breakCrate(g, cx, cy);
      g.events.push({ type: 'chip', x: q.x, y: q.y });
    } else if (!g.over) {
      for (var j = 0; j < g.squares.length; j++) {
        var s = g.squares[j];
        if (s.dead) continue;
        if (Math.abs(q.x - s.x) < HALF + SHARD_R && Math.abs(q.y - s.y) < HALF + SHARD_R) {
          if (!g.boss.duel) knockOut(g, s, g.boss);
          else if (hurt(g, s, 'ice') && !s.dead) {
            s.stun = ICE_FREEZE; s.ice = ICE_FREEZE; s.inv = ICE_FREEZE + 0.8; g.events.push({ type: 'frozen', s: s });
            /* a hit buys a full gap before his next throw */
            g.boss.t = Math.min(g.boss.t, 0); g.boss.lock = false; g.boss.tell = 0;
          }
          gone = true; break;
        }
      }
    }
    if (gone) g.shards.splice(i, 1);
  }
}
