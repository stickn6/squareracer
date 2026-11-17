/* Rules every level must follow. Returns a list of problems ([] = fine). Used by tests/levels.test.js and scripts/playtest.mjs. */
export const TILES = new Set('# FAV<>CT+durlGHB*1234567'.split(''));
export const SOLID = new Set(['#', 'A', 'V', '<', '>', 'C', 'T']);
const BOSS_TYPES = new Set(['volt', 'frost', 'cop']);
const num = (v) => typeof v === 'number' && Number.isFinite(v);

export function validateLevel(L) {
  const errs = [];
  const check = (ok, msg) => { if (!ok) errs.push(msg); return ok; };
  check(typeof L.name === 'string' && L.name.length > 0, 'name');
  check(typeof L.tip === 'string', 'tip');
  check(L.mode === 'race' || L.mode === 'battle', `mode must be 'race' or 'battle', got ${L.mode}`);
  check(num(L.aiSpeed) && (L.aiSpeed > 0 || (L.duel && L.aiSpeed === 0)), 'aiSpeed (0 only in duels, which have no rivals)');
  check(Array.isArray(L.pdir) && L.pdir.length === 2 && Math.hypot(L.pdir[0], L.pdir[1]) > 0, 'pdir');
  if (!check(Array.isArray(L.map) && L.map.length > 2, 'map')) return errs;

  /* map: rectangular, known tiles, fits the 20x30 menu thumbnail, walled in */
  const H = L.map.length, W = L.map[0].length;
  check(W <= 20 && H <= 30, `map is ${W}x${H}; the menu thumbnail fits at most 20x30`);
  L.map.forEach((row, y) => {
    check(row.length === W, `row ${y} is ${row.length} wide, expected ${W}`);
    for (const ch of row) check(TILES.has(ch), `unknown tile '${ch}' in row ${y}`);
  });
  for (let x = 0; x < W; x++) check(L.map[0][x] === '#' && L.map[H - 1][x] === '#', `outer wall has a gap at column ${x}`);
  for (let y = 0; y < H; y++) check(L.map[y][0] === '#' && L.map[y][W - 1] === '#', `outer wall has a gap at row ${y}`);
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? '#' : L.map[y][x];

  /* spawns: exactly one of each digit, 1 (the player) present, numbered without gaps */
  const all = L.map.join('');
  const digits = [...all].filter((c) => c >= '1' && c <= '7').sort();
  check(new Set(digits).size === digits.length, 'a spawn digit appears twice');
  digits.forEach((d, k) => check(d === String(k + 1), 'spawn digits must run 1, 2, 3 ... without gaps'));
  check(digits.length >= (L.duel ? 1 : 2), 'needs the player and at least one rival');

  if (L.mode === 'race') check(all.includes('F'), 'a race needs a finish zone (F)');
  if (L.gun) check(all.includes('G'), 'gun rounds need a G tile');
  if (L.heat) check(all.includes('H') || (L.flames && L.flames.length), 'heat rounds need an H tile or flames');

  const inside = (x, y) => num(x) && num(y) && x >= 0 && y >= 0 && x <= W && y <= H;
  (L.saws || []).forEach((w, k) => {
    check(w.length >= 5 && inside(w[0], w[1]) && inside(w[2], w[3]) && num(w[4]), `saw ${k} must be [x1, y1, x2, y2, speed, radius?, phase?] inside the map`);
  });
  (L.flames || []).forEach((f, k) => {
    check(f.length === 5 && inside(f[0], f[1]) && inside(f[2], f[3]) && num(f[4]), `flame ${k} must be [x1, y1, x2, y2, speed] inside the map`);
  });

  /* portals: [ax, ay, bx, by] tile column/row of each end. A square lands centred on the far end, and it is wider than
     one tile, so each end and all 8 tiles around it must be open floor (or a star / finish). Ends must not be shared. */
  const ends = new Set();
  (L.portals || []).forEach((p, k) => {
    if (!check(Array.isArray(p) && p.length === 4 && p.every(Number.isInteger), `portal ${k} must be [ax, ay, bx, by] in whole tiles`)) return;
    for (const [x, y] of [[p[0], p[1]], [p[2], p[3]]]) {
      check(!ends.has(x + ',' + y), `portal ${k} reuses the tile ${x}, ${y}`); ends.add(x + ',' + y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const t = at(x + dx, y + dy);
        check(t === ' ' || t === '*' || t === 'F' || t === '+', `portal ${k} end ${x}, ${y} needs open floor around it; found '${t}' at ${x + dx}, ${y + dy}`);
      }
    }
  });

  if (L.boss) {
    const b = L.boss;
    check(BOSS_TYPES.has(b.type), `boss.type must be volt, frost or cop, got ${b.type}`);
    check(typeof b.name === 'string', 'boss.name');
    check(inside(b.x, b.y), 'boss x/y inside the map');
    if (check(Array.isArray(b.zone) && b.zone.length === 4 && b.zone[0] < b.zone[2] && b.zone[1] < b.zone[3], 'boss.zone is [left, top, right, bottom]')) {
      check(inside(b.zone[0], b.zone[1]) && inside(b.zone[2], b.zone[3]), 'boss.zone inside the map');
    }
    if (b.path) check(b.path.length === 4 && inside(b.path[0], b.path[1]) && inside(b.path[2], b.path[3]), 'boss.path is [x1, y1, x2, y2]');
    if (b.patrol) check(b.patrol.length === 2 && b.patrol[0] <= b.patrol[1], 'boss.patrol is [xFrom, xTo]');
    if (L.duel) {
      check(b.duel, 'a duel level needs boss.duel = true');
      check(L.mode === 'battle', 'duels run in battle mode');
      check(num(b.hp) && b.hp > 0, 'duel boss needs hp');
      if (check(Array.isArray(b.spots) && b.spots.length >= 2, 'duel boss needs at least two spots to blink between')) {
        b.spots.forEach((s, k) => check((s.length === 2 || s.length === 4) && inside(s[0], s[1]), `spot ${k} is [x, y] or a track [x1, y1, x2, y2]`));
      }
    }
  } else {
    check(!L.duel, 'duel set without a boss');
  }
  return errs;
}
