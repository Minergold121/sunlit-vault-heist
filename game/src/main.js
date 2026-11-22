// SUNLIT VAULT — game loop and state machine.
// One job: own the frame loop, the alarm, wing transitions and the
// title / caught / win states, and hand render.js one view per frame.
// All movement, seeing and grabbing live in guards.js / player.js.

import { VIEW_W, VIEW_H, ALARM_RISE, ALARM_FALL, ALARM_MAX, SPOT_GRACE, SMOKE_SECONDS } from './config.js';
import { WINGS } from './world.js';
import { makeGuard, makeCamera, updateGuards, tossCoin, smokeBurst, beamAt } from './guards.js';
import { makePlayer, updatePlayer, tryGrab, nearLoot, updateCrack, atExit, allLootTaken } from './player.js';
import { makeInput, bindInput } from './input.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import { sfx, unlockAudio } from './audio.js';

export function createGame() {
  return {
    wingIndex: 0,
    wing: WINGS[0],
    player: makePlayer(WINGS[0]),
    guards: WINGS[0].guards.map(makeGuard),
    cameras: WINGS[0].cameras.map(makeCamera),
    alarm: 0,
    peakAlarm: 0,
    smokeLeft: 0,
    spotted: false,
    graceLeft: 0,
    time: 0,
    score: 0,
    banked: 0,
    state: 'title', // title | play | caught | wingclear | win
    message: '',
    messageUntil: 0,
    t: 0,
    stepCount: 0,
  };
}

function loadWing(game, index, keepBanked) {
  const wing = WINGS[index];
  game.wingIndex = index;
  game.wing = wing;
  game.player = makePlayer(wing);
  game.player.loot = keepBanked ? game.banked : 0;
  game.guards = wing.guards.map(makeGuard);
  game.cameras = wing.cameras.map(makeCamera);
  game.alarm = 0;
  game.smokeLeft = 0;
  game.graceLeft = 0;
  game.spotted = false;
  game.message = '';
}

