import { LEVELS } from './levels/index.js';
import { stepGame } from './sim/game.js';
import { handleEvents, updateFx } from './ui/fx.js';
import { updateHud } from './ui/hud.js';
import { initInput, steering } from './ui/input.js';
import { buildMenu, showMenu } from './ui/menu.js';
import { onOver, showResult, startLevel } from './ui/play.js';
import { draw } from './ui/render/index.js';
import { app } from './ui/state.js';

/* Entry point: wires up the UI and runs the fixed-step game loop. */
const STEP = 1 / 240; /* simulation step in seconds; stepGame() always runs at this rate */

function frame(now) {
  requestAnimationFrame(frame);
  var dt = Math.min(0.05, Math.max(0, (now - app.lastT) / 1000)); app.lastT = now;
  if (app.screen !== 'game' || !app.g) return;
  var held = steering() && app.g.state === 'playing' && !app.g.over && !app.paused;
  var target = held ? 0.25 : 1;
  app.ts += (target - app.ts) * Math.min(1, dt * 18);
  if (Math.abs(target - app.ts) < 0.004) app.ts = target;
  var simDt = 0;
  if (!app.paused && app.g.state === 'playing' && !app.resultShown) {
    simDt = dt * app.ts * (app.g.over ? 0.4 : 1);
    app.acc += simDt;
    var n = 0;
    while (app.acc >= STEP && n < 48) { stepGame(app.g, STEP); app.acc -= STEP; n++; }
    if (n === 48) app.acc = 0;
    handleEvents();
    if (app.g.over) {
      if (!app.overSeen) { app.overSeen = true; onOver(); }
      app.overT += dt;
      if (app.overT > 1.1) showResult();
    }
  }
  if (!app.paused) updateFx(app.g.state === 'playing' && !app.resultShown ? simDt : dt);
  draw(now);
  updateHud();
}

/* ----- boot (keeps your place if the page is hot-reloaded while open, e.g. as a claude.ai artifact) ----- */
var hot = window.claude && window.claude.hot;
function boot(data) {
  buildMenu();
  initInput();
  if (data && data.screen === 'game' && LEVELS[data.lvl]) startLevel(data.lvl); else showMenu();
  requestAnimationFrame(frame);
}
if (hot && hot.snapshot) { try { hot.snapshot(function () { return { screen: app.screen, lvl: app.lvl }; }); } catch (e) { /* ignore */ } }
if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {});
