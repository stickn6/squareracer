/* Session state shared across UI modules. Everything here is reset by startLevel() / showMenu().
   g        the running game from makeGame() (null on the menu)
   lvl      index into LEVELS of the level being played
   screen   'menu' | 'game'
   ts       time scale: 1 normally, eases towards 0.25 while the player is steering
   acc      fixed-step accumulator for stepGame()
   lastT    timestamp of the previous animation frame
   overT    seconds since the round ended (the result card shows after 1.1 s)
   overSeen onOver() has run for this round
   resultShown the result card is up, so the sim stops */
export const app = {
  g: null, lvl: 0, screen: 'menu', paused: false,
  ts: 1, acc: 0, lastT: 0, overT: 0, overSeen: false, resultShown: false
};
