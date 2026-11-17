/* Stars, bubble shields and portals, on tiny made-up maps. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, stepGame } from '../src/sim/game.js';
import { validateLevel } from '../scripts/lib/validate-level.js';
import { reach, routeToFinish } from '../scripts/lib/reach.js';

const STEP = 1 / 240;
function play(g, seconds, each) {
  g.state = 'playing';
  const seen = [];
  for (let n = 0; n < seconds / STEP && !g.over; n++) { stepGame(g, STEP); if (each) each(g); seen.push(...g.events.map((e) => e.type)); g.events.length = 0; }
  return seen;
}
const base = (map, extra) => Object.assign({ name: 'T', mode: 'race', aiSpeed: 0.01, pdir: [1, 0], tip: '', map }, extra);

test('the player collects stars it drives over', () => {
  const L = base([
    '############',
    '#          #',
    '# 1  *  * F#',
    '#          #',
    '#  2       #',
    '#          #',
    '############'
  ]);
  assert.deepEqual(validateLevel(L), []);
  const g = makeGame(L, { seed: 1 });
  assert.equal(g.stars.total, 2);
  const ev = play(g, 3);
  assert.equal(g.stars.got, 2);
  assert.equal(ev.filter((t) => t === 'star').length, 2);
  assert.ok(g.over && g.over.win);
});

test('rivals drive over stars without taking them', () => {
  const L = base([
    '############',
    '#          #',
    '#  2 * * * #',
    '#          #',
    '#  1      F#',
    '#          #',
    '############'
  ], { aiSpeed: 6 });
  const g = makeGame(L, { seed: 1, noPlayer: true, noEnd: true });
  const r = g.squares[1];
  r.ux = 1; r.uy = 0; /* drive the rival straight along the star row */
  play(g, 1.2);
  assert.ok(r.x > 8, 'the rival crossed the star row');
  assert.equal(g.stars.got, 0);
  assert.equal(g.grid[2].join('').split('*').length - 1, 3, 'all three stars still there');
});

test('stars touched after the round is decided do not count', () => {
  const L = base(['##########', '#        #', '# 1   F* #', '#        #', '# 2      #', '#        #', '##########']);
  const g = makeGame(L, { seed: 1 });
  play(g, 2);
  assert.ok(g.over && g.over.win);
  g.state = 'playing';
  const p = g.squares[0]; p.x = 7.5; p.y = 2.5;
  stepGame(g, STEP);
  assert.equal(g.stars.got, 0);
});

test('a bubble shield saves the player from a spike stun once, then grows back', () => {
  const L = base([
    '############',
    '#          #',
    '# 1 B   > >#',
    '#          #',
    '#2        F#',
    '############'
  ]);
  const g = makeGame(L, { seed: 1 });
  const p = g.squares[0];
  play(g, 0.4);
  assert.equal(p.shield, true, 'picked up the bubble');
  const ev2 = play(g, 0.6);
  assert.ok(ev2.includes('saved'), 'the shield popped on the spikes');
  assert.ok(!ev2.includes('stun'), 'no stun while the shield took the hit');
  assert.equal(p.shield, false);
  assert.ok(g.bubbles[0].cool > 0, 'the bubble is growing back');
  /* after it grows back, driving over it again gives a new shield */
  p.stun = 0; p.ux = -1; p.uy = 0;
  const ev3 = play(g, 6, (gg) => { if (gg.squares[0].x < 3) { gg.squares[0].ux = 1; } });
  assert.ok(ev3.includes('bubble'), 'took the regrown bubble');
});

test('a bubble shield saves the player from a boss knockout', async () => {
  const { knockOut } = await import('../src/sim/boss.js');
  const L = base(['######', '#1  F#', '#   2#', '######']);
  const g = makeGame(L, { seed: 1 });
  const p = g.squares[0], b = { type: 'volt', x: 2, y: 2 };
  p.shield = true;
  assert.equal(knockOut(g, p, b), false);
  assert.equal(p.dead, false);
  assert.equal(knockOut(g, p, b), false, 'still safe right after the pop');
  p.safe = 0;
  assert.equal(knockOut(g, p, b), true);
  assert.equal(p.dead, true);
});

