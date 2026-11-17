import { $ } from './dom.js';
import { LEVELS } from '../levels/index.js';
import { makeGame } from '../sim/game.js';
import { tone } from './audio.js';
import { coarse } from './env.js';
import { burst, resetFx } from './fx.js';
import { resetHud } from './hud.js';
import { clearInput } from './input.js';
import { showMenu, toggleSound } from './menu.js';
import { cv } from './render/canvas.js';
import { layout } from './render/index.js';
import { app } from './state.js';
import { persist, roster, store } from './store.js';
import { KIND, SUN, countWord, hue, kindOf, rivalsIn } from './theme.js';

/* ----- starting a level ----- */
export function startLevel(i) {
  app.lvl = i;
  var L = LEVELS[i], team;
  app.g = makeGame(L, { seed: ((Date.now() % 1000003) + i * 7919) | 0, playerHp: store.lives });
  team = roster(app.g.squares.length);
  app.g.squares.forEach(function (s, k) { s.col = team[k]; });
  app.screen = 'game'; app.paused = false; app.ts = 1; app.acc = 0; app.overT = 0; app.overSeen = false; app.resultShown = false;
  resetFx(); clearInput(); resetHud();
  $('menu').hidden = true; $('overlay').hidden = true; cv.hidden = false; $('app').hidden = false;
  $('hudNum').textContent = String(i + 1);
  $('hudName').textContent = L.name;
  $('hudLives').hidden = L.mode !== 'battle';
  $('hudLives').style.setProperty('--c', team[0].css || team[0].fill);
  $('introNum').textContent = 'Level ' + (i + 1) + ' of ' + LEVELS.length;
  $('introChip').className = 'chip ' + kindOf(L);
  $('introChip').textContent = KIND[kindOf(L)];
  $('introName').textContent = L.name;
  var rw = countWord(rivalsIn(L));
  $('introGoal').textContent = L.duel ? 'Just you and ' + L.boss.name + '. Get your heat ring onto him ' + countWord(L.boss.hp) + ' times before his ' + (L.boss.type === 'frost' ? 'ice takes' : 'sparks take') + ' all your lives.' :
    L.boss ? 'Get past ' + L.boss.name + ' and be first into the red zone. If ' + L.boss.name + ' gets you, you are out.' :
    L.mode === 'race' ? 'Be the first square into the red zone.' :
    L.gun ? 'Grab the gun and knock out all ' + rw + ' rivals. Only bullets hurt here.' :
    L.heat ? 'Touch the flame first, then melt all ' + rw + ' rivals with its ring.' : 'Knock out all ' + rw + ' rivals. Last square standing wins.';
  $('introTip').textContent = L.tip;
  $('introHint').textContent = coarse ? 'Touch and drag to start' : 'Click and drag, or use the arrow keys';
  $('intro').hidden = false;
  layout();
}
export function begin() {
  if (!app.g || app.g.state !== 'ready') return;
  app.g.state = 'playing'; $('intro').hidden = true;
  tone(440, 880, 0.12, 'square', 0.05);
}

