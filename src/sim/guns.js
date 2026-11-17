import { BULLET_INV, BULLET_SPEED, GUN_COOL, GUN_FIRST, GUN_GAP, GUN_SHOTS, HALF } from './constants.js';
import { breakCrate, explode, hurt, tileAt } from './world.js';

/* ----- the gun: first square to touch it holds it, it fires three shots at the nearest square, then drops ----- */
export function nearestTo(g, s) {
  var best = null, bd = 1e9;
  for (var i = 0; i < g.squares.length; i++) {
    var o = g.squares[i];
    if (o === s || o.dead) continue;
    var d = Math.hypot(o.x - s.x, o.y - s.y);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}
export function dropGun(g, gun) {
  var h = gun.holder;
  gun.x = h.x; gun.y = h.y; gun.holder = null; h.gun = null; gun.cool = GUN_COOL;
  g.events.push({ type: 'drop', x: gun.x, y: gun.y });
}
export function stepGuns(g, dt) {
  for (var k = 0; k < g.guns.length; k++) {
    var gun = g.guns[k], h = gun.holder, i, s;
    if (h) {
      if (h.dead) { dropGun(g, gun); continue; }
      var t = nearestTo(g, h);
      if (t) gun.aim = Math.atan2(t.y - h.y, t.x - h.x);
      gun.timer -= dt;
      if (gun.timer <= 0) {
        if (t && !g.over) {
          var dx = Math.cos(gun.aim), dy = Math.sin(gun.aim);
          g.bullets.push({ x: h.x + dx * 0.9, y: h.y + dy * 0.9, vx: dx * BULLET_SPEED, vy: dy * BULLET_SPEED, owner: h, life: 2.5 });
          g.events.push({ type: 'shot', s: h, x: h.x + dx * 1.1, y: h.y + dy * 1.1 });
        }
        gun.shots++;
        if (gun.shots >= GUN_SHOTS) dropGun(g, gun); else gun.timer = GUN_GAP;
      }
    } else if (gun.cool > 0) {
      gun.cool = Math.max(0, gun.cool - dt);
    } else {
      var best = null, bd = 1e9;
      for (i = 0; i < g.squares.length; i++) {
        s = g.squares[i];
        if (s.dead || s.gun) continue;
        if (Math.abs(s.x - gun.x) < HALF + 0.5 && Math.abs(s.y - gun.y) < HALF + 0.5) {
          var d = Math.hypot(s.x - gun.x, s.y - gun.y);
          if (d < bd) { bd = d; best = s; }
        }
      }
      if (best) {
        gun.holder = best; best.gun = gun; gun.shots = 0; gun.timer = GUN_FIRST;
        g.events.push({ type: 'pickup', s: best });
      }
    }
  }
}
export function stepBullets(g, dt) {
  for (var i = g.bullets.length - 1; i >= 0; i--) {
    var b = g.bullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    var cx = Math.floor(b.x), cy = Math.floor(b.y), t = tileAt(g, cx, cy), gone = b.life <= 0;
    if (t === '#' || t === 'A' || t === 'V' || t === '<' || t === '>' || t === 'C' || t === 'T') {
      gone = true;
      if (t === 'C') breakCrate(g, cx, cy); else if (t === 'T') explode(g, cx, cy);
      g.events.push({ type: 'spark', x: b.x, y: b.y });
    } else {
      for (var j = 0; j < g.squares.length; j++) {
        var s = g.squares[j];
        if (s.dead || s === b.owner) continue;
        if (Math.abs(b.x - s.x) < HALF + 0.12 && Math.abs(b.y - s.y) < HALF + 0.12) {
          gone = true;
          if (hurt(g, s, 'bullet')) s.inv = BULLET_INV; else g.events.push({ type: 'spark', x: b.x, y: b.y });
          break;
        }
      }
    }
    if (gone) g.bullets.splice(i, 1);
  }
}
