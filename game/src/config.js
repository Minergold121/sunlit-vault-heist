// SUNLIT VAULT — configuration and shared constants.
// One job: every number the game tunes lives here, so the other files
// only read named constants and never re-invent a magic number.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 64;
export const PLAY_TOP = 76;
export const PLAY_BOTTOM = 708;
export const PLAY_LEFT = 12;
export const PLAY_RIGHT = 1268;

export const PLAYER_R = 14;
export const WALK_SPEED = 178;
export const SNEAK_SPEED = 96;
export const SPRINT_SPEED = 252;

export const GUARD_CONE_RANGE = 235;
export const GUARD_CONE_HALF = 0.62; // radians, ~35 degrees each side
export const BOSS_CONE_RANGE = 275;
export const BOSS_CONE_HALF = 0.72;
export const CAMERA_RANGE = 210;
export const CAMERA_HALF = 0.5;

export const ALARM_RISE = 26; // per second while spotted
export const ALARM_FALL = 9; // per second while hidden
export const ALARM_WARN = 60;
export const ALARM_MAX = 100;
export const SPOT_GRACE = 0.7; // seconds of "SPOTTED!" before the meter moves

export const GLEAM_CHARGE = 34; // per second standing in a sunbeam
export const GLEAM_DRAIN = 22; // per second while sprinting
export const GLEAM_SPRINT_MIN = 25;

export const COINS_START = 3;
export const SMOKE_START = 2;
export const SMOKE_SECONDS = 4;
export const COIN_LURE_RADIUS = 190;

export const VAULT_CRACK_SECONDS = 3.2;
export const VAULT_BEAM_BONUS = 2.0; // cracking twice as fast inside a beam

export const COLORS = {
  floor: '#f3e7c8',
  floorAlt: '#ecd9ac',
  wall: '#b98a4e',
  wallTop: '#d9b078',
  cover: '#7fae7a',
  coverTop: '#a8d09a',
  beam: 'rgba(255, 196, 66, 0.34)',
  beamEdge: 'rgba(230, 150, 20, 0.55)',
  cone: 'rgba(255, 120, 60, 0.20)',
  coneAlert: 'rgba(255, 40, 30, 0.30)',
  camCone: 'rgba(255, 60, 90, 0.16)',
  player: '#1f6fb2',
  playerDark: '#144a78',
  guard: '#8c2f39',
  boss: '#5b1f6e',
  loot: '#f5b301',
  lootGem: '#ff7a1a',
  exit: '#2e8b57',
  ink: '#2b2118',
  paper: '#fff8e6',
  hud: '#fff3d6',
};

export const GAME_TITLE = 'SUNLIT VAULT';
export const GAME_SUBTITLE = 'The Meridian Gallery Heist — steal the Sun Opal before the alarm fills';
export const LOOT_TARGET = 'SUN OPAL';
