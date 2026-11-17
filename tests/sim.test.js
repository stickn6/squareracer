/* Headless simulation checks: the game rules run in Node with no DOM.
   Every level is played by AI squares for a while to catch crashes, NaNs and squares escaping into walls. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels/index.js';
import { makeGame, stepGame } from '../src/sim/game.js';
import { tileAt } from '../src/sim/world.js';
import { HALF } from '../src/sim/constants.js';

const STEP = 1 / 240;
const SOLID = new Set(['#', 'A', 'V', '<', '>', 'C', 'T']);

function run(L, opts, seconds) {
  const g = makeGame(L, opts);
  g.state = 'playing';
  const n = Math.round(seconds / STEP);
  for (let i = 0; i < n && !g.over; i++) { stepGame(g, STEP); g.events.length = 0; }
  return g;
}

/* the centre of a live square must never sit inside a solid tile */
function assertSane(g, label) {
  for (const s of g.squares) {
    assert.ok(Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.ux) && Number.isFinite(s.uy), `${label}: square ${s.id} has a non-finite position or heading`);
    if (s.dead) continue;
    assert.ok(s.x >= HALF - 1e-6 && s.y >= HALF - 1e-6 && s.x <= g.W - HALF + 1e-6 && s.y <= g.H - HALF + 1e-6, `${label}: square ${s.id} left the map`);
    assert.ok(!SOLID.has(tileAt(g, Math.floor(s.x), Math.floor(s.y))), `${label}: square ${s.id} is inside a solid tile at ${s.x.toFixed(2)}, ${s.y.toFixed(2)}`);
  }
}

LEVELS.forEach((L, i) => {
  test(`level ${i + 1} (${L.name}) runs 40 s with all-AI squares`, () => {
    for (const seed of [1, 2, 3]) {
      const g = run(L, { seed, allAI: true, noEnd: true }, 40);
      assertSane(g, `seed ${seed}`);
      assert.ok(g.time > 0);
    }
  });
});

test('same seed, same game', () => {
  for (const L of LEVELS) {
    const a = run(L, { seed: 42, allAI: true, noEnd: true }, 8);
    const b = run(L, { seed: 42, allAI: true, noEnd: true }, 8);
    assert.deepEqual(a.squares.map((s) => [s.x, s.y, s.hp, s.dead]), b.squares.map((s) => [s.x, s.y, s.hp, s.dead]), L.name);
  }
});

test('a player who does nothing still gets a result in a race', () => {
  const L = LEVELS.find((l) => l.mode === 'race' && !l.boss);
  const g = run(L, { seed: 7 }, 120);
  assert.ok(g.over, 'race should end when a rival finishes');
});

test('battle lives option applies to the player only', () => {
  const L = LEVELS.find((l) => l.mode === 'battle' && !l.duel);
  const g = makeGame(L, { seed: 1, playerHp: 17 });
  assert.equal(g.squares[0].hp, 17);
  assert.equal(g.squares[1].hp, L.enemyHp || 3);
});
