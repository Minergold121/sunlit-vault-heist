// SUNLIT VAULT — the three wings of the Meridian Gallery.
// One job: static level data (walls, cover, patrols, cameras, sunbeams,
// loot, exits) plus the geometry helpers every other file uses.
// All coordinates are in the 1280x720 canvas; the play area starts
// below the HUD. Nothing here moves; guards.js animates patrols.

import { PLAY_TOP, PLAY_BOTTOM, PLAY_LEFT, PLAY_RIGHT } from './config.js';

export function rect(x, y, w, h) {
  return { x, y, w, h };
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function segHitsRect(x1, y1, x2, y2, r) {
  // Segment vs rectangle: true when the sight line crosses the rect.
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxX < r.x || minX > r.x + r.w || maxY < r.y || minY > r.y + r.h) return false;
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    const ex = bx - ax;
    const ey = by - ay;
    const den = dx * ey - dy * ex;
    if (den === 0) continue;
    const t = ((ax - x1) * ey - (ay - y1) * ex) / den;
    const u = ((ax - x1) * dy - (ay - y1) * dx) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

export function sightBlocked(x1, y1, x2, y2, blockers) {
  for (const b of blockers) {
    if (segHitsRect(x1, y1, x2, y2, b)) return true;
  }
  return false;
}

export function collideCircle(x, y, r, solids) {
  // Axis-separated slide: returns the corrected position.
  let nx = x;
  let ny = y;
  const box = (cx, cy) => ({ x: cx - r, y: cy - r, w: r * 2, h: r * 2 });
  for (const s of solids) {
    if (rectsOverlap(box(nx, y), s)) {
      if (nx > x) nx = s.x - r;
      else if (nx < x) nx = s.x + s.w + r;
      else nx = x;
    }
  }
  for (const s of solids) {
    if (rectsOverlap(box(nx, ny), s)) {
      if (ny > y) ny = s.y - r;
      else if (ny < y) ny = s.y + s.h + r;
      else ny = y;
    }
  }
  nx = Math.max(PLAY_LEFT + r, Math.min(PLAY_RIGHT - r, nx));
  ny = Math.max(PLAY_TOP + r, Math.min(PLAY_BOTTOM - r, ny));
  return { x: nx, y: ny };
}

function borderWalls() {
  return [
    rect(PLAY_LEFT, PLAY_TOP, PLAY_RIGHT - PLAY_LEFT, 10),
    rect(PLAY_LEFT, PLAY_BOTTOM - 10, PLAY_RIGHT - PLAY_LEFT, 10),
    rect(PLAY_LEFT, PLAY_TOP, 10, PLAY_BOTTOM - PLAY_TOP),
    rect(PLAY_RIGHT - 10, PLAY_TOP, 10, PLAY_BOTTOM - PLAY_TOP),
  ];
}

// ---------------------------------------------------------------- wings
export const WINGS = [
  {
    id: 0,
    name: 'WING 1 — THE MERIDIAN ATRIUM',
    hint: 'Two routes: the planter row (left, safe) or the sunbeam lane (right, fast). Grab 3 treasures, then reach the brass door.',
    start: { x: 90, y: 620 },
    walls: [
      ...borderWalls(),
      rect(430, 150, 26, 300),
      rect(760, 300, 26, 280),
      rect(300, 420, 220, 24),
    ],
    cover: [
      rect(220, 260, 70, 46),
      rect(560, 180, 70, 46),
      rect(900, 480, 70, 46),
      rect(1050, 220, 70, 46),
    ],
    guards: [
      { name: 'ROOK', path: [[330, 180], [330, 560], [640, 560]], speed: 62, pause: 1.1 },
      { name: 'IVY', path: [[980, 540], [980, 180], [700, 180]], speed: 58, pause: 1.4 },
    ],
    cameras: [
      { x: 640, y: 92, base: Math.PI / 2, sweep: 0.7, speed: 0.45, phase: 0 },
      { x: 1150, y: 400, base: Math.PI, sweep: 0.6, speed: 0.6, phase: 1.7 },
    ],
    beams: [
      { x: 520, y: 96, w: 110, h: 560, drift: 26, speed: 0.22, phase: 0 },
      { x: 1000, y: 96, w: 90, h: 300, drift: 18, speed: 0.3, phase: 2.1 },
    ],
    loot: [
      { id: 'coin1', name: 'GOLD COIN CACHE', x: 200, y: 150, value: 400, kind: 'coin' },
      { id: 'vase', name: 'PORCELAIN VASE', x: 640, y: 620, value: 650, kind: 'vase' },
      { id: 'mask', name: 'JADE MASK', x: 1150, y: 140, value: 800, kind: 'mask' },
    ],
    exit: { x: 1180, y: 620, w: 70, h: 64, label: 'BRASS DOOR → WING 2' },
  },
  {
    id: 1,
    name: 'WING 2 — GALLERY OF THE SUN',
    hint: 'Captain Brass patrols the middle. Sunbeams charge your Gleam — sprint through them, but guards see you sooner in the light.',
    start: { x: 90, y: 150 },
    walls: [
      ...borderWalls(),
      rect(380, 96, 24, 260),
      rect(380, 470, 24, 220),
      rect(820, 96, 24, 220),
      rect(820, 430, 24, 260),
      rect(560, 360, 180, 24),
    ],
    cover: [
      { x: 200, y: 380, w: 70, h: 46 },
      { x: 620, y: 160, w: 70, h: 46 },
      { x: 620, y: 540, w: 70, h: 46 },
      { x: 1040, y: 380, w: 70, h: 46 },
    ],
    guards: [
      { name: 'CAPTAIN BRASS', boss: true, path: [[600, 300], [600, 620], [600, 140]], speed: 74, pause: 0.7 },
      { name: 'ROOK', path: [[240, 200], [240, 560]], speed: 60, pause: 1.2 },
      { name: 'IVY', path: [[1060, 560], [1060, 200]], speed: 60, pause: 1.2 },
    ],
    cameras: [
      { x: 640, y: 92, base: Math.PI / 2, sweep: 0.8, speed: 0.5, phase: 0.4 },
      { x: 640, y: 690, base: -Math.PI / 2, sweep: 0.8, speed: 0.5, phase: 2.4 },
      { x: 1180, y: 340, base: Math.PI, sweep: 0.55, speed: 0.7, phase: 1.1 },
    ],
    beams: [
      { x: 440, y: 96, w: 130, h: 590, drift: 34, speed: 0.26, phase: 0.6 },
      { x: 880, y: 96, w: 110, h: 590, drift: 30, speed: 0.2, phase: 3.0 },
    ],
    loot: [
      { id: 'shard', name: 'SUN OPAL SHARD', x: 640, y: 395, value: 1200, kind: 'gem' },
      { id: 'crown', name: 'SUN CROWN', x: 1150, y: 130, value: 900, kind: 'crown' },
      { id: 'scroll', name: 'GILDED SCROLL', x: 170, y: 620, value: 500, kind: 'scroll' },
    ],
    exit: { x: 1180, y: 620, w: 70, h: 64, label: 'VAULT STAIRS → WING 3' },
  },
  {
    id: 2,
    name: 'WING 3 — THE SUN VAULT',
    hint: 'Crack the vault (hold E) — twice as fast inside a sunbeam. Then take the SUN OPAL and run for the getaway van.',
    start: { x: 90, y: 620 },
    walls: [
      ...borderWalls(),
      rect(300, 96, 24, 300),
      rect(920, 300, 24, 390),
      rect(480, 520, 300, 24),
    ],
    cover: [
      { x: 180, y: 300, w: 70, h: 46 },
      { x: 560, y: 200, w: 70, h: 46 },
      { x: 760, y: 420, w: 70, h: 46 },
      { x: 1060, y: 160, w: 70, h: 46 },
    ],
    guards: [
      { name: 'CAPTAIN BRASS', boss: true, path: [[640, 180], [1080, 180], [1080, 560], [640, 560]], speed: 82, pause: 0.5 },
      { name: 'ROOK', path: [[420, 620], [420, 160]], speed: 66, pause: 1.0 },
      { name: 'IVY', path: [[820, 160], [820, 460]], speed: 66, pause: 1.0 },
    ],
    cameras: [
      { x: 640, y: 92, base: Math.PI / 2, sweep: 0.7, speed: 0.55, phase: 0 },
      { x: 1180, y: 620, base: Math.PI, sweep: 0.6, speed: 0.65, phase: 1.9 },
    ],
    beams: [
      { x: 560, y: 96, w: 150, h: 400, drift: 30, speed: 0.24, phase: 1.2 },
    ],
    vault: { x: 600, y: 300, w: 90, h: 90, label: 'SUN VAULT' },
    loot: [
      { id: 'opal', name: 'THE SUN OPAL', x: 645, y: 345, value: 5000, kind: 'opal', needsVault: true },
      { id: 'bars', name: 'GOLD BARS', x: 1120, y: 620, value: 1500, kind: 'bars' },
    ],
    exit: { x: 60, y: 120, w: 76, h: 64, label: 'GETAWAY VAN' },
  },
];

export function solidsOf(wing) {
  return [...wing.walls, ...wing.cover];
}

export function blockersOf(wing) {
  return [...wing.walls, ...wing.cover];
}
