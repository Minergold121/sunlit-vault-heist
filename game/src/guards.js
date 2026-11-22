// SUNLIT VAULT — guards, cameras and seeing.
// One job: patrol movement, vision cones (with line-of-sight), camera
// sweeps, coin lures and smoke. Pure logic, no drawing, no DOM, so the
// headless test can drive it directly.

import {
  GUARD_CONE_RANGE, GUARD_CONE_HALF, BOSS_CONE_RANGE, BOSS_CONE_HALF,
  CAMERA_RANGE, CAMERA_HALF, COIN_LURE_RADIUS, SMOKE_SECONDS,
} from './config.js';
import { sightBlocked, collideCircle, solidsOf, blockersOf } from './world.js';

export function makeGuard(def) {
  return {
    name: def.name,
    boss: !!def.boss,
    path: def.path.map(([x, y]) => ({ x, y })),
    x: def.path[0][0],
    y: def.path[0][1],
    target: 1,
    speed: def.speed,
    pause: def.pause,
    pauseLeft: 0,
    angle: Math.PI / 2,
    state: 'PATROL', // PATROL | LURED | DAZED
    lure: null,
    dazedLeft: 0,
    seen: 0, // 0..1 how strongly this guard currently sees the thief
  };
}

export function makeCamera(def) {
  return { x: def.x, y: def.y, base: def.base, sweep: def.sweep, speed: def.speed, phase: def.phase, angle: def.base, seen: 0 };
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function inCone(ox, oy, facing, range, half, tx, ty, blockers) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 18) return !sightBlocked(ox, oy, tx, ty, blockers);
  if (Math.abs(angleDiff(Math.atan2(dy, dx), facing)) > half) return false;
  return !sightBlocked(ox, oy, tx, ty, blockers);
}

export function beamAt(wing, t, x, y) {
  // A sunbeam is a vertical band that drifts sideways with time.
  for (const b of wing.beams) {
    const cx = b.x + Math.sin(t * b.speed + b.phase) * b.drift;
    if (x >= cx && x <= cx + b.w && y >= b.y && y <= b.y + b.h) return true;
  }
  return false;
}

export function updateGuards(wing, guards, cameras, dt, t, player, smokeLeft) {
  const solids = solidsOf(wing);
  const blockers = blockersOf(wing);
  const inBeam = beamAt(wing, t, player.x, player.y);
  const seenBy = [];
  let anySeen = false;

  for (const g of guards) {
    if (g.dazedLeft > 0) {
      g.dazedLeft -= dt;
      g.state = 'DAZED';
      g.seen = 0;
      continue;
    }
    if (g.lure) {
      g.state = 'LURED';
      const dx = g.lure.x - g.x;
      const dy = g.lure.y - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 14) {
        g.lure = null;
        g.state = 'PATROL';
      } else {
        const step = Math.min(dist, g.speed * 1.25 * dt);
        const nx = g.x + (dx / dist) * step;
        const ny = g.y + (dy / dist) * step;
        const fixed = collideCircle(nx, ny, 14, solids);
        g.angle = angleTo(g.x, g.y, fixed.x, fixed.y);
        g.x = fixed.x;
        g.y = fixed.y;
      }
    } else {
      g.state = 'PATROL';
      if (g.pauseLeft > 0) {
        g.pauseLeft -= dt;
      } else {
        const wp = g.path[g.target];
        const dx = wp.x - g.x;
        const dy = wp.y - g.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 10) {
          g.target = (g.target + 1) % g.path.length;
          g.pauseLeft = g.pause;
        } else {
          const step = Math.min(dist, g.speed * dt);
          const nx = g.x + (dx / dist) * step;
          const ny = g.y + (dy / dist) * step;
          const fixed = collideCircle(nx, ny, 14, solids);
          g.angle = angleTo(g.x, g.y, fixed.x, fixed.y);
          g.x = fixed.x;
          g.y = fixed.y;
        }
      }
    }
    // Seeing: smoke blinds everyone; a sunbeam makes the thief easier to spot.
    const range = (g.boss ? BOSS_CONE_RANGE : GUARD_CONE_RANGE) * (inBeam ? 1.35 : 1);
    const half = g.boss ? BOSS_CONE_HALF : GUARD_CONE_HALF;
    const sees = smokeLeft <= 0 && inCone(g.x, g.y, g.angle, range, half, player.x, player.y, blockers);
    g.seen = sees ? Math.min(1, g.seen + dt * 3) : Math.max(0, g.seen - dt * 2);
    if (sees) {
      seenBy.push(g.name);
      anySeen = true;
    }
  }

  for (const c of cameras) {
    c.angle = c.base + Math.sin(t * c.speed + c.phase) * c.sweep;
    const sees = smokeLeft <= 0 && inCone(c.x, c.y, c.angle, CAMERA_RANGE, CAMERA_HALF, player.x, player.y, blockers);
    c.seen = sees ? Math.min(1, c.seen + dt * 3) : Math.max(0, c.seen - dt * 2);
    if (sees) {
      seenBy.push('CAMERA');
      anySeen = true;
    }
  }

  return { anySeen, seenBy, inBeam };
}

export function tossCoin(guards, x, y) {
  for (const g of guards) {
    if (Math.hypot(g.x - x, g.y - y) <= COIN_LURE_RADIUS && g.dazedLeft <= 0) {
      g.lure = { x, y };
    }
  }
}

export function smokeBurst(guards) {
  for (const g of guards) {
    g.dazedLeft = SMOKE_SECONDS;
    g.lure = null;
    g.seen = 0;
  }
  return SMOKE_SECONDS;
}