test('portals move squares to the other end, keep their heading, and do not bounce back', () => {
  const L = base([
    '##############',
    '#            #',
    '#   1        #',
    '#            #',
    '#            #',
    '#            #',
    '#        2  F#',
    '#            #',
    '##############'
  ], { portals: [[7, 2, 3, 6]] });
  assert.deepEqual(validateLevel(L), []);
  const g = makeGame(L, { seed: 1 });
  const p = g.squares[0];
  let warps = 0;
  play(g, 0.6, (gg) => { warps += gg.events.filter((e) => e.type === 'warp' && e.s === p).length; });
  assert.equal(warps, 1);
  assert.ok(p.y > 5 && p.y < 7, 'landed on the bottom end');
  assert.ok(p.ux > 0.99, 'still heading right');
});

test('portal ends need open floor around them', () => {
  const L = base(['########', '#1     #', '#  #  F#', '#2     #', '########'], { portals: [[2, 2, 5, 2]] });
  assert.ok(validateLevel(L).some((e) => e.includes('open floor')));
});

test('portal ends must be 2+ tiles apart', () => {
  const L = base(['############', '#          #', '#          #', '#  1     F #', '#          #', '#  2       #', '#          #', '############'], { portals: [[5, 2, 6, 2]] });
  assert.ok(validateLevel(L).some((e) => e.includes('too close')));
});

test('spawns need a clear tile all round', () => {
  const L = base(['########', '#      #', '#  #   #', '#  1 F #', '#      #', '# 2    #', '########']);
  assert.ok(validateLevel(L).some((e) => e.includes('spawn 1')));
  const diag = base(['########', '#      #', '#   #  #', '#  1 F #', '#      #', '# 2    #', '########']);
  assert.ok(validateLevel(diag).some((e) => e.includes('spawn 1')), 'a diagonal neighbour counts too');
});

test('reach: one-way gates block only their own axis', () => {
  /* the only way down is through a pair of 'r' gates: moving down through them is allowed */
  const down = base([
    '########',
    '#      #',
    '#  1   #',
    '#      #',
    '###rr###',
    '###rr###',
    '#      #',
    '#FFFFFF#',
    '########'
  ]);
  /* the only way left is through 'r' gates, which only open to the right */
  const left = base([
    '##########',
    '#   ##   #',
    '#FF rr 1 #',
    '#FF rr   #',
    '#   ##   #',
    '##########'
  ]);
  const right = base(['##########', '#   ##   #', '# 1 rr FF#', '#   rr FF#', '#   ##   #', '##########']);
  assert.equal(reach(down).finish, true);
  assert.equal(reach(left).finish, false);
  assert.equal(reach(right).finish, true);
});

test('reach and the bot route both use portals', () => {
  const L = base([
    '##############',
    '#      #     #',
    '#  1   #     #',
    '#      #  F  #',
    '#      #     #',
    '##############'
  ], { portals: [[4, 3, 10, 2]] });
  assert.equal(reach(L).finish, true);
  const pts = routeToFinish(L, 3, 2, false);
  assert.ok(pts && pts.some((q) => q.portal), 'route goes through the portal');
});

test('bot route: a block reached on foot and by a portal jump keeps both states', () => {
  /* the only way to the finish is: drive onto the swirl at (11,4), come out at (3,20), step off, drive back on,
     come out at (11,4) free to move, then go right. Walking onto (11,4) first must not hide that later state. */
  const map = [
    '####################', '#     ####         #', '# 1   ####         #', '#                  #', '#                  #',
    '#     ####       F #', '#     ####       F #', '#     ####         #', '#     ####         #', '#     ##############',
    '#     ##############', '#     ##############', '#  2  ##############', '#     ##############', '#     ##############',
    '#     ##############', '#     ##############', '#     ##############', '#     ##############', '#     ##############',
    '#     ##############', '#     ##############', '#     ##############', '####################'
  ];
  const L = base(map, { portals: [[3, 20, 11, 4]] });
  assert.deepEqual(validateLevel(L), []);
  assert.ok(routeToFinish(L, 2, 2, false), 'the forced route still finds a way');
});

test('a square that bounces back onto a portal exit right away does not jump again', () => {
  const L = base([
    '############',
    '#          #',
    '#  1       #',
    '#          #',
    '#          #',
    '#          #',
    '#  2     F #',
    '#          #',
    '############'
  ], { portals: [[6, 2, 2, 5]] });
  const g = makeGame(L, { seed: 1 });
  const p = g.squares[0];
  let warps = 0;
  /* drive right into the swirl at (6,2); it comes out at (2,5) heading right; then force it straight back left */
  play(g, 0.6, (gg) => { if (gg.events.some((e) => e.type === 'warp' && e.s === p)) { warps++; p.ux = -1; p.uy = 0; } });
  assert.equal(warps, 1, 'only the first jump');
});
