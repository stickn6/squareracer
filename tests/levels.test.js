/* Static checks on every level in src/levels. Run: npm test
   These catch typos in a new or edited map before you ever load the game. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels/index.js';

const TILES = new Set('# FAV<>CT+durlGH1234567'.split(''));
const BOSS_TYPES = new Set(['volt', 'frost', 'cop']);
const num = (v) => typeof v === 'number' && Number.isFinite(v);

test('there is at least one level and names are unique', () => {
  assert.ok(LEVELS.length > 0);
  const names = LEVELS.map((L) => L.name);
  assert.equal(new Set(names).size, names.length, 'duplicate level name');
});

LEVELS.forEach((L, i) => {
  const label = `level ${i + 1} (${L.name})`;
  test(label, () => {
    assert.equal(typeof L.name, 'string', 'name');
    assert.equal(typeof L.tip, 'string', 'tip');
    assert.ok(L.mode === 'race' || L.mode === 'battle', `mode must be 'race' or 'battle', got ${L.mode}`);
    assert.ok(num(L.aiSpeed) && (L.aiSpeed > 0 || (L.duel && L.aiSpeed === 0)), 'aiSpeed (0 only in duels, which have no rivals)');
    assert.ok(Array.isArray(L.pdir) && L.pdir.length === 2 && Math.hypot(L.pdir[0], L.pdir[1]) > 0, 'pdir');

    /* map: rectangular, known tiles, fits the 20x30 menu thumbnail, walled in */
    const H = L.map.length, W = L.map[0].length;
    assert.ok(W <= 20 && H <= 30, `map is ${W}x${H}; the menu thumbnail fits at most 20x30`);
    L.map.forEach((row, y) => {
      assert.equal(row.length, W, `row ${y} is ${row.length} wide, expected ${W}`);
      for (const ch of row) assert.ok(TILES.has(ch), `unknown tile '${ch}' in row ${y}`);
    });
    for (let x = 0; x < W; x++) assert.ok(L.map[0][x] === '#' && L.map[H - 1][x] === '#', `outer wall has a gap at column ${x}`);
    for (let y = 0; y < H; y++) assert.ok(L.map[y][0] === '#' && L.map[y][W - 1] === '#', `outer wall has a gap at row ${y}`);

    /* spawns: exactly one of each digit, 1 (the player) present, numbered without gaps */
    const all = L.map.join('');
    const digits = [...all].filter((c) => c >= '1' && c <= '7').sort();
    assert.equal(new Set(digits).size, digits.length, 'a spawn digit appears twice');
    digits.forEach((d, k) => assert.equal(d, String(k + 1), 'spawn digits must run 1, 2, 3 ... without gaps'));
    assert.ok(digits.length >= (L.duel ? 1 : 2), 'needs the player and at least one rival');

    if (L.mode === 'race') assert.ok(all.includes('F'), 'a race needs a finish zone (F)');
    if (L.gun) assert.ok(all.includes('G'), 'gun rounds need a G tile');
    if (L.heat) assert.ok(all.includes('H') || (L.flames && L.flames.length), 'heat rounds need an H tile or flames');
    if (L.mode === 'battle' && !L.duel) assert.ok(num(L.enemyHp) || L.enemyHp === undefined);

    const inside = (x, y) => num(x) && num(y) && x >= 0 && y >= 0 && x <= W && y <= H;
    (L.saws || []).forEach((w, k) => {
      assert.ok(w.length >= 5 && inside(w[0], w[1]) && inside(w[2], w[3]) && num(w[4]), `saw ${k} must be [x1, y1, x2, y2, speed, radius?, phase?] inside the map`);
    });
    (L.flames || []).forEach((f, k) => {
      assert.ok(f.length === 5 && inside(f[0], f[1]) && inside(f[2], f[3]) && num(f[4]), `flame ${k} must be [x1, y1, x2, y2, speed] inside the map`);
    });

    if (L.boss) {
      const b = L.boss;
      assert.ok(BOSS_TYPES.has(b.type), `boss.type must be volt, frost or cop, got ${b.type}`);
      assert.equal(typeof b.name, 'string', 'boss.name');
      assert.ok(inside(b.x, b.y), 'boss x/y inside the map');
      assert.ok(Array.isArray(b.zone) && b.zone.length === 4 && b.zone[0] < b.zone[2] && b.zone[1] < b.zone[3], 'boss.zone is [left, top, right, bottom]');
      assert.ok(inside(b.zone[0], b.zone[1]) && inside(b.zone[2], b.zone[3]), 'boss.zone inside the map');
      if (b.path) assert.ok(b.path.length === 4 && inside(b.path[0], b.path[1]) && inside(b.path[2], b.path[3]), 'boss.path is [x1, y1, x2, y2]');
      if (b.patrol) assert.ok(b.patrol.length === 2 && b.patrol[0] <= b.patrol[1], 'boss.patrol is [xFrom, xTo]');
      if (L.duel) {
        assert.ok(b.duel, 'a duel level needs boss.duel = true');
        assert.equal(L.mode, 'battle', 'duels run in battle mode');
        assert.ok(num(b.hp) && b.hp > 0, 'duel boss needs hp');
        assert.ok(Array.isArray(b.spots) && b.spots.length >= 2, 'duel boss needs at least two spots to blink between');
        b.spots.forEach((s, k) => assert.ok((s.length === 2 || s.length === 4) && inside(s[0], s[1]), `spot ${k} is [x, y] or a track [x1, y1, x2, y2]`));
      }
    } else {
      assert.ok(!L.duel, 'duel set without a boss');
    }
  });
});
