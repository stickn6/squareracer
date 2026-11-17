import { PALETTE } from './theme.js';

/* ----- saved bits: colour, best times, sound, lives. store.best is keyed by level INDEX, so only ever append levels. ----- */
const KEY = 'square-scramble-v1';
export const store = { color: 'red', best: {}, muted: false, lives: 3 };
try {
  var raw = localStorage.getItem(KEY);
  if (raw) {
    var o = JSON.parse(raw);
    if (o && typeof o === 'object') {
      if (PALETTE.some(function (c) { return c.id === o.color; })) store.color = o.color;
      if (o.best && typeof o.best === 'object') store.best = o.best;
      store.muted = !!o.muted;
      if (o.lives >= 1 && o.lives <= 50) store.lives = Math.round(o.lives);
    }
  }
} catch (e) { /* storage unavailable: play without saving */ }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } }
export function colorById(id) { for (var i = 0; i < PALETTE.length; i++) if (PALETTE[i].id === id) return PALETTE[i]; return PALETTE[0]; }
/* rival-only colours, for rounds with more than three rivals */
const EXTRA = [{ id: 'purple', name: 'Purple', fill: '#8e3fd6', light: '#c9a3f0' }, { id: 'pink', name: 'Pink', fill: '#f06aa8', light: '#f9bdd8' }];
export function roster(n) {
  var drop = { orange: 'yellow', teal: 'green', rainbow: 'yellow', dragon: 'purple', tiger: 'orange' }[store.color];
  var rest = ['red', 'green', 'blue', 'yellow'].filter(function (c) { return c !== store.color && c !== drop; }).slice(0, 3);
  var team = [store.color].concat(rest).map(colorById);
  var more = EXTRA.concat(['orange', 'teal', 'yellow', 'green', 'red', 'blue'].map(colorById)).filter(function (c) { return c.id !== store.color && c.id !== drop && team.indexOf(c) < 0; });
  return team.concat(more).slice(0, Math.max(4, n || 4));
}
