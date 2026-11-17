# Level format

Each level is a plain object in `src/levels/NN-name.js` (`export default { … }`). The play order is the list in
`src/levels/index.js`. **Append new levels at the end**: saved best times are stored by position in that list.
`npm test` checks every level against the rules below (`scripts/lib/validate-level.js`) and that the player can reach the finish, every star and every bubble.

## Playtesting a level
```bash
node scripts/playtest.mjs src/levels/35-my-level.js --shot
```
Works before the level is added to `index.js`. It prints rule problems, reachability, how fast rivals finish, and how a **naive bot** does (races: follows the shortest path and never waits for the boss; duels: drives straight at the boss and never dodges). `--shot` saves a screenshot from the real game (needs Playwright). The kid-friendly levels (35+) aim for the naive bot winning at least ~80% of runs.

## Map legend
`map` is an array of equal-length strings, at most 20 wide × 30 tall (the size of the menu thumbnail). The outer border must be all `#`.

| char | tile |
|---|---|
| `#` | wall |
| ` ` | floor |
| `F` | finish zone (races) |
| `A` `V` `<` `>` | spikes pointing up / down / left / right |
| `C` | crate: breaks when hit |
| `T` | TNT: explodes on contact, chain-reacts, breaks crates |
| `+` | boost pad |
| `d` `u` `l` `r` | one-way gate: lets squares through moving down / up / left / right |
| `G` | gun pickup (gun rounds) |
| `*` | star: the player collects it by touching it (a bonus, counted on the HUD and result card) |
| `B` | bubble shield pickup: absorbs the player's next hit or boss knockout, grows back after 5 s |
| `H` | heat-ring flame (heat rounds) |
| `1` | the player's spawn |
| `2`–`7` | rival spawns (number them with no gaps) |

Coordinates elsewhere (saws, bosses) are in tiles. `x = 0` is the left edge of the map, and the centre of the tile in column 3 is `3.5`.

## Fields
| field | used in | meaning |
|---|---|---|
| `name` | all | shown in the menu and HUD |
| `mode` | all | `'race'` (first into `F` wins, hazards stun) or `'battle'` (knock out every rival, hazards cost a life) |
| `aiSpeed` | all | rival speed in tiles/s (the player moves at `PLAYER_SPEED` = 7.2). Duels use `0`. |
| `pdir` | all | the player's starting heading, e.g. `[1, 0]` |
| `tip` | all | one-line hint on the intro and pause cards |
| `enemyHp` | battle | rival lives (default 3) |
| `gun: true` | battle | gun round: only bullets do damage |
| `heat: true` | battle | heat round: whoever has the flame melts anyone its ring touches |
| `flames` | heat | moving flames: `[[x1, y1, x2, y2, speed], …]` |
| `saws` | any | `[[x1, y1, x2, y2, speed, radius = 0.8, startPhase 0–1], …]`. The saw slides back and forth along the line. |
| `portals` | any | `[[ax, ay, bx, by], …]`: whole-tile column/row of each end of a pair. Any square whose centre enters one end comes out of the other with the same heading. Each end and its 8 neighbours must be open floor (` `, `*`, `F`, `+`). |
| `boss` | any | see below |
| `duel: true` | battle | boss duel: just the player and the boss (also set `boss.duel`) |

## `boss`
Common: `type` (`'volt'` \| `'frost'` \| `'cop'`), `name`, `x`, `y` (where it starts), `zone: [left, top, right, bottom]` (its room: Frost and Sarge only target squares inside it, and Frost's shards melt below it).

Movement: `patrol: [xFrom, xTo]` (walk sideways at height `y`) or `path: [x1, y1, x2, y2]`, plus `speed`.

- **volt**: `r` ring radius (default `VOLT_R`), `idle` seconds between shocks, `charge` seconds of wind-up, `first: [min, max]` time of the first flash.
- **frost**: throws a fan of 3 shards every `FROST_GAP` s at the nearest square in its zone.
- **cop** (Sarge): chases the nearest square in its zone, then rests (`COP_*` constants).
- **duels** (`duel: true`): `hp` = how many heat-ring hits it takes. `spots: [[x, y] | [x1, y1, x2, y2], …]` are the places it blinks to after a hit (a 4-number spot is a track it skates along). Frost duels also take `gaps`, `fans` and `reaim`, each a list indexed by the boss's remaining hp.