/* ----- overlay cards ----- */
export function showOverlay(o) {
  $('ovKicker').textContent = o.kicker; $('ovTitle').textContent = o.title; $('ovText').textContent = o.text;
  var box = $('ovActions'); box.textContent = '';
  o.actions.forEach(function (a, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'btn' + (i === 0 ? ' primary' : ''); b.id = 'ov-action-' + i; b.textContent = a[0];
    b.addEventListener('click', a[1]); box.appendChild(b);
  });
  $('overlay').hidden = false;
  if (!coarse) { try { box.firstChild.focus(); } catch (e) { /* ignore */ } }
}
export function kicker() { return 'Level ' + (app.lvl + 1) + ' · ' + KIND[kindOf(LEVELS[app.lvl])]; }
export function pause() {
  if (app.screen !== 'game' || !app.g || app.g.over || app.paused) return;
  app.paused = true; clearInput();
  showPause();
}
export function resume() { app.paused = false; $('overlay').hidden = true; app.lastT = performance.now(); }
export function showPause() {
  showOverlay({
    kicker: kicker(), title: 'Paused', text: LEVELS[app.lvl].tip,
    actions: [
      ['Resume', resume],
      ['Restart level', function () { startLevel(app.lvl); }],
      [store.muted ? 'Sound off' : 'Sound on', function () { toggleSound(); showPause(); }],
      ['Levels', showMenu]
    ]
  });
}
export function onOver() {
  clearInput();
  if (app.g.over.win) { tone(523, 0, 0.12, 'square', 0.06); tone(659, 0, 0.12, 'square', 0.06, 0.11); tone(784, 0, 0.12, 'square', 0.06, 0.22); tone(1047, 0, 0.3, 'square', 0.06, 0.33); }
  else { tone(330, 0, 0.16, 'sawtooth', 0.06); tone(262, 0, 0.16, 'sawtooth', 0.06, 0.15); tone(196, 0, 0.36, 'sawtooth', 0.06, 0.3); }
  if (app.g.over.win) {
    var p = app.g.squares[0];
    burst(p.x, p.y, hue(p.col), 26, 10, 0.3); burst(p.x, p.y, SUN, 18, 8, 0.24);
  }
}
export function showResult() {
  app.resultShown = true;
  var L = LEVELS[app.lvl], ov = app.g.over, t = Math.round(app.g.time * 10) / 10, last = app.lvl === LEVELS.length - 1, title, text, actions;
  var again = function () { startLevel(app.lvl); };
  var st = app.g.stars, starText = '';
  if (st.total) {
    if (ov.win && !(store.stars[app.lvl] >= st.got)) { store.stars[app.lvl] = st.got; persist(); }
    starText = st.got === st.total ? ' You found every star!' : st.got ? ' You found ' + st.got + ' of ' + st.total + ' stars.' : ' There are ' + st.total + ' stars hiding here!';
  }
  if (ov.win) {
    var prev = store.best[app.lvl], isBest = !(prev > 0) || t < prev;
    if (isBest) { store.best[app.lvl] = t; persist(); }
    title = L.duel ? 'You beat ' + L.boss.name : L.boss ? 'You got past ' + L.boss.name : L.mode === 'race' ? 'First across' : 'Last square standing';
    text = 'Done in ' + t.toFixed(1) + ' s.' + (prev > 0 ? (isBest ? ' New best, down from ' + prev.toFixed(1) + ' s.' : ' Your best is ' + prev.toFixed(1) + ' s.') : '') +
      starText + (last ? ' That was the final level.' : '');
    actions = last ? [['Back to levels', showMenu], ['Play again', again]] :
      [['Next level', function () { startLevel(app.lvl + 1); }], ['Play again', again], ['Levels', showMenu]];
  } else {
    if (ov.reason === 'dead') { title = 'Knocked out'; text = L.duel ? (L.boss.type === 'frost' ? 'The ice took your last life. When the red lines point at you, slip between them or get right outside them before he throws.' : 'The sparks took your last life. When the red strip points at you, steer out of it before he fires.') : L.gun ? 'You ran out of lives. Get to the gun first, or step out of the line of fire.' : 'You ran out of lives. Face rivals nose-first and keep clear of hazards.'; }
    else if (ov.reason === 'boss') {
      title = { volt: 'Zapped by ', frost: 'Frozen by ', cop: 'Busted by ' }[ov.how] + L.boss.name;
      text = { volt: 'You were inside the ring when it flashed. Wait outside it, and go right after a flash.',
        frost: 'An ice shard hit you. When the three red lines point at you, move off them before Frost throws.',
        cop: 'Sarge caught you. Keep away while his light is flashing, and go past him once he stops for breath.' }[ov.how];
    }
    else if (ov.reason === 'burn') { title = ov.who.col.name + ' melted you'; text = 'A rival reached the flame first. Get to it before they do, or keep well clear of the ring.'; }
    else { title = ov.who.col.name + ' got there first'; text = 'A rival reached the red zone ahead of you after ' + t.toFixed(1) + ' s.'; }
    /* on a loss, only mention stars if some were found (no 'you found 0') */
    if (st.got) text += starText + ' Win to keep them!';
    actions = [['Try again', again], ['Levels', showMenu]];
  }
  showOverlay({ kicker: kicker(), title: title, text: text, actions: actions });
}
