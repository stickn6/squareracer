/* Can the player get there? A square is 1.3 tiles wide, so it needs a 2x2 opening: we search over 2x2 blocks of
   open tiles. A block's "centre" is the corner the four tiles share; its centre tile is the bottom-right one.
   - Crates/TNT count as open (they break). Bosses, saws and rivals are ignored.
   - One-way gates block only their own axis, like blocks() in src/sim/world.js: an 'r' tile stops moves to the
     left and allows up/down; a 'd' tile stops moves up and allows left/right.
   - Portals: from any block touching a portal end you may jump to the block centred on the other end.
     With { forced: true } (used by the playtest bot) a block whose centre tile is a portal end MUST jump, as a
     square driving through that point would, unless it just arrived there by a jump.
   This answers "is it possible", not "is it easy". */
const HARD = new Set(['#', 'A', 'V', '<', '>']);
const GATE = { r: [1, 0], l: [-1, 0], d: [0, 1], u: [0, -1] };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function world(L) {
  const H = L.map.length, W = L.map[0].length;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? '#' : L.map[y][x];
  const open = (x, y) => !HARD.has(at(x, y));
  const block = (x, y) => open(x, y) && open(x + 1, y) && open(x, y + 1) && open(x + 1, y + 1);
  const tilesOf = (x, y) => [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]];
  /* moving block (x, y) by (dx, dy): every newly entered tile must not be a gate facing the other way on that axis */
  const canStep = (x, y, dx, dy) => {
    const nx = x + dx, ny = y + dy;
    if (!block(nx, ny)) return false;
    return tilesOf(nx, ny).every(([tx, ty]) => {
      if (tx >= x && tx <= x + 1 && ty >= y && ty <= y + 1) return true;
      const g = GATE[at(tx, ty)];
      if (!g) return true;
      return g[0] !== 0 ? (dx === 0 || dx === g[0]) : (dy === 0 || dy === g[1]);
    });
  };
  const ends = [];
  (L.portals || []).forEach((p) => { ends.push([p[0], p[1], p[2], p[3]]); ends.push([p[2], p[3], p[0], p[1]]); });
  return { W, H, at, block, tilesOf, canStep, ends };
}

const key = (x, y) => x + ',' + y;

/* breadth-first search over blocks from the blocks around tile (tx, ty). Returns dist and prev maps keyed "x,y". */
export function search(L, tx, ty, { forced = false, startWarped = false } = {}) {
  const w = world(L);
  const dist = new Map(), prev = new Map(), warped = new Set(), q = [];
  for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
    const x = tx + dx, y = ty + dy, k = key(x, y);
    if (w.block(x, y) && !dist.has(k)) { dist.set(k, 0); prev.set(k, null); if (startWarped) warped.add(k); q.push([x, y]); }
  }
  while (q.length) {
    const [x, y] = q.shift(), k = key(x, y), d = dist.get(k);
    const next = [];
    const centreEnd = w.ends.find(([ax, ay]) => ax === x + 1 && ay === y + 1);
    if (forced && centreEnd && !warped.has(k)) {
      next.push([centreEnd[2] - 1, centreEnd[3] - 1, centreEnd]);
    } else {
      for (const [dx, dy] of DIRS) if (w.canStep(x, y, dx, dy)) next.push([x + dx, y + dy, null]);
      if (!forced) for (const e of w.ends) if (e[0] >= x && e[0] <= x + 1 && e[1] >= y && e[1] <= y + 1) next.push([e[2] - 1, e[3] - 1, e]);
    }
    for (const [nx, ny, via] of next) {
      const nk = key(nx, ny);
      if (dist.has(nk) || !w.block(nx, ny)) continue;
      dist.set(nk, d + 1); prev.set(nk, { from: k, via });
      if (via) warped.add(nk);
      q.push([nx, ny]);
    }
  }
  return { dist, prev, world: w };
}

export function reach(L) {
  const w = world(L);
  let sx = -1, sy = -1;
  L.map.forEach((row, y) => { const i = row.indexOf('1'); if (i >= 0) { sx = i; sy = y; } });
  const { dist } = search(L, sx, sy);
  const touched = new Set();
  let best = null;
  for (const [k, d] of dist) {
    const [x, y] = k.split(',').map(Number);
    for (const [tx, ty] of w.tilesOf(x, y)) {
      touched.add(key(tx, ty));
      if (w.at(tx, ty) === 'F' && (best === null || d < best)) best = d;
    }
  }
  const find = (ch) => { const out = []; L.map.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) out.push([x, y]); })); return out; };
  const stars = find('*'), bubbles = find('B'), finish = find('F');
  return {
    finish: finish.length ? finish.some(([x, y]) => touched.has(key(x, y))) : null,
    starsMissed: stars.filter(([x, y]) => !touched.has(key(x, y))),
    bubblesMissed: bubbles.filter(([x, y]) => !touched.has(key(x, y))),
    starsTotal: stars.length, bubblesTotal: bubbles.length,
    /* shortest walk to the finish, in tiles, as a rough "how long for a perfect player" */
    pathToFinish: best
  };
}

/* waypoints (block centres, plus each portal tile it drives into) for the shortest forced route from tile (tx, ty)
   to the finish. Used by the playtest bot. null when there is no route. */
export function routeToFinish(L, tx, ty, startWarped) {
  const { dist, prev, world: w } = search(L, tx, ty, { forced: true, startWarped });
  let end = null, bd = Infinity;
  for (const [k, d] of dist) {
    const [x, y] = k.split(',').map(Number);
    if (d < bd && w.tilesOf(x, y).some(([a, b]) => w.at(a, b) === 'F')) { bd = d; end = k; }
  }
  if (!end) return null;
  const pts = [];
  for (let k = end; k; ) {
    const [x, y] = k.split(',').map(Number), p = prev.get(k);
    pts.push({ x: x + 1, y: y + 1 });
    if (p && p.via) pts.push({ x: p.via[0] + 0.5, y: p.via[1] + 0.5, portal: true });
    k = p ? p.from : null;
  }
  return pts.reverse();
}
