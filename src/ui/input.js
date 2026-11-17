import { ac } from './audio.js';
import { begin, pause, resume } from './play.js';
import { cv } from './render/canvas.js';
import { layout } from './render/index.js';
import { app } from './state.js';

/* ----- input: drag anywhere to steer, time slows while held. Arrow keys / WASD do the same. ----- */
const DEAD = 9, REACH = 56;
const KEYMAP = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1] };
/* the active drag, in CSS pixels: anchor (ax, ay) trails the finger (x, y) at most REACH away */
export const ptr = { id: null, active: false, ax: 0, ay: 0, x: 0, y: 0 };
let keys = {}, keySlow = false;

/* true while the player is holding a steer (finger down or a direction key): time slows and the path preview shows */
export function steering() { return ptr.active || keySlow; }
export function clearInput() { ptr.id = null; ptr.active = false; keys = {}; keySlow = false; }

function release(e) { if (e.pointerId === ptr.id) { ptr.id = null; ptr.active = false; ac(); } }
function applyKeys() {
  var x = 0, y = 0, n = 0, k;
  for (k in keys) { x += keys[k][0]; y += keys[k][1]; n++; }
  keySlow = n > 0;
  var m = Math.hypot(x, y);
  if (m > 0 && app.g && !app.g.over && !app.g.squares[0].dead) { app.g.squares[0].ux = x / m; app.g.squares[0].uy = y / m; }
}

export function initInput() {
  cv.addEventListener('pointerdown', function (e) {
    if (app.screen !== 'game' || app.paused || !app.g || app.g.over || ptr.id !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    ptr.id = e.pointerId; ptr.active = true; ptr.ax = ptr.x = e.clientX; ptr.ay = ptr.y = e.clientY;
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    ac();
    if (app.g.state === 'ready') begin();
  });
  cv.addEventListener('pointermove', function (e) {
    if (e.pointerId !== ptr.id || !app.g) return;
    ptr.x = e.clientX; ptr.y = e.clientY;
    var dx = ptr.x - ptr.ax, dy = ptr.y - ptr.ay, d = Math.hypot(dx, dy);
    if (d < DEAD) return;
    var p = app.g.squares[0];
    if (!p.dead && !app.g.over) { p.ux = dx / d; p.uy = dy / d; }
    if (d > REACH) { ptr.ax = ptr.x - dx / d * REACH; ptr.ay = ptr.y - dy / d * REACH; }
  });
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', release);
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) {
    if (app.screen !== 'game' || !app.g) return;
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (app.paused) resume(); else pause(); return; }
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key, v = KEYMAP[k];
    if (!v || app.paused || app.g.over) return;
    e.preventDefault();
    keys[k] = v; applyKeys(); ac();
    if (app.g.state === 'ready') begin();
  });
  window.addEventListener('keyup', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (keys[k]) { delete keys[k]; applyKeys(); }
  });
  window.addEventListener('blur', function () { keys = {}; keySlow = false; });
  window.addEventListener('resize', layout);
  document.addEventListener('visibilitychange', function () { if (document.hidden && app.g && app.g.state === 'playing') pause(); });
}