function restartWing(game) {
  // Caught: the wing's unbanked loot is lost, the alarm resets.
  loadWing(game, game.wingIndex, true);
  game.state = 'play';
  game.message = 'CAUGHT — WING RESTARTED. READ THE CONES.';
  game.messageUntil = game.t + 2.5;
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function stepGame(game, input, dt) {
  game.t += dt;
  game.stepCount += 1;
  if (game.state === 'play') game.time += dt;

  if (game.state === 'title' || game.state === 'caught' || game.state === 'wingclear' || game.state === 'win') {
    if (input.anyKey) {
      input.anyKey = false;
      unlockAudio();
      if (game.state === 'title') {
        game.state = 'play';
        game.time = 0;
      } else if (game.state === 'caught') {
        restartWing(game);
      } else if (game.state === 'wingclear') {
        const next = game.wingIndex + 1;
        if (next < WINGS.length) {
          game.banked = game.player.loot;
          loadWing(game, next, true);
          game.state = 'play';
        }
      } else if (game.state === 'win') {
        game.banked = 0;
        game.score = 0;
        game.time = 0;
        loadWing(game, 0, false);
        game.state = 'play';
      }
    }
    return game;
  }

  // --- play state
  input.anyKey = false; // a movement key must not auto-dismiss the next screen
  const { anySeen, seenBy, inBeam } = updateGuards(game.wing, game.guards, game.cameras, dt, game.t, game.player, game.smokeLeft);
  updatePlayer(game.player, game.wing, input, dt, inBeam);
  void seenBy;

  // Tools
  if (input.coinAt && game.player.coins > 0) {
    game.player.coins -= 1;
    tossCoin(game.guards, input.coinAt.x, input.coinAt.y);
    sfx.coin();
    game.message = 'COIN TOSSED — GUARDS INVESTIGATE THE SOUND';
    game.messageUntil = game.t + 1.6;
  }
  input.coinAt = null;
  if (input.smokePressed) {
    input.smokePressed = false;
    if (game.player.smoke > 0 && game.smokeLeft <= 0) {
      game.player.smoke -= 1;
      game.smokeLeft = smokeBurst(game.guards);
      sfx.smoke();
      game.message = 'SMOKE! GUARDS ARE DAZED — MOVE NOW';
      game.messageUntil = game.t + 2;
    }
  }
  if (game.smokeLeft > 0) game.smokeLeft -= dt;

  // Alarm: a short grace, then the meter climbs while anyone sees you.
  const wasSpotted = game.spotted;
  game.spotted = anySeen;
  if (anySeen && !wasSpotted) {
    game.graceLeft = SPOT_GRACE;
    sfx.spotted();
  }
  if (anySeen) {
    if (game.graceLeft > 0) {
      game.graceLeft -= dt;
    } else {
      game.alarm = Math.min(ALARM_MAX, game.alarm + ALARM_RISE * dt);
    }
  } else {
    game.graceLeft = 0;
    game.alarm = Math.max(0, game.alarm - ALARM_FALL * dt);
  }
  game.peakAlarm = Math.max(game.peakAlarm, game.alarm);

  // Grab loot / crack vault
  const near = nearLoot(game.player, game.wing);
  if (input.action && near) {
    const item = tryGrab(game.player, game.wing);
    if (item) {
      sfx.pickup();
      game.message = `${item.name} — +$${item.value.toLocaleString()}`;
      game.messageUntil = game.t + 1.8;
    }
    input.action = false;
  }
  const opened = updateCrack(game.player, game.wing, input.action, dt, inBeam);
  if (opened) {
    sfx.vault();
    game.message = 'THE SUN VAULT IS OPEN — TAKE THE SUN OPAL!';
    game.messageUntil = game.t + 2.5;
  }
  if (input.action && !near && game.wing.vault && !game.player.vaultOpen) {
    // Holding E near the vault is handled by updateCrack; tapping elsewhere does nothing.
  }

  // Score follows loot, plus a small survival bonus for a low alarm.
  game.score = game.player.loot + Math.max(0, Math.round((100 - game.peakAlarm) * 5));

  // Caught
  if (game.alarm >= ALARM_MAX) {
    game.state = 'caught';
    sfx.caught();
    return game;
  }

  // Exit: only once every loot piece in the wing is taken.
  if (atExit(game.player, game.wing)) {
    if (allLootTaken(game.player, game.wing)) {
      if (game.wingIndex === WINGS.length - 1) {
        game.state = 'win';
        game.score = game.player.loot + Math.max(0, Math.round((100 - game.peakAlarm) * 5)) + Math.max(0, 1200 - Math.floor(game.time) * 2);
        sfx.win();
      } else {
        game.banked = game.player.loot;
        game.state = 'wingclear';
      }
    } else if (!game.message || game.t > game.messageUntil) {
      game.message = 'THE EXIT IS LOCKED — GRAB EVERY LOOT PIECE FIRST';
      game.messageUntil = game.t + 2;
    }
  }
  return game;
}

export function startGame(canvas) {
  const ctx = canvas.getContext('2d');
  const input = makeInput();
  bindInput(input, canvas);
  const game = createGame();
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    applyShot(game, shot);
    if (shot !== 'start') game.state = game.state === 'title' ? 'title' : game.state;
  }
  // Test hook: headless checks drive the same step function the loop uses.
  window.__heist = { game, input, step: (dt) => stepGame(game, input, dt) };

  let last = performance.now();
  let shotDrawn = false;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!shot) {
      stepGame(game, input, dt);
    } else if (!shotDrawn) {
      // A screenshot scene renders once, exactly staged, no drift.
      shotDrawn = true;
    }
    const view = {
      ...game,
      wing: game.wing,
      guards: game.guards,
      cameras: game.cameras,
      player: game.player,
      inBeam: beamAt(game.wing, game.t, game.player.x, game.player.y),
      timeText: fmtTime(game.time),
      nextWing: game.wingIndex + 1 < WINGS.length ? WINGS[game.wingIndex + 1] : null,
      message: game.t <= game.messageUntil ? game.message : '',
    };
    render(ctx, view);
    if (shot) window.__shotReady = true;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return game;
}

// Boot when loaded as the page's module script.
if (typeof document !== 'undefined') {
  const canvas = document.getElementById('game');
  if (canvas) startGame(canvas);
}
