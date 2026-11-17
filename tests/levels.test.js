/* Static checks on every level in src/levels. Run: npm test
   These catch typos in a new or edited map before you ever load the game. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels/index.js';
import { validateLevel } from '../scripts/lib/validate-level.js';
import { reach } from '../scripts/lib/reach.js';


test('there is at least one level and names are unique', () => {
  assert.ok(LEVELS.length > 0);
  const names = LEVELS.map((L) => L.name);
  assert.equal(new Set(names).size, names.length, 'duplicate level name');
});

LEVELS.forEach((L, i) => {
  test(`level ${i + 1} (${L.name})`, () => {
    assert.deepEqual(validateLevel(L), [], 'problems in the level file');
    const r = reach(L);
    if (L.mode === 'race') assert.equal(r.finish, true, 'the player cannot reach the finish (a 1.3-wide square needs 2-tile openings)');
    assert.deepEqual(r.starsMissed, [], 'stars the player cannot reach');
    assert.deepEqual(r.bubblesMissed, [], 'bubbles the player cannot reach');
  });
});
