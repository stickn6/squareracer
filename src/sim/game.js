import { stepBoss, stepShards } from './boss.js';
import { BOOST_MULT, BOOST_TIME, BOSS_HALF, CLASH_EDGE, COP_CHASE, FROST_GAP, FROST_TELL, HALF, HEAT_RAMP, HEAT_TOP, ICE_FANS, ICE_GAPS, PLAYER_SPEED, SQ, STAG_TIME, VOLT_CHARGE, VOLT_IDLE, VOLT_R } from './constants.js';
import { stepSparks } from './duel.js';
import { stepBullets, stepGuns } from './guns.js';
import { stepHeats } from './heat.js';
import { makeRng } from './rng.js';
import { explode, hurt, knock, moveAxis, placeSaws, rejit, tileAt } from './world.js';

export function makeGame(level, opts) {
  opts = opts || {};
  var rnd = makeRng(opts.seed || 1);
  var grid = level.map.map(function (r) { return r.split(''); });
  var H = grid.length, W = grid[0].length, spawns = [], dyn = [], guns = [], heats = [];
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
    var c = grid[y][x];
    if (c >= '1' && c <= '7') { spawns[+c - 1] = { x: x + 0.5, y: y + 0.5 }; grid[y][x] = ' '; }
    else if (c === 'H') { heats.push({ x: x + 0.5, y: y + 0.5, holder: null, t: 0, cool: 0, path: null }); grid[y][x] = ' '; }
    else if (c === 'G') { guns.push({ x: x + 0.5, y: y + 0.5, holder: null, cool: 0, shots: 0, timer: 0, aim: -0.4 }); grid[y][x] = ' '; }
    else if ('CT+durl'.indexOf(c) >= 0) dyn.push({ x: x, y: y });
  }
  var g = {
    level: level, mode: level.mode, W: W, H: H, grid: grid, dyn: dyn,
    squares: [], saws: [], fuses: [], guns: guns, bullets: [], heats: heats, time: 0, state: 'ready', over: null,
    events: [], rnd: rnd, noEnd: !!opts.noEnd, boss: null, shards: [], sparks: [], waveId: 0
  };
  /* a flame can slide to and fro until somebody catches it: [x1, y1, x2, y2, speed] */
  (level.flames || []).forEach(function (f) {
    heats.push({ x: f[0], y: f[1], holder: null, t: 0, cool: 0, path: { x1: f[0], y1: f[1], x2: f[2], y2: f[3], len: Math.hypot(f[2] - f[0], f[3] - f[1]), speed: f[4], p: 0, sgn: 1 } });
  });
  if (level.boss) {
    var bc = level.boss;
    var pth = bc.path || (bc.patrol ? [bc.patrol[0], bc.y, bc.patrol[1], bc.y] : [bc.x, bc.y, bc.x, bc.y]);
    g.boss = {
      type: bc.type, name: bc.name, x: bc.x, y: bc.y, hx: bc.x, hy: bc.y, half: BOSS_HALF,
      px1: pth[0], py1: pth[1], px2: pth[2], py2: pth[3], plen: Math.hypot(pth[2] - pth[0], pth[3] - pth[1]), pp: Math.hypot(bc.x - pth[0], bc.y - pth[1]),
      speed: bc.speed || 0, dir: 1, R: bc.r || VOLT_R, idle: bc.idle || VOLT_IDLE, chargeT: bc.charge || VOLT_CHARGE,
      zone: bc.zone, t: 0, charge: 0, tell: 0, lock: false, aim: Math.PI / 2, target: null, phase: 'home', stam: COP_CHASE, run: 0,
      duel: !!bc.duel, hp: bc.hp || 0, maxHp: bc.hp || 0, inv: 0, spots: bc.spots || null,
      gaps: bc.gaps || ICE_GAPS, fans: bc.fans || ICE_FANS, reaim: bc.reaim || null, fanN: 3
    };
    /* start each run at a different point in the boss's rhythm */
    if (bc.duel) g.boss.t = -rnd() * 0.4 - (bc.type === 'frost' ? 0.7 : 0);
    else if (bc.type !== 'cop') {
      g.boss.t = rnd() * (bc.type === 'volt' ? g.boss.idle + g.boss.chargeT * 0.8 : FROST_GAP - FROST_TELL); g.boss.dir = rnd() < 0.5 ? -1 : 1;
      /* first: [earliest, latest] time of Volt's first flash, for levels that want it early */
      if (bc.first && bc.type === 'volt') g.boss.t = g.boss.idle + g.boss.chargeT - (bc.first[0] + rnd() * (bc.first[1] - bc.first[0]));
    }
  }
  for (var i = 0; i < spawns.length; i++) {
    var isP = i === 0 && !opts.allAI;
    var s = {
      id: i, isPlayer: isP, x: spawns[i].x, y: spawns[i].y, ux: 0, uy: 0,
      speed: isP ? PLAYER_SPEED : level.aiSpeed,
      hp: isP ? (level.mode === 'battle' && opts.playerHp > 0 ? opts.playerHp : 3) : (level.enemyHp || 3), inv: 0, boost: 0, stun: 0, ice: 0, stag: 0, tink: 0, gun: null, heat: null, burnedBy: null, outBy: null, dead: false, finT: -1
    };
    s.maxHp = s.hp;
    if (isP) {
      var d = level.pdir || [1, 0], m = Math.hypot(d[0], d[1]);
      s.ux = d[0] / m; s.uy = d[1] / m;
    } else {
      s.ux = rnd() < 0.5 ? -1 : 1; s.uy = rnd() < 0.5 ? -1 : 1; rejit(g, s);
    }
    g.squares.push(s);
  }
  if (opts.noPlayer) g.squares[0].dead = true;
  /* in the duel the player starts with the heat ring already on */
  if (level.duel) { var hh = { x: g.squares[0].x, y: g.squares[0].y, holder: g.squares[0], t: 0, cool: 0, path: null }; heats.push(hh); g.squares[0].heat = hh; }
  (level.saws || []).forEach(function (w) {
    var len = Math.hypot(w[2] - w[0], w[3] - w[1]);
    g.saws.push({
      x1: w[0], y1: w[1], x2: w[2], y2: w[3], len: len, speed: w[4], r: w[5] || 0.8,
      p: (w[6] || 0) * len, sgn: 1, x: w[0], y: w[1], rot: 0
    });
  });
  placeSaws(g, 0);
  return g;
}

