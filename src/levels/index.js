/* ---------- levels ----------
   Play order is the order of this list. Saved best times are keyed by position, so add new levels at the END
   (or migrate store.best in src/ui/store.js if you reorder). See docs/LEVELS.md for the map legend and every field. */
import L01 from './01-first-lap.js';
import L02 from './02-bumper-box.js';
import L03 from './03-spike-alley.js';
import L04 from './04-thorn-pit.js';
import L05 from './05-crate-crash.js';
import L06 from './06-powder-keg.js';
import L07 from './07-saw-mill.js';
import L08 from './08-buzz-cut.js';
import L09 from './09-fast-lane.js';
import L10 from './10-pinball.js';
import L11 from './11-the-gauntlet.js';
import L12 from './12-last-square.js';
import L13 from './13-quick-draw.js';
import L14 from './14-crossfire.js';
import L15 from './15-last-round.js';
import L16 from './16-heat-wave.js';
import L17 from './17-meltdown.js';
import L18 from './18-high-voltage.js';
import L19 from './19-deep-freeze.js';
import L20 from './20-road-block.js';
import L21 from './21-flash-point.js';
import L22 from './22-fire-break.js';
import L23 from './23-bonfire.js';
import L24 from './24-catch-fire.js';
import L25 from './25-wildfire.js';
import L26 from './26-live-wire.js';
import L27 from './27-short-circuit.js';
import L28 from './28-barricade.js';
import L29 from './29-shock-corridor.js';
import L30 from './30-overload.js';
import L31 from './31-showdown.js';
import L32 from './32-cold-snap.js';
import L33 from './33-ice-rink.js';
import L34 from './34-megavolt.js';
/* 35-40: made for a young child: stars, bubble shields and swirl portals, with Frost and Volt */
import L35 from './35-snow-stars.js';
import L36 from './36-bubble-pop.js';
import L37 from './37-portal-hop.js';
import L38 from './38-zip-zap.js';
import L39 from './39-snowball.js';
import L40 from './40-thunder-party.js';

export const LEVELS = [
  L01, L02, L03, L04, L05, L06,
  L07, L08, L09, L10, L11, L12,
  L13, L14, L15, L16, L17, L18,
  L19, L20, L21, L22, L23, L24,
  L25, L26, L27, L28, L29, L30,
  L31, L32, L33, L34,
  L35, L36, L37, L38, L39, L40
];
