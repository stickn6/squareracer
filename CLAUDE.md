# Square Scramble: notes for Claude Code

A browser game: steer one square through races, battles, gunfights, heat rounds, boss races and boss duels.
Plain JavaScript ES modules plus canvas 2D. There is no framework and no runtime dependencies. esbuild/eslint are dev-only.

## Commands
- `npm install`: once, installs esbuild + eslint
- `npm run dev`: serves the repo at http://localhost:8000 (native ES modules, no build; just reload)
- `npm test`: Node tests: level validation + headless simulation of every level (`tests/`)
- `npm run lint`: eslint, set up to catch missing/unused imports
- `npm run build`: writes `dist/square-scramble.html`, ONE self-contained file (opens from disk, works as a claude.ai artifact)
- `npm run check`: lint + test + build. **Run this before committing.**

`index.html` loads `src/main.js` as a module, so it needs a server (`npm run dev`). It won't run from `file://`. Use the built file for that.

## Layout
```
index.html              all DOM markup (menu, HUD, cards). JS finds elements by id.
src/style.css           all CSS. Colour tokens in :root mirror src/ui/theme.js
src/main.js             entry: boot + fixed-step loop (STEP = 1/240 s)
src/sim/                GAME RULES. Pure JS, no DOM, deterministic from a seed. Testable in Node.
  constants.js          every tuning number (speeds, timers, radii). Units are tiles and seconds.
  game.js               makeGame(level, opts) builds the state g; stepGame(g, dt) advances it
  world.js              tiles, collision (moveAxis), damage (hurt), crates/TNT, saws, predictPath
  guns.js heat.js       gun pickups + bullets; heat ring pickups
  goodies.js            stars ('*'), bubble shields ('B'), portals (level.portals)
  boss.js duel.js       boss races (volt/frost/cop) and boss duels
src/levels/             one file per level (NN-name.js) + index.js (the play order)
src/ui/                 everything that touches the browser
  state.js              `app`: shared session state (current game g, level index, paused, time scale…)
  store.js              localStorage save (colour, best times, sound, lives) + rival colour roster
  theme.js              colours, skins/palette, mode labels
  audio.js              WebAudio synth (tone, noise)
  fx.js                 particles/pop-ups/shake, and handleEvents(): sim events → sounds + visuals
  menu.js play.js       menu screen; level start, pause, result cards
  hud.js input.js       HUD strip; pointer + keyboard steering
  render/               canvas drawing: index.js (layout, cached level picture, draw order), tiles,
                        pickups (guns/flames/bullets), squares (drawFace is shared with the menu), boss, thumb
tests/                  node:test suites
scripts/                build.mjs, dev.mjs, playtest.mjs (try one level file: numbers, bots, screenshot), lib/ (level rules + reachability)
docs/LEVELS.md          map legend and every level field
```

## How the pieces talk
- **Sim → UI only through `g.events`.** The sim pushes `{ type: 'hurt' | 'explode' | 'finish' | … }`. `ui/fx.js#handleEvents` turns each event into sound and particles, then clears the list. To add a sound or visual for something, add a `case` there. Don't call UI code from `src/sim/`.
- **Render reads state, never changes the sim.** Render code works in level units: `ctx` is scaled so 1 = one tile. `label()` draws text in screen space.
- **Rounds end** when the sim sets `g.over = { win, reason, … }`. `ui/play.js#showResult` maps `reason` to the result card text.
- Squares: `g.squares[0]` is always the player. Each square has position `x, y` (its centre, in tiles) and heading `ux, uy` (a unit vector). `col` (its colour) is attached by the UI.

## Conventions
- Keep `src/sim/` DOM-free and deterministic: use `g.rnd()`, never `Math.random()`. The tests rely on that. `Math.random()` is fine in UI/visual code.
- Every tuning number goes in `sim/constants.js` (or in the level file if only one level uses it). No magic numbers buried in step code.
- Code style: ES5-ish (`var`, `function`) to match the existing code. Small comments that explain *why*.
- Modules export named functions. `menu.js` ↔ `play.js` import each other. That's fine because they only call each other at runtime.
- Shields: anything that damages or knocks out a square must go through `hurt()` or `knockOut()` so bubble shields work. Heat-ring melting is the one deliberate exception.
- Respect `calm()` (prefers-reduced-motion) for anything that shakes, flickers or spins.

## Common tasks
- **Add a level:** create `src/levels/NN-name.js`, try it with `node scripts/playtest.mjs src/levels/NN-name.js --shot`, then append it to the end of the list in `src/levels/index.js`. Don't insert it in the middle: saved best times and stars are stored by level index. `npm test` validates the map and reachability. Field reference: `docs/LEVELS.md`. Levels 35+ are made for a young child: keep them forgiving (bubbles before danger, slow rivals, naive bot wins most runs).
- **Tune difficulty:** global values are in `src/sim/constants.js`, per-level values are in the level file (`aiSpeed`, `enemyHp`, boss fields).
- **New tile type:** pick a character. Then handle it in `sim/world.js` (`blocks`/`moveAxis`), add it to `makeGame` in `sim/game.js` if it changes over the round (the `dyn` list), draw it in `ui/render/tiles.js` (or in `buildBase` in `ui/render/index.js` if it never changes), give it a colour in `ui/render/thumb.js`, and add it to `TILES` in `tests/levels.test.js`.
- **New boss type:** set up its state in `makeGame`, give it behaviour in `sim/boss.js#stepBoss`, draw it in `ui/render/boss.js` (`drawBoss` + `drawBossUnder`), add its words/colours to `OUTWORD/OUTCOL/BOSSC` in `ui/theme.js` and its result text to `showResult`, and add it to `BOSS_TYPES` in the tests.
- **Check a sim change didn't break anything:** `npm test` runs every level with AI squares for 40 s on 3 seeds and checks that no square ends up inside a wall or with NaN values.
