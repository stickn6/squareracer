/* user/device preferences */
const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
export const coarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
export function calm() { return mq && mq.matches; }
