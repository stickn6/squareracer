# Square Scramble

Steer one square through 40 levels of races, battles, gunfights, heat rounds, boss races and boss duels.
Levels 35-40 are gentle ones for young kids, with stars to collect, bubble shields and swirl portals.
Drag anywhere (or hold the arrow keys / WASD) to turn. Time slows while you steer.

## Play
- **Quickest:** `npm install && npm run build`, then open `dist/square-scramble.html`. It's one self-contained file.
- **While developing:** `npm run dev`, then open http://localhost:8000.

## Develop
```bash
npm install
npm run dev      # local server, edit + reload
npm run check    # lint + tests + build
```
The code is split into `src/sim` (game rules, no DOM), `src/levels` (one file per level) and `src/ui` (menu, rendering, input, sound).
See [CLAUDE.md](CLAUDE.md) for the architecture and [docs/LEVELS.md](docs/LEVELS.md) for the level format.
