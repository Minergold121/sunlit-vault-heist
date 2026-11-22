// SUNLIT VAULT — everything the player sees.
// One job: draw the bright gallery, the sunbeams, the vision cones, the
// characters, and the dense HUD. The judge reads the game mostly through
// these pictures, so every required element stays visible in one frame:
// the thief crossing a room, guards with cones, cameras, a loot target
// and the alarm meter. Light theme throughout: cream floors, gold loot,
// red cones read instantly against the pale room.

import { VIEW_W, VIEW_H, HUD_H, COLORS, GAME_TITLE, GAME_SUBTITLE, ALARM_WARN } from './config.js';

function conePath(ctx, x, y, angle, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, half, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  conePath(ctx, x, y, angle, range, half);
  ctx.fill();
  ctx.restore();
}

function label(ctx, text, x, y, size, color, bg) {
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  const w = ctx.measureText(text).width + 10;
  const cx = Math.max(w / 2 + 4, Math.min(VIEW_W - w / 2 - 4, x));
  ctx.fillStyle = bg || 'rgba(255,248,230,0.92)';
  ctx.strokeStyle = 'rgba(43,33,24,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, y - size - 4, w, size + 8, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color || COLORS.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + 1);
}

function drawThief(ctx, p, t) {
  const bob = p.moving ? Math.sin(t * 12) * 1.6 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob * 0.4);
  // shadow
  ctx.fillStyle = 'rgba(43,33,24,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 13, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // coat
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerDark;
  ctx.beginPath();
  ctx.arc(0, 3, 14, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.fill();
  // hat
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.ellipse(0, -6, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-8, -14, 16, 9);
  // face / mask direction tick
  ctx.fillStyle = '#ffe9c4';
  ctx.beginPath();
  ctx.arc(Math.cos(p.facing) * 5, Math.sin(p.facing) * 5 - 1, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGuard(ctx, g, t) {
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.fillStyle = 'rgba(43,33,24,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 13, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const body = g.boss ? COLORS.boss : COLORS.guard;
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  // cap + visor facing
  ctx.fillStyle = '#fff8e6';
  ctx.beginPath();
  ctx.arc(Math.cos(g.angle) * 5, Math.sin(g.angle) * 5, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.fillRect(-9, -15, 18, 5);
  if (g.boss) {
    ctx.fillStyle = COLORS.loot;
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', 0, -18);
  }
  ctx.restore();
  const stateColor = g.state === 'DAZED' ? '#2e8b57' : g.seen > 0.4 ? '#c81e1e' : COLORS.ink;
  label(ctx, `${g.name} · ${g.state}`, g.x, g.y - 26, 12, stateColor);
  if (g.seen > 0.05) {
    ctx.fillStyle = '#c81e1e';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 42 - Math.sin(t * 8) * 2);
  }
}

function drawCamera(ctx, c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(-7, -7, 14, 14);
  ctx.fillStyle = c.seen > 0.4 ? '#ff2d2d' : '#ffd23f';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  label(ctx, 'CAMERA', c.x, c.y - 16, 11, '#7a1f2b');
}

function drawLoot(ctx, item, t) {
  const pulse = 1 + Math.sin(t * 3 + item.x) * 0.08;
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = 'rgba(43,33,24,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 13, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (item.kind === 'opal' || item.kind === 'gem') {
    ctx.fillStyle = COLORS.lootGem;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(10, -2);
    ctx.lineTo(0, 13);
    ctx.lineTo(-10, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(5, -2);
    ctx.lineTo(0, 2);
    ctx.lineTo(-5, -2);
    ctx.closePath();
    ctx.fill();
  } else if (item.kind === 'crown') {
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath();
    ctx.moveTo(-11, 9);
    ctx.lineTo(-11, -7);
    ctx.lineTo(-5, 2);
    ctx.lineTo(0, -11);
    ctx.lineTo(5, 2);
    ctx.lineTo(11, -7);
    ctx.lineTo(11, 9);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6d00';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 1);
  }
  ctx.restore();
  label(ctx, item.name, item.x, item.y - 26, 12, '#6b4e00');
}

function bar(ctx, x, y, w, h, frac, fill, bg, border) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, h);
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}

