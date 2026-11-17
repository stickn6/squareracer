import { store } from './store.js';

/* ----- sound: tiny synth, starts on first touch ----- */
let AC = null;
export function ac() {
  if (store.muted) return null;
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) { /* ignore */ } }
  return AC;
}
export function tone(f0, f1, dur, type, vol, delay) {
  var a = ac(); if (!a) return;
  var t = a.currentTime + (delay || 0), o = a.createOscillator(), gn = a.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  gn.gain.setValueAtTime(vol || 0.05, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn); gn.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
export function noise(dur, vol, cut) {
  var a = ac(); if (!a) return;
  var n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  var src = a.createBufferSource(), gn = a.createGain(), lp = a.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = cut || 1200; gn.gain.value = vol || 0.12;
  src.buffer = buf; src.connect(lp); lp.connect(gn); gn.connect(a.destination); src.start();
}
