/* Stars, bubble shields and portals, on tiny made-up maps. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, stepGame } from '../src/sim/game.js';
import { validateLevel } from '../scripts/lib/validate-level.js';

const STEP = 1 / 240;
function play(g, seconds, each) {
  g.state = 'playing';
  const seen = [];
  for (let n = 0; n < seconds / STEP && !g.over; n++) { stepGame(g, STEP); if (each) each(g); seen.push(...g.events.map((e) => e.type)); g.events.length = 0; }
  return seen;
}
const base = (map, extra) => Object.assign({ name: 'T', mode: 'race', aiSpeed: 0.01, pdir: [1, 0], tip: '', map }, extra);

test('the player collects stars it drives over; rivals do not', () => {
  const L = base([
    '############',
    '#          #',
    '# 1  *  * F#',
    '#          #',
    '#2         #',
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
  const ev = play(g, 0.6);
  assert.equal(p.shield, true, 'picked up the bubble');
  const ev2 = play(g, 1.0);
  assert.ok(ev2.includes('saved'), 'the shield popped on the spikes');
  assert.equal(p.shield, false);
  assert.equal(p.stun, 0, 'no stun while the shield took the hit');
  assert.ok(g.bubbles[0].cool > 0);
  assert.ok(!ev.includes('stun'));
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
