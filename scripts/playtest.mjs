/* Playtest one or more level files without adding them to the game.
     node scripts/playtest.mjs src/levels/35-snow-stars.js [more files] [--shot] [--seeds 30]
   Prints: rule problems, what the player can reach, how fast rivals finish, and how a naive bot does
   (it follows the shortest path to the finish and never waits for the boss, roughly how a small child plays).
   --shot also saves a PNG of the level in the real game to playtest-<name>.png in the working directory. */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { validateLevel } from './lib/validate-level.js';
import { reach, routeToFinish } from './lib/reach.js';
import { makeGame, stepGame } from '../src/sim/game.js';
import { PLAYER_SPEED } from '../src/sim/constants.js';

const args = process.argv.slice(2);
const files = args.filter((a) => a.endsWith('.js'));
const shot = args.includes('--shot');
const seedsArg = args.indexOf('--seeds');
const SEEDS = seedsArg >= 0 ? Number(args[seedsArg + 1]) : 30;
if (!Number.isInteger(SEEDS) || SEEDS <= 0 || SEEDS > 1000) { console.error('--seeds needs a whole number from 1 to 1000'); process.exit(1); }
const STEP = 1 / 240;
if (!files.length) { console.error('usage: node scripts/playtest.mjs <level file>... [--shot] [--seeds N]'); process.exit(1); }

const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const f1 = (v) => v == null ? '-' : v.toFixed(1);

function botRun(L, seed) {
  const g = makeGame(L, { seed }); g.state = 'playing';
  const p = g.squares[0];
  let pts = routeToFinish(L, Math.floor(p.x), Math.floor(p.y), false), i = 0;
  if (!pts) return null;
  for (let n = 0; n < 240 * 120 && !g.over; n++) {
    /* after any portal jump (planned or not), plan again from where the square came out */
    if (g.events.some((e) => e.type === 'warp' && e.s === p)) {
      pts = routeToFinish(L, Math.floor(p.x), Math.floor(p.y), true) || pts; i = 0;
    }
    g.events.length = 0;
    while (i < pts.length - 1 && Math.hypot(pts[i].x - p.x, pts[i].y - p.y) < 0.45) i++;
    const t = pts[i], dx = t.x - p.x, dy = t.y - p.y, m = Math.hypot(dx, dy);
    if (m > 1e-3 && !p.dead) { p.ux = dx / m; p.uy = dy / m; }
    stepGame(g, STEP);
  }
  return { win: !!(g.over && g.over.win), reason: g.over ? g.over.reason : 'timeout', time: g.time, stars: g.stars.got };
}

/* a naive duel player: aim at the boss (the heat ring burns him on contact), steer around nothing, never dodge */
function duelBot(L, seed) {
  const g = makeGame(L, { seed, playerHp: 3 }); g.state = 'playing';
  const p = g.squares[0];
  for (let n = 0; n < 240 * 120 && !g.over; n++) {
    const b = g.boss, dx = b.x - p.x, dy = b.y - p.y, m = Math.hypot(dx, dy);
    /* wobble a little so it does not get stuck pressing into a pillar */
    const w = Math.sin(n / 240 * 2.1 + seed) * 0.5;
    if (m > 1e-3 && !p.dead) { const ux = dx / m, uy = dy / m; p.ux = ux * Math.cos(w) - uy * Math.sin(w); p.uy = ux * Math.sin(w) + uy * Math.cos(w); }
    stepGame(g, STEP); g.events.length = 0;
  }
  return { win: !!(g.over && g.over.win), reason: g.over ? g.over.reason : 'timeout', time: g.time, hp: p.hp };
}

function rivalsOnly(L, seed) {
  const g = makeGame(L, { seed, noPlayer: true, noEnd: true }); g.state = 'playing';
  for (let n = 0; n < 240 * 90; n++) { stepGame(g, STEP); g.events.length = 0; if (g.squares.slice(1).every((s) => s.dead)) break; }
  const rivals = g.squares.slice(1);
  const fins = rivals.filter((s) => s.finT >= 0).map((s) => s.finT);
  return { first: fins.length ? Math.min(...fins) : null, out: rivals.filter((s) => s.outBy).length, n: rivals.length };
}

