// SUNLIT VAULT — the thief.
// One job: the player's body, tools, gleam, loot and vault cracking.
// Pure logic, no drawing, no DOM.

import {
  PLAYER_R, WALK_SPEED, SNEAK_SPEED, SPRINT_SPEED,
  GLEAM_CHARGE, GLEAM_DRAIN, GLEAM_SPRINT_MIN,
  COINS_START, SMOKE_START, VAULT_CRACK_SECONDS, VAULT_BEAM_BONUS,
} from './config.js';
import { collideCircle, solidsOf } from './world.js';

export function makePlayer(wing) {
  return {
    x: wing.start.x,
    y: wing.start.y,
    r: PLAYER_R,
    facing: 0,
    gleam: 0,
    coins: COINS_START,
    smoke: SMOKE_START,
    loot: 0,
    taken: [],
    crack: 0,
    vaultOpen: false,
    moving: false,
    sprinting: false,
    sneaking: false,
  };
}

export function updatePlayer(player, wing, input, dt, inBeam) {
  const solids = solidsOf(wing);
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  player.sneaking = !!input.sneak;
  const wantSprint = !!input.sprint && player.gleam >= GLEAM_SPRINT_MIN && !player.sneaking;
  player.sprinting = wantSprint && (mx !== 0 || my !== 0);
  const speed = player.sprinting ? SPRINT_SPEED : player.sneaking ? SNEAK_SPEED : WALK_SPEED;
  player.moving = mx !== 0 || my !== 0;
  if (player.moving) {
    const len = Math.hypot(mx, my);
    const nx = player.x + (mx / len) * speed * dt;
    const ny = player.y + (my / len) * speed * dt;
    player.facing = Math.atan2(my, mx);
    const fixed = collideCircle(nx, ny, player.r, solids);
    player.x = fixed.x;
    player.y = fixed.y;
  }
  if (inBeam) {
    player.gleam = Math.min(100, player.gleam + GLEAM_CHARGE * dt);
  }
  if (player.sprinting) {
    player.gleam = Math.max(0, player.gleam - GLEAM_DRAIN * dt);
  }
  // Sneaking in shadow slowly restores calm: gleam leaks away off-beam.
  if (!inBeam && !player.sprinting) {
    player.gleam = Math.max(0, player.gleam - 4 * dt);
  }
  return player;
}

export function tryGrab(player, wing) {
  // Nearest loot within reach that is not locked behind the vault.
  for (const item of wing.loot) {
    if (player.taken.includes(item.id)) continue;
    if (item.needsVault && !player.vaultOpen) continue;
    if (Math.hypot(item.x - player.x, item.y - player.y) <= 52) {
      player.taken.push(item.id);
      player.loot += item.value;
      return item;
    }
  }
  return null;
}

export function nearLoot(player, wing) {
  for (const item of wing.loot) {
    if (player.taken.includes(item.id)) continue;
    if (item.needsVault && !player.vaultOpen) continue;
    if (Math.hypot(item.x - player.x, item.y - player.y) <= 52) return item;
  }
  return null;
}

export function updateCrack(player, wing, holdingE, dt, inBeam) {
  if (!wing.vault || player.vaultOpen) {
    player.crack = 0;
    return false;
  }
  const near = Math.hypot(wing.vault.x + wing.vault.w / 2 - player.x, wing.vault.y + wing.vault.h / 2 - player.y) <= 110;
  if (near && holdingE) {
    const rate = inBeam ? VAULT_BEAM_BONUS : 1;
    player.crack += (dt / VAULT_CRACK_SECONDS) * rate;
    if (player.crack >= 1) {
      player.crack = 1;
      player.vaultOpen = true;
      return true;
    }
  } else {
    player.crack = Math.max(0, player.crack - dt * 0.6);
  }
  return false;
}

export function atExit(player, wing) {
  const e = wing.exit;
  return player.x >= e.x - 6 && player.x <= e.x + e.w + 6 && player.y >= e.y - 6 && player.y <= e.y + e.h + 6;
}

export function allLootTaken(player, wing) {
  return wing.loot.every((item) => player.taken.includes(item.id));
}