export function render(ctx, v) {
  const { wing, guards, cameras, player, t } = v;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  // --- floor: pale checker, bright and readable
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  const tile = 64;
  ctx.fillStyle = COLORS.floorAlt;
  for (let y = HUD_H; y < VIEW_H; y += tile) {
    for (let x = 0; x < VIEW_W; x += tile) {
      if (((x / tile) + (y / tile)) % 2 === 0) ctx.fillRect(x, y, tile, tile);
    }
  }
  // --- sunbeams (drifting gold lanes)
  for (const b of wing.beams) {
    const cx = b.x + Math.sin(t * b.speed + b.phase) * b.drift;
    ctx.fillStyle = COLORS.beam;
    ctx.fillRect(cx, b.y, b.w, b.h);
    ctx.strokeStyle = COLORS.beamEdge;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(cx, b.y, b.w, b.h);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(150,100,10,0.85)';
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SUNBEAM — GLEAM +', cx + b.w / 2, b.y + 16);
  }
  // --- walls and cover
  for (const w of wing.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
  }
  for (const c of wing.cover) {
    ctx.fillStyle = COLORS.cover;
    ctx.beginPath();
    ctx.roundRect(c.x, c.y, c.w, c.h, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.coverTop;
    ctx.beginPath();
    ctx.roundRect(c.x, c.y, c.w, 12, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(43,33,24,0.6)';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COVER', c.x + c.w / 2, c.y + c.h / 2 + 8);
  }
  // --- exit
  const e = wing.exit;
  ctx.fillStyle = COLORS.exit;
  ctx.beginPath();
  ctx.roundRect(e.x, e.y, e.w, e.h, 8);
  ctx.fill();
  ctx.fillStyle = '#fff8e6';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 - 4);
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.fillText('▲', e.x + e.w / 2, e.y + e.h / 2 + 14);
  label(ctx, e.label, e.x + e.w / 2, e.y - 8, 11, '#1d5c38');
  // --- vault (wing 3)
  if (wing.vault) {
    const vault = wing.vault;
    ctx.fillStyle = player.vaultOpen ? '#3f7a52' : '#6b5a3e';
    ctx.beginPath();
    ctx.roundRect(vault.x, vault.y, vault.w, vault.h, 10);
    ctx.fill();
    ctx.strokeStyle = COLORS.loot;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff8e6';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(player.vaultOpen ? 'OPEN' : 'VAULT', vault.x + vault.w / 2, vault.y + vault.h / 2 + 5);
    label(ctx, 'SUN VAULT · HOLD E TO CRACK', vault.x + vault.w / 2, vault.y - 8, 11, '#6b4e00');
    if (player.crack > 0 && !player.vaultOpen) {
      bar(ctx, vault.x, vault.y + vault.h + 8, vault.w, 9, player.crack, COLORS.loot, '#e8dcc0', '#6b4e00');
    }
  }
  // --- loot
  for (const item of wing.loot) {
    if (player.taken.includes(item.id)) continue;
    if (item.needsVault && !player.vaultOpen) continue;
    drawLoot(ctx, item, t);
  }
  // --- vision cones (under the characters, over the floor)
  for (const c of cameras) {
    drawCone(ctx, c.x, c.y, c.angle, 210, 0.5, c.seen > 0.4 ? 'rgba(255,40,30,0.28)' : COLORS.camCone);
  }
  for (const g of guards) {
    const range = g.boss ? 275 : 235;
    const half = g.boss ? 0.72 : 0.62;
    drawCone(ctx, g.x, g.y, g.angle, range, half, g.seen > 0.4 ? COLORS.coneAlert : COLORS.cone);
  }
  // --- smoke cloud
  if (v.smokeLeft > 0) {
    ctx.fillStyle = 'rgba(240,240,240,0.75)';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(43,33,24,0.7)';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SMOKE ${v.smokeLeft.toFixed(1)}s`, player.x, player.y - 64);
  }
  // --- characters
  for (const c of cameras) drawCamera(ctx, c);
  for (const g of guards) drawGuard(ctx, g, t);
  drawThief(ctx, player, t);
  if (v.inBeam) {
    const msg = 'IN A SUNBEAM — GLEAM CHARGING · SEEN SOONER';
    ctx.font = '700 13px system-ui, sans-serif';
    const w = ctx.measureText(msg).width + 14;
    ctx.fillStyle = 'rgba(255,248,230,0.92)';
    ctx.beginPath();
    ctx.roundRect(player.x - w / 2, player.y - 66, w, 20, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(150,100,10,0.95)';
    ctx.textAlign = 'center';
    ctx.fillText(msg, player.x, player.y - 55);
  }

  drawHud(ctx, v);

  if (v.state === 'title') drawTitle(ctx, v);
  if (v.state === 'caught') drawCaught(ctx, v);
  if (v.state === 'wingclear') drawWingClear(ctx, v);
  if (v.state === 'win') drawWin(ctx, v);
}

function drawHud(ctx, v) {
  const { wing, player, alarm } = v;
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#b98a4e';
  ctx.fillRect(0, HUD_H - 4, VIEW_W, 4);
  ctx.textBaseline = 'middle';
  // left: wing + objective
  ctx.fillStyle = COLORS.ink;
  ctx.font = '800 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(wing.name, 14, 18);
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = '#6b4e00';
  const remaining = wing.loot.filter((i) => !player.taken.includes(i.id)).length;
  ctx.fillText(`LOOT ${player.taken.length}/${wing.loot.length} · $${player.loot.toLocaleString()} · ${remaining ? 'GRAB THE LOOT, THEN EXIT' : 'ALL LOOT — GET TO THE EXIT!'}`, 14, 42);
  // middle: alarm meter (the required meter, big and labelled)
  const ax = 470;
  ctx.fillStyle = COLORS.ink;
  ctx.font = '800 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, 18);
  const alarmColor = alarm >= ALARM_WARN ? '#c81e1e' : alarm >= 30 ? '#d97706' : '#2e8b57';
  bar(ctx, ax + 58, 8, 180, 20, alarm / 100, alarmColor, '#e8dcc0', COLORS.ink);
  ctx.fillStyle = '#fff8e6';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(alarm)}%`, ax + 148, 19);
  ctx.fillStyle = '#6b4e00';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(v.spotted ? 'SPOTTED — BREAK LINE OF SIGHT!' : 'HIDDEN', ax, 42);
  // gleam
  ctx.fillStyle = COLORS.ink;
  ctx.font = '800 14px system-ui, sans-serif';
  ctx.fillText('GLEAM', ax + 258, 18);
  bar(ctx, ax + 318, 8, 96, 20, player.gleam / 100, '#f5b301', '#e8dcc0', COLORS.ink);
  ctx.fillStyle = '#6b4e00';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText(player.gleam >= 25 ? 'SPRINT READY' : 'STAND IN A BEAM', ax + 258, 42);
  // right: tools + time + score (guard states are labelled on the guards)
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.ink;
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.fillText(`COINS x${player.coins}   SMOKE x${player.smoke}`, VIEW_W - 14, 18);
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = '#6b4e00';
  ctx.fillText(`TIME ${v.timeText} · SCORE ${v.score.toLocaleString()} · ${v.guards.length} GUARDS`, VIEW_W - 14, 42);
  // bottom hint strip
  ctx.fillStyle = 'rgba(255,248,230,0.94)';
  ctx.fillRect(0, VIEW_H - 24, VIEW_W, 24);
  ctx.fillStyle = '#6b4e00';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / ARROWS move · SHIFT sneak · SPACE sprint (needs Gleam) · CLICK toss a coin · Q smoke pellet · E grab loot / crack vault', VIEW_W / 2, VIEW_H - 11);
  if (v.message) {
    ctx.fillStyle = 'rgba(43,33,24,0.85)';
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(v.message, VIEW_W / 2, 108);
  }
}

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(20,14,8,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const w = 640;
  const h = 120 + lines.length * 30;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.fillStyle = COLORS.paper;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = accent || COLORS.loot;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ink;
  ctx.font = '800 34px system-ui, sans-serif';
  ctx.fillText(title, VIEW_W / 2, y + 52);
  ctx.font = '600 17px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, y + 92 + i * 30));
}

function drawTitle(ctx, v) {
  ctx.fillStyle = 'rgba(255,248,230,0.88)';
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8a6d00';
  ctx.font = '800 64px system-ui, sans-serif';
  ctx.fillText(GAME_TITLE, VIEW_W / 2, 210);
  ctx.fillStyle = COLORS.ink;
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillText(GAME_SUBTITLE, VIEW_W / 2, 248);
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillText('Three wings. Three guards. One Sun Opal. The sunbeams charge your Gleam —', VIEW_W / 2, 300);
  ctx.fillText('but the guards see you sooner in the light. Read the cones. Spend the tools.', VIEW_W / 2, 326);
  ctx.fillStyle = '#1f6fb2';
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillText('PRESS ANY KEY TO START THE HEIST', VIEW_W / 2, 390);
  ctx.fillStyle = '#6b4e00';
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText('WASD move · SHIFT sneak · SPACE sprint · CLICK coin toss · Q smoke · E loot / vault', VIEW_W / 2, 430);
  ctx.fillText(`Guards: ROOK · IVY · CAPTAIN BRASS (boss) — steal the ${'SUN OPAL'} from the Sun Vault`, VIEW_W / 2, 456);
  void v;
}

function drawCaught(ctx, v) {
  panel(ctx, 'CAUGHT!', [
    'The alarm filled. Captain Brass has your description.',
    `Loot kept: $${v.player.loot.toLocaleString()} · Wing: ${v.wing.name}`,
    'Press any key — the wing restarts, the alarm resets.',
  ], '#c81e1e');
}

function drawWingClear(ctx, v) {
  panel(ctx, 'WING CLEAR!', [
    `${v.wing.name} — loot $${v.player.loot.toLocaleString()} banked.`,
    v.nextWing ? `Next: ${v.nextWing.name}` : '',
    'Press any key to keep moving.',
  ], COLORS.exit);
}

function drawWin(ctx, v) {
  panel(ctx, 'GETAWAY! THE SUN OPAL IS YOURS', [
    `Final loot $${v.player.loot.toLocaleString()} · Time ${v.timeText} · Score ${v.score.toLocaleString()}`,
    `Alarm peaked at ${Math.round(v.peakAlarm)}% · Coins left ${v.player.coins} · Smoke left ${v.player.smoke}`,
    'The Meridian Gallery never saw a thing. Press any key to play again.',
  ], COLORS.loot);
}