for (const file of files) {
  const L = (await import(pathToFileURL(path.resolve(file)).href)).default;
  console.log(`\n=== ${L.name}  (${file})`);
  const errs = validateLevel(L);
  console.log(errs.length ? 'PROBLEMS:\n  - ' + errs.join('\n  - ') : 'rules: ok');
  if (errs.length) continue;
  const r = reach(L);
  console.log(`reach: finish ${r.finish === null ? 'n/a' : r.finish ? 'yes' : 'NO'} · stars ${r.starsTotal - r.starsMissed.length}/${r.starsTotal} · bubbles ${r.bubblesTotal - r.bubblesMissed.length}/${r.bubblesTotal}` +
    (r.starsMissed.length ? ` · unreachable stars at ${JSON.stringify(r.starsMissed)}` : ''));
  if (L.mode === 'race') {
    const rv = Array.from({ length: SEEDS }, (_, k) => rivalsOnly(L, k + 1));
    const firsts = rv.map((x) => x.first).filter((x) => x != null);
    const outs = rv.reduce((a, x) => a + x.out, 0), total = rv.reduce((a, x) => a + x.n, 0);
    console.log(`perfect player: ~${f1(r.pathToFinish / PLAYER_SPEED)} s of straight driving (${r.pathToFinish} tiles)`);
    console.log(`rivals alone: first rival home median ${f1(median(firsts))} s (of runs where one finished) (fastest ${f1(firsts.length ? Math.min(...firsts) : null)} s); ${firsts.length}/${SEEDS} runs had a rival finish; boss knocked out ${outs}/${total} rivals`);
    const bots = Array.from({ length: SEEDS }, (_, k) => botRun(L, k + 101)).filter(Boolean);
    const wins = bots.filter((b) => b.win), why = {};
    bots.filter((b) => !b.win).forEach((b) => { why[b.reason] = (why[b.reason] || 0) + 1; });
    console.log(`naive bot (never waits): wins ${wins.length}/${bots.length}, median win time ${f1(median(wins.map((b) => b.time)))} s, losses ${JSON.stringify(why)}`);
  } else if (L.duel) {
    console.log(`duel vs ${L.boss.name}: boss hp ${L.boss.hp}; player lives default 3 (menu slider)`);
    const bots = Array.from({ length: SEEDS }, (_, k) => duelBot(L, k + 101));
    const wins = bots.filter((b) => b.win);
    console.log(`naive duel bot (drives straight at the boss, never dodges): wins ${wins.length}/${bots.length}, median win time ${f1(median(wins.map((b) => b.time)))} s, median lives left on a win ${f1(median(wins.map((b) => b.hp)))}, timeouts ${bots.filter((b) => b.reason === 'timeout').length}`);
  } else {
    console.log('battle level: no race metrics');
  }
}

if (shot) {
  const { context } = await import('esbuild');
  let chromium;
  try { ({ chromium } = await import('playwright')); } catch (e) {
    try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch (e2) {
      console.error('--shot needs Playwright: npm i -D playwright && npx playwright install chromium'); process.exit(1);
    }
  }
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const ctx = await context({});
  const { port } = await ctx.serve({ servedir: root, port: 0 });
  const browser = await chromium.launch();
  for (const file of files) {
    const page = await browser.newPage({ viewport: { width: 430, height: 880 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://localhost:${port}/`);
    const rel = '/' + path.relative(root, path.resolve(file)).split(path.sep).join('/');
    await page.evaluate(async (rel) => {
      const L = (await import(rel)).default;
      const { LEVELS } = await import('/src/levels/index.js');
      const { startLevel, begin } = await import('/src/ui/play.js');
      LEVELS.push(L); startLevel(LEVELS.length - 1); begin();
    }, rel);
    await page.waitForTimeout(1500);
    const out = `playtest-${path.basename(file, '.js')}.png`;
    await page.screenshot({ path: out });
    console.log(`screenshot: ${out}${errors.length ? '  PAGE ERRORS: ' + errors.join(' | ') : ''}`);
    await page.close();
  }
  await browser.close(); await ctx.dispose();
}
