/* Tuning numbers for the simulation. Units: tiles and seconds. */
export const SQ = 1.3, HALF = SQ / 2, EPS = 1e-5;
export const PLAYER_SPEED = 7.2, BOOST_MULT = 1.6, BOOST_TIME = 1.1;
export const JIT = 0.09, BLAST = 2.7, INV_TIME = 1.0, CLASH_EDGE = 0.15, STUN_TIME = 1.1, STAG_TIME = 1.6;
export const HEAT_R = 1.75, HEAT_RAMP = 0.03, HEAT_TOP = 1.6;
/* bosses: twice the size of a square, each with its own way of knocking squares out */
export const BOSS_HALF = 1.3;
export const VOLT_R = 4.6, VOLT_IDLE = 2.6, VOLT_CHARGE = 1.0;
export const FROST_GAP = 3.2, FROST_TELL = 0.8, FROST_FAN = 0.32, SHARD_SPEED = 8, SHARD_R = 0.26;
export const COP_SPEED = 4.0, COP_CHASE = 2.0, COP_REST = 3.6, COP_WIND = 0.8;
/* the duel: Volt throws waves of sparks at the player, who has to get the heat ring onto him */
export const WAVE_TELL = 0.6, WAVE_STEP = 0.6, DUEL_INV = 1.2, DUEL_GAP = [1.7, 2.0, 2.4], DUEL_SPEED = [6.6, 6.3, 6], DUEL_SPARKS = [7, 5, 5];
/* Frost's duel: fans of ice shards. A hit takes a life and freezes the player solid for a moment. */
export const ICE_TELL = 0.8, ICE_FREEZE = 0.7, ICE_SPEED = 8, ICE_GAPS = [2.1, 2.5, 2.9], ICE_FANS = [5, 3, 3];
export const GUN_SHOTS = 3, GUN_FIRST = 0.4, GUN_GAP = 0.3, GUN_COOL = 1.0, BULLET_SPEED = 20, BULLET_INV = 0.45;