export function stepGame(g, dt) {
  if (g.state !== 'playing') return;
  var S = g.squares, i, j, s;
  if (!g.over) g.time += dt;
  placeSaws(g, dt);

  for (i = g.fuses.length - 1; i >= 0; i--) {
    var f = g.fuses[i]; f.t -= dt;
    if (f.t <= 0) { g.fuses.splice(i, 1); explode(g, f.x, f.y); }
  }

  for (i = 0; i < S.length; i++) {
    s = S[i];
    if (s.dead) continue;
    if (s.inv > 0) s.inv = Math.max(0, s.inv - dt);
    if (s.ice > 0) s.ice = Math.max(0, s.ice - dt);
    if (s.boost > 0) s.boost = Math.max(0, s.boost - dt);
    if (s.stag > 0) s.stag = Math.max(0, s.stag - dt);
    if (s.tink > 0) s.tink -= dt;
    if (s.stun > 0) { s.stun = Math.max(0, s.stun - dt); continue; }
    var sp = s.speed * (s.boost > 0 ? BOOST_MULT : 1);
    /* a rival holding the heat ring speeds up over time, so the round always ends */
    if (s.heat && !s.isPlayer) sp *= Math.min(HEAT_TOP, 1 + s.heat.t * HEAT_RAMP);
    var dx = s.ux * sp * dt, dy = s.uy * sp * dt, hit = false;
    if (moveAxis(g, s, 0, dx, false)) { s.ux = dx > 0 ? -Math.abs(s.ux) : Math.abs(s.ux); hit = true; }
    if (!s.dead && moveAxis(g, s, 1, dy, false)) { s.uy = dy > 0 ? -Math.abs(s.uy) : Math.abs(s.uy); hit = true; }
    if (hit) {
      if (!s.isPlayer) rejit(g, s);
      g.events.push({ type: 'bounce', s: s });
    }
    if (s.dead) continue;
    var c = tileAt(g, Math.floor(s.x), Math.floor(s.y));
    if (c === '+') { if (s.boost <= 0) g.events.push({ type: 'boost', s: s }); s.boost = BOOST_TIME; }
    else if (c === 'F' && g.mode === 'race') {
      if (g.noEnd) { s.finT = g.time; s.dead = true; }
      else if (!g.over) { g.over = { win: s.isPlayer, reason: 'finish', who: s }; g.events.push({ type: 'finish', s: s }); }
    }
  }

  /* square vs square */
  for (i = 0; i < S.length; i++) {
    var a = S[i]; if (a.dead) continue;
    for (j = i + 1; j < S.length; j++) {
      var b = S[j]; if (b.dead) continue;
      var ddx = b.x - a.x, ddy = b.y - a.y;
      var px = SQ - Math.abs(ddx), py = SQ - Math.abs(ddy);
      if (px <= 0 || py <= 0) continue;
      var axis = px < py ? 0 : 1, pen = axis === 0 ? px : py;
      var sgn = (axis === 0 ? ddx : ddy) >= 0 ? 1 : -1;
      var approaching = axis === 0 ? (a.ux * sgn > 0 || b.ux * sgn < 0) : (a.uy * sgn > 0 || b.uy * sgn < 0);
      if (g.mode === 'battle' && !g.level.gun && approaching && (a.isPlayer || b.isPlayer)) {
        var m = Math.hypot(ddx, ddy) || 1, nx = ddx / m, ny = ddy / m;
        var ca = a.ux * nx + a.uy * ny, cb = -(b.ux * nx + b.uy * ny);
        var win = ca - cb > CLASH_EDGE ? a : (cb - ca > CLASH_EDGE ? b : null), lose = win === a ? b : a;
        if (win) {
          if (hurt(g, lose, 'ram')) { g.events.push({ type: 'ram', by: win, on: lose }); if (win.isPlayer) lose.inv = 0.6; }
          if (win.isPlayer) lose.stag = STAG_TIME;
        } else {
          (a.isPlayer ? b : a).stag = STAG_TIME;
          g.events.push({ type: 'clash', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        }
      } else if (approaching) {
        g.events.push({ type: 'bump', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, a: a, b: b });
      }
      moveAxis(g, a, axis, -sgn * (pen / 2 + 0.002), true);
      moveAxis(g, b, axis, sgn * (pen / 2 + 0.002), true);
      if (axis === 0) { a.ux = -sgn * Math.abs(a.ux); b.ux = sgn * Math.abs(b.ux); }
      else { a.uy = -sgn * Math.abs(a.uy); b.uy = sgn * Math.abs(b.uy); }
    }
  }

  /* saws */
  for (i = 0; i < g.saws.length; i++) {
    var w = g.saws[i];
    for (j = 0; j < S.length; j++) {
      s = S[j]; if (s.dead) continue;
      var qx = Math.max(s.x - HALF, Math.min(w.x, s.x + HALF));
      var qy = Math.max(s.y - HALF, Math.min(w.y, s.y + HALF));
      if ((qx - w.x) * (qx - w.x) + (qy - w.y) * (qy - w.y) < w.r * w.r * 0.85) {
        if (hurt(g, s, 'saw') && g.mode === 'battle') knock(g, s, w.x, w.y);
      }
    }
  }

  if (g.boss) stepBoss(g, dt);
  if (g.shards.length) stepShards(g, dt);
  if (g.sparks.length) stepSparks(g, dt);
  if (g.heats.length) stepHeats(g, dt);
  if (g.guns.length) stepGuns(g, dt);
  if (g.bullets.length) stepBullets(g, dt);

  if (!g.over && !g.noEnd) {
    if (S[0].dead) g.over = S[0].outBy ? { win: false, reason: 'boss', how: S[0].outBy } : S[0].burnedBy ? { win: false, reason: 'burn', who: S[0].burnedBy } : { win: false, reason: 'dead' };
    else if (g.mode === 'battle' && !g.level.duel) {
      var left = 0;
      for (i = 1; i < S.length; i++) if (!S[i].dead) left++;
      if (!left) g.over = { win: true, reason: 'cleared' };
    }
  }
}
