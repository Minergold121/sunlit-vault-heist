// SUNLIT VAULT — deterministic screenshot scenes.
// One job: given ?shot=start|play|alarm|win, stage the exact frame the
// screenshots show, so every screenshot is a real render of the game's
// own code with fixed, readable positions. No randomness here.

import { WINGS } from './world.js';
import { makeGuard, makeCamera } from './guards.js';
import { makePlayer } from './player.js';

export function applyShot(game, shot) {
  if (shot === 'start') {
    game.state = 'title';
    game.wingIndex = 0;
    game.wing = WINGS[0];
    game.player = makePlayer(WINGS[0]);
    game.guards = WINGS[0].guards.map(makeGuard);
    game.cameras = WINGS[0].cameras.map(makeCamera);
    game.alarm = 0;
    game.t = 1.2;
    return;
  }
  if (shot === 'play') {
    // Wing 2, mid-heist: the thief crosses the middle room between cones.
    game.state = 'play';
    game.wingIndex = 1;
    game.wing = WINGS[1];
    game.player = makePlayer(WINGS[1]);
    game.player.x = 600;
    game.player.y = 400;
    game.player.gleam = 58;
    game.player.loot = 1200;
    game.player.taken = ['shard'];
    game.player.coins = 2;
    game.player.smoke = 1;
    game.guards = WINGS[1].guards.map(makeGuard);
    game.guards[0].x = 600; game.guards[0].y = 230; game.guards[0].angle = Math.PI / 2;
    game.guards[1].x = 240; game.guards[1].y = 330; game.guards[1].angle = 0;
    game.guards[2].x = 1060; game.guards[2].y = 330; game.guards[2].angle = Math.PI;
    game.cameras = WINGS[1].cameras.map(makeCamera);
    game.alarm = 38;
    game.peakAlarm = 38;
    game.score = 1510;
    game.time = 74;
    game.t = 4.7;
    return;
  }
  if (shot === 'alarm') {
    // Wing 3, alarm nearly full: spotted in a sunbeam by Captain Brass.
    game.state = 'play';
    game.wingIndex = 2;
    game.wing = WINGS[2];
    game.player = makePlayer(WINGS[2]);
    game.player.x = 620;
    game.player.y = 260;
    game.player.gleam = 81;
    game.player.loot = 2900;
    game.player.taken = ['bars'];
    game.player.coins = 1;
    game.player.smoke = 2;
    game.guards = WINGS[2].guards.map(makeGuard);
    game.guards[0].x = 640; game.guards[0].y = 180; game.guards[0].angle = Math.PI / 2; game.guards[0].seen = 1;
    game.guards[1].x = 420; game.guards[1].y = 420; game.guards[1].angle = Math.PI / 2;
    game.guards[2].x = 820; game.guards[2].y = 300; game.guards[2].angle = -Math.PI / 2;
    game.cameras = WINGS[2].cameras.map(makeCamera);
    game.alarm = 82;
    game.spotted = true;
    game.peakAlarm = 82;
    game.score = 2990;
    game.time = 186;
    game.t = 7.9;
    return;
  }
  if (shot === 'win') {
    game.state = 'win';
    game.wingIndex = 2;
    game.wing = WINGS[2];
    game.player = makePlayer(WINGS[2]);
    game.player.x = 98;
    game.player.y = 152;
    game.player.loot = 8200;
    game.player.taken = ['opal', 'bars'];
    game.player.coins = 1;
    game.player.smoke = 0;
    game.guards = WINGS[2].guards.map(makeGuard);
    game.cameras = WINGS[2].cameras.map(makeCamera);
    game.alarm = 44;
    game.peakAlarm = 82;
    game.time = 243;
    game.score = 9400;
    game.t = 3.3;
  }
}
