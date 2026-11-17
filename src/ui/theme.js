import { calm } from './env.js';

/* Colours, skins and labels. Colour values mirror the CSS custom properties in src/style.css. */
export const INK = '#12301a', GRASS = '#7ef07e', PAPER = '#fffbe3', ORCHID = '#d86af0', MIDFLOOR = '#ecc6f6';
export const FINISH = '#e33f6c', SUN = '#ffd43a', STEEL = '#aab3bc';
export const PALETTE = [
  { id: 'red', name: 'Red', fill: '#e8372f', light: '#f79a94' },
  { id: 'green', name: 'Green', fill: '#2fc33a', light: '#93ec99' },
  { id: 'blue', name: 'Blue', fill: '#2b50e6', light: '#8fa3f8' },
  { id: 'yellow', name: 'Yellow', fill: '#f7d21c', light: '#fcec94' },
  { id: 'orange', name: 'Orange', fill: '#ff8a1e', light: '#ffc892' },
  { id: 'teal', name: 'Teal', fill: '#12b8b0', light: '#8fe9e4' },
  { id: 'rainbow', name: 'Rainbow', fill: '#e8372f', light: '#f79a94', rainbow: true,
    css: 'linear-gradient(180deg,#e8372f 0 16.7%,#ff8a1e 0 33.3%,#f7d21c 0 50%,#2fc33a 0 66.7%,#2b50e6 0 83.3%,#8e3fd6 0)' },
  { id: 'ninja', name: 'Ninja', skin: 'ninja', fill: '#232a3d', light: '#f79a94' },
  { id: 'robot', name: 'Robot', skin: 'robot', fill: '#b9c2cc', light: '#9be9ff' },
  { id: 'dragon', name: 'Dragon', skin: 'dragon', fill: '#8e3fd6', light: '#ffb347' },
  { id: 'tiger', name: 'Tiger', skin: 'tiger', fill: '#ff8a1e', light: '#ffc892' }
];
export const RAINBOW = ['#e8372f', '#ff8a1e', '#f7d21c', '#2fc33a', '#2b50e6', '#8e3fd6'];
export const KIND = { race: 'Race', battle: 'Battle', gun: 'Gunfight', heat: 'Heat round', boss: 'Boss race', duel: 'Boss duel' };
export const CHIP = { race: 'Race', battle: 'Battle', gun: 'Guns', heat: 'Heat', boss: 'Boss', duel: 'Duel' };
export const BOSSC = { volt: '#ffd43a', frost: '#a8e0ff', cop: '#2f4a9e' };
export const OUTWORD = { volt: 'ZAPPED', frost: 'FROZEN', cop: 'BUSTED' }, OUTCOL = { volt: '#ffd43a', frost: '#bfe9ff', cop: '#9fb6ff' };
export function kindOf(L) { return L.duel ? 'duel' : L.boss ? 'boss' : L.gun ? 'gun' : L.heat ? 'heat' : L.mode; }
export function rivalsIn(L) { return L.map.join('').replace(/[^2-7]/g, '').length; }
export function countWord(n) { return ['no', 'one', 'two', 'three', 'four', 'five', 'six'][n] || String(n); }

/* a square's colour right now: rainbow squares cycle through the spectrum */
export function tint(col, now, light) {
  if (!col.rainbow) return light ? col.light : col.fill;
  var h = calm() ? 290 : Math.floor(now / 5) % 360;
  return 'hsl(' + h + (light ? ',95%,76%)' : ',88%,55%)');
}
export function hue(col) { return col.rainbow ? 'rainbow' : col.fill; }
