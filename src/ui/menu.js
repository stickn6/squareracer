import { $ } from './dom.js';
import { LEVELS } from '../levels/index.js';
import { SQ } from '../sim/constants.js';
import { ac, tone } from './audio.js';
import { clearInput } from './input.js';
import { pause, startLevel } from './play.js';
import { cv } from './render/canvas.js';
import { drawFace } from './render/squares.js';
import { drawThumb } from './render/thumb.js';
import { app } from './state.js';
import { colorById, persist, roster, store } from './store.js';
import { CHIP, PALETTE, kindOf } from './theme.js';

/* ----- menu: colour/skin picker, lives slider, level grid ----- */
export function buildMenu() {
  var box = $('colors'), skins = $('skins'); box.textContent = ''; skins.textContent = '';
  PALETTE.forEach(function (c) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'swatch'; b.id = 'color-' + c.id;
    b.setAttribute('role', 'radio'); b.setAttribute('aria-label', c.name);
    b.innerHTML = '<canvas width="144" height="144" aria-hidden="true"></canvas>' + (c.skin ? '<span class="nm"></span>' : '');
    if (c.skin) b.querySelector('.nm').textContent = c.name;
    b.addEventListener('click', function () { store.color = c.id; persist(); refreshMenu(); tone(520, 780, 0.08, 'square', 0.04); });
    (c.skin ? skins : box).appendChild(b);
  });
  var lv = $('levels'); lv.textContent = '';
  LEVELS.forEach(function (L, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'lv'; b.id = 'level-' + (i + 1);
    b.innerHTML = '<canvas width="80" height="120" aria-hidden="true"></canvas>' +
      '<span class="row"><span class="n">' + (i + 1) + '</span><span class="chip ' + kindOf(L) + '">' + CHIP[kindOf(L)] + '</span></span>' +
      '<span class="name"></span><span class="best"></span>';
    b.querySelector('.name').textContent = L.name;
    b.addEventListener('click', function () { ac(); startLevel(i); });
    lv.appendChild(b);
  });
  $('playBtn').addEventListener('click', function () { ac(); startLevel(nextLevel()); });
  $('soundBtn').addEventListener('click', function () { toggleSound(); refreshMenu(); });
  function setLives(n) {
    n = Math.max(1, Math.min(50, Math.round(n) || 3));
    store.lives = n; persist();
    $('livesRange').value = String(n); $('livesOut').textContent = String(n);
  }
  $('livesRange').addEventListener('input', function () { setLives(+this.value); });
  $('livesDown').addEventListener('click', function () { setLives(store.lives - 1); tone(420, 0, 0.05, 'square', 0.04); });
  $('livesUp').addEventListener('click', function () { setLives(store.lives + 1); tone(560, 0, 0.05, 'square', 0.04); });
  setLives(store.lives);
  $('pauseBtn').addEventListener('click', pause);
}
export function nextLevel() {
  for (var i = 0; i < LEVELS.length; i++) if (!(store.best[i] > 0)) return i;
  return 0;
}
export function refreshMenu() {
  var me = colorById(store.color), team = roster();
  PALETTE.forEach(function (c) {
    var b = $('color-' + c.id), cx = b.querySelector('canvas').getContext('2d'), k = 144 * (c.skin ? 0.58 : 0.92) / SQ;
    b.setAttribute('aria-checked', c.id === store.color ? 'true' : 'false');
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, 144, 144);
    cx.setTransform(k, 0, 0, k, c.skin === 'ninja' ? 64 : 72, c.skin ? 84 : 72);
    drawFace(cx, c, 0, 0, 0, { ux: 0.6, uy: 0.4 });
  });
  var rc = $('racers').children;
  for (var k = 0; k < rc.length; k++) rc[k].style.setProperty('--c', team[k].css || team[k].fill);
  LEVELS.forEach(function (L, i) {
    var b = $('level-' + (i + 1)), best = store.best[i];
    b.classList.toggle('done', best > 0);
    b.querySelector('.best').textContent = best > 0 ? 'Best ' + best.toFixed(1) + ' s' : 'Not cleared';
    drawThumb(b.querySelector('canvas'), L, me);
  });
  var n = nextLevel(), all = LEVELS.every(function (L, i) { return store.best[i] > 0; });
  $('playBtn').textContent = all ? 'Play level 1 again' : 'Play level ' + (n + 1);
  $('soundBtn').textContent = store.muted ? 'Sound off' : 'Sound on';
}

export function showMenu() {
  app.screen = 'menu'; app.g = null; app.paused = false; clearInput();
  cv.hidden = true; $('app').hidden = true; $('intro').hidden = true; $('overlay').hidden = true;
  $('menu').hidden = false;
  refreshMenu();
}
export function toggleSound() { store.muted = !store.muted; persist(); if (!store.muted) tone(660, 880, 0.08, 'square', 0.04); }
