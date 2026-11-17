/* Can the player get there? A square is 1.3 tiles wide, so it needs a 2x2 opening: search over 2x2 blocks of open tiles.
   One-way gates only let you into their tile moving their way; portals jump to a block around the other end.
   Crates/TNT count as open (they break). Bosses, saws and rivals are ignored. This answers "is it possible", not "is it easy". */
/* crates and TNT break when hit, so only walls and spikes stop you for good */
const HARD = new Set(['#', 'A', 'V', '<', '>']);

const GATE = { r: [1, 0], l: [-1, 0], d: [0, 1], u: [0, -1] };

export function reach(L) {
  const H = L.map.length, W = L.map[0].length;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? '#' : L.map[y][x];
  const open = (x, y) => !HARD.has(at(x, y));
  const block = (x, y) => open(x, y) && open(x + 1, y) && open(x, y + 1) && open(x + 1, y + 1);
  const tilesOf = (x, y) => [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]];
  let sx = -1, sy = -1;
  L.map.forEach((row, y) => { const i = row.indexOf('1'); if (i >= 0) { sx = i; sy = y; } });
  const seen = new Set(), q = [];
  const push = (x, y) => { const k = x + ',' + y; if (!seen.has(k) && block(x, y)) { seen.add(k); q.push([x, y]); } };
  for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) push(sx + dx, sy + dy);
  const portals = L.portals || [];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!block(nx, ny)) continue;
      /* every tile newly entered must allow this direction */
      const fresh = tilesOf(nx, ny).filter(([tx, ty]) => !(tx >= x && tx <= x + 1 && ty >= y && ty <= y + 1));
      if (fresh.every(([tx, ty]) => { const g = GATE[at(tx, ty)]; return !g || (g[0] === dx && g[1] === dy); })) push(nx, ny);
    }
    for (const p of portals) for (const [ax, ay, bx, by] of [[p[0], p[1], p[2], p[3]], [p[2], p[3], p[0], p[1]]]) {
      if (ax >= x && ax <= x + 1 && ay >= y && ay <= y + 1) for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) push(bx + dx, by + dy);
    }
  }
  const touched = new Set();
  for (const k of seen) { const [x, y] = k.split(',').map(Number); for (const [tx, ty] of tilesOf(x, y)) touched.add(tx + ',' + ty); }
  const find = (ch) => { const out = []; L.map.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) out.push([x, y]); })); return out; };
  const stars = find('*'), bubbles = find('B'), finish = find('F');
  return {
    finish: finish.length ? finish.some(([x, y]) => touched.has(x + ',' + y)) : null,
    starsMissed: stars.filter(([x, y]) => !touched.has(x + ',' + y)),
    bubblesMissed: bubbles.filter(([x, y]) => !touched.has(x + ',' + y)),
    starsTotal: stars.length, bubblesTotal: bubbles.length,
    /* shortest walk to the finish, in tiles, as a rough "how long for a perfect player" */
    pathToFinish: shortest(L, block, at, sx, sy, finish)
  };
}

function shortest(L, block, at, sx, sy, finish) {
  if (!finish.length) return null;
  const fin = new Set(finish.map(([x, y]) => x + ',' + y));
  const dist = new Map(), q = [];
  for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) if (block(sx + dx, sy + dy)) { dist.set((sx + dx) + ',' + (sy + dy), 0); q.push([sx + dx, sy + dy]); }
  while (q.length) {
    const [x, y] = q.shift(), d = dist.get(x + ',' + y);
    if ([[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]].some(([tx, ty]) => fin.has(tx + ',' + ty))) return d;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (x + dx) + ',' + (y + dy);
      if (!dist.has(k) && block(x + dx, y + dy)) { dist.set(k, d + 1); q.push([x + dx, y + dy]); }
    }
    for (const p of L.portals || []) for (const [ax, ay, bx, by] of [[p[0], p[1], p[2], p[3]], [p[2], p[3], p[0], p[1]]]) {
      if (ax >= x && ax <= x + 1 && ay >= y && ay <= y + 1) {
        const k = (bx - 1) + ',' + (by - 1);
        if (!dist.has(k) && block(bx - 1, by - 1)) { dist.set(k, d + 1); q.push([bx - 1, by - 1]); }
      }
    }
  }
  return null;
}
