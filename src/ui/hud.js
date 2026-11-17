import { $ } from './dom.js';
import { app } from './state.js';

/* ----- HUD: only touches the DOM when a shown value changes ----- */
const hudCache = { time: '', lives: -1, mode: '' };
export function resetHud() { hudCache.time = ''; hudCache.lives = -1; hudCache.mode = ''; }
export function updateHud() {
  var p = app.g.squares[0], t = app.g.time.toFixed(1);
  if (t !== hudCache.time) { hudCache.time = t; $('hudTime').textContent = t; }
  var mode;
  if (app.g.mode === 'battle') {
    var left = 0; for (var i = 1; i < app.g.squares.length; i++) if (!app.g.squares[i].dead) left++;
    mode = app.g.level.duel ? 'Duel · ' + Math.max(0, app.g.boss.hp) + ' to go' :
      (app.g.level.gun ? 'Guns' : app.g.level.heat ? 'Heat' : 'Battle') + ' · ' + left + ' left';
    if (p.hp !== hudCache.lives) {
      hudCache.lives = p.hp;
      var el = $('hudLives'), html = '';
      if (p.maxHp > 5) html = '<span class="bar"><b style="width:' + Math.round(100 * Math.max(0, p.hp) / p.maxHp) + '%"></b></span><span class="hpn">' + Math.max(0, p.hp) + '</span>';
      else for (var k = 0; k < p.maxHp; k++) html += '<i' + (k < p.hp ? '' : ' class="gone"') + '></i>';
      el.innerHTML = html; el.setAttribute('aria-label', Math.max(0, p.hp) + ' of ' + p.maxHp + ' lives');
    }
  } else mode = app.g.boss ? 'Boss · ' + app.g.boss.name : p.stun > 0 ? 'Race · stunned' : 'Race';
  if (app.g.stars.total) mode += ' · ★ ' + app.g.stars.got + '/' + app.g.stars.total;
  if (mode !== hudCache.mode) { hudCache.mode = mode; $('hudMode').textContent = mode; }
}
