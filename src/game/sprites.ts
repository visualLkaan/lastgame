import * as THREE from 'three';
import { ToolId, WeaponId, ZombieType } from './types';

export type PlayerAnimState = 'idle' | 'walk' | 'run' | 'attack' | 'damage' | 'death';
export type ZombieAnimState = 'walk' | 'attack' | 'damage' | 'death';

const texCache = new Map<string, THREE.CanvasTexture>();

function makeCanvas(size = 160): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function finalizeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawWeaponIllustration(
  ctx: CanvasRenderingContext2D,
  item: WeaponId | ToolId,
  swingAngle: number,
) {
  ctx.save();
  ctx.rotate(swingAngle);
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = '#18181b';
  ctx.lineJoin = 'round';

  if (item === 'wooden_bat') {
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(36, -7);
    ctx.arc(36, 0, 7, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, -3.5, 10, 7);
    ctx.strokeRect(0, -3.5, 10, 7);
  } else if (item === 'metal_pipe') {
    ctx.fillStyle = '#94a3b8';
    drawRoundedRect(ctx, -2, -4.5, 42, 9, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#dc2626';
    drawRoundedRect(ctx, 32, -7, 10, 14, 2);
    ctx.fill();
    ctx.stroke();
  } else if (item === 'axe') {
    ctx.fillStyle = '#92400e';
    drawRoundedRect(ctx, -2, -3, 36, 6, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(24, -4);
    ctx.lineTo(37, -15);
    ctx.quadraticCurveTo(42, -5, 34, 4);
    ctx.lineTo(24, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (item === 'pickaxe') {
    ctx.fillStyle = '#92400e';
    drawRoundedRect(ctx, -2, -3, 35, 6, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(28, -16);
    ctx.quadraticCurveTo(36, 0, 28, 16);
    ctx.lineTo(23, 12);
    ctx.quadraticCurveTo(29, 0, 23, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (item === 'shovel') {
    ctx.fillStyle = '#92400e';
    drawRoundedRect(ctx, -2, -2.5, 30, 5, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(26, -7);
    ctx.lineTo(40, -6);
    ctx.lineTo(44, 0);
    ctx.lineTo(40, 6);
    ctx.lineTo(26, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (item === 'jackhammer') {
    ctx.fillStyle = '#facc15';
    drawRoundedRect(ctx, -4, -9, 26, 18, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#27272a';
    drawRoundedRect(ctx, -8, -12, 8, 24, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(22, -4);
    ctx.lineTo(44, 0);
    ctx.lineTo(22, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (item === 'pistol') {
    ctx.fillStyle = '#334155';
    drawRoundedRect(ctx, 2, -6, 20, 8, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    drawRoundedRect(ctx, 2, 1, 8, 10, 2);
    ctx.fill();
    ctx.stroke();
  } else if (item === 'shotgun') {
    ctx.fillStyle = '#78350f';
    drawRoundedRect(ctx, -6, -3, 16, 8, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#475569';
    drawRoundedRect(ctx, 8, -6, 28, 7, 1.5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#b45309';
    drawRoundedRect(ctx, 16, 0, 12, 5, 1.5);
    ctx.fill();
    ctx.stroke();
  } else if (item === 'assault_rifle') {
    ctx.fillStyle = '#1e293b';
    drawRoundedRect(ctx, -6, -5, 36, 8, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(12, 3);
    ctx.lineTo(18, 3);
    ctx.lineTo(21, 15);
    ctx.lineTo(14, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.fillRect(30, -3.5, 11, 4);
    ctx.strokeRect(30, -3.5, 11, 4);
  } else if (item === 'heavy_mg') {
    ctx.fillStyle = '#27272a';
    drawRoundedRect(ctx, -8, -7, 42, 13, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    drawRoundedRect(ctx, 8, 4, 16, 10, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#52525b';
    ctx.fillRect(34, -5, 14, 8);
    ctx.strokeRect(34, -5, 14, 8);
  }
  ctx.restore();
}

export function getPlayerSpriteTexture(
  weapon: WeaponId | ToolId,
  state: PlayerAnimState,
  frame: number,
): THREE.CanvasTexture {
  const key = `player_${weapon}_${state}_${frame}`;
  const cached = texCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(160);
  const cx = 74;
  const baseY = 144;

  // Death animation
  if (state === 'death') {
    const progress = (frame + 1) / 3;
    ctx.save();
    ctx.translate(cx, baseY - 14);
    ctx.rotate(progress * (Math.PI / 2));
    ctx.globalAlpha = 1 - progress * 0.25;
    // Fallen torso
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#141416';
    ctx.fillStyle = '#3b4252';
    drawRoundedRect(ctx, -18, -32, 34, 42, 8);
    ctx.fill();
    ctx.stroke();
    // Head
    ctx.fillStyle = '#eab38f';
    ctx.beginPath();
    ctx.arc(0, -45, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // X eyes
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, -48);
    ctx.lineTo(-2, -44);
    ctx.moveTo(-2, -48);
    ctx.lineTo(-6, -44);
    ctx.moveTo(4, -48);
    ctx.lineTo(8, -44);
    ctx.moveTo(8, -48);
    ctx.lineTo(4, -44);
    ctx.stroke();
    ctx.restore();
    const tex = finalizeTexture(canvas);
    texCache.set(key, tex);
    return tex;
  }

  const walkCycle =
    state === 'walk'
      ? Math.sin((frame / 4) * Math.PI * 2)
      : state === 'run'
        ? Math.sin((frame / 4) * Math.PI * 2) * 1.45
        : 0;
  const bobY =
    state === 'idle'
      ? frame * 2
      : state === 'walk' || state === 'run'
        ? Math.abs(walkCycle) * 5
        : 0;

  const isHurt = state === 'damage';

  ctx.save();
  ctx.translate(cx, baseY - bobY);

  // Subtle lean for running
  if (state === 'run') {
    ctx.rotate(0.12);
  }

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#141416';
  ctx.lineJoin = 'round';

  // Back leg
  ctx.save();
  ctx.translate(-8, -26);
  ctx.rotate(-walkCycle * 0.45);
  ctx.fillStyle = '#1e293b';
  drawRoundedRect(ctx, -6, 0, 12, 24, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#451a03';
  drawRoundedRect(ctx, -7, 19, 15, 8, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Front leg
  ctx.save();
  ctx.translate(8, -26);
  ctx.rotate(walkCycle * 0.45);
  ctx.fillStyle = '#334155';
  drawRoundedRect(ctx, -6, 0, 12, 24, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#78350f';
  drawRoundedRect(ctx, -6, 19, 16, 8, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Backpack
  ctx.fillStyle = '#65a30d';
  drawRoundedRect(ctx, -26, -66, 14, 32, 5);
  ctx.fill();
  ctx.stroke();

  // Torso (survival jacket)
  ctx.fillStyle = isHurt ? '#ef4444' : '#b45309';
  drawRoundedRect(ctx, -18, -72, 36, 48, 9);
  ctx.fill();
  ctx.stroke();

  // Jacket vest / straps detail
  ctx.fillStyle = isHurt ? '#fca5a5' : '#292524';
  ctx.fillRect(-7, -70, 14, 44);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-16, -34, 32, 6);

  // Head
  ctx.fillStyle = isHurt ? '#fca5a5' : '#f1c29b';
  ctx.beginPath();
  ctx.arc(2, -88, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bandana / Scarf
  ctx.fillStyle = '#dc2626';
  drawRoundedRect(ctx, -13, -76, 30, 10, 4);
  ctx.fill();
  ctx.stroke();

  // Baseball cap / visor
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(2, -92, 17.5, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Cap brim
  ctx.fillStyle = '#f59e0b';
  drawRoundedRect(ctx, 6, -94, 18, 6, 2);
  ctx.fill();
  ctx.stroke();

  // Eyes (looking right)
  ctx.fillStyle = '#141416';
  ctx.beginPath();
  ctx.arc(9, -87, 2.5, 0, Math.PI * 2);
  ctx.arc(16, -87, 2.3, 0, Math.PI * 2);
  ctx.fill();

  // Weapon arm & equipped weapon
  let armAngle = 0.08;
  let swingAngle = 0;
  const isMeleeOrTool =
    weapon === 'wooden_bat' ||
    weapon === 'metal_pipe' ||
    weapon === 'axe' ||
    weapon === 'pickaxe' ||
    weapon === 'shovel' ||
    weapon === 'jackhammer';
  if (state === 'attack') {
    if (weapon === 'jackhammer') {
      armAngle = frame === 1 ? 0.28 : 0.14;
      swingAngle = frame === 1 ? 0.15 : 0.05;
    } else if (isMeleeOrTool) {
      armAngle = frame === 0 ? -0.95 : frame === 1 ? 0.38 : 0.88;
      swingAngle = frame === 0 ? -0.6 : frame === 1 ? 0.25 : 0.52;
    } else {
      armAngle = frame === 1 ? -0.18 : 0.0;
      swingAngle = frame === 1 ? -0.1 : 0;
    }
  } else {
    armAngle = walkCycle * 0.18;
  }

  ctx.save();
  ctx.translate(10, -56);
  ctx.rotate(armAngle);
  // Arm sleeve
  ctx.fillStyle = isHurt ? '#ef4444' : '#d97706';
  drawRoundedRect(ctx, -4, -5, 22, 11, 5);
  ctx.fill();
  ctx.stroke();
  // Hand
  ctx.fillStyle = '#f1c29b';
  ctx.beginPath();
  ctx.arc(18, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Weapon / Tool held in hand
  ctx.translate(18, 0);
  drawWeaponIllustration(ctx, weapon, swingAngle);

  // Muzzle flash on firearm attack frame 1
  if (state === 'attack' && frame === 1 && !isMeleeOrTool) {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(42, 0);
    ctx.lineTo(56, -8);
    ctx.lineTo(50, 0);
    ctx.lineTo(60, 4);
    ctx.lineTo(48, 6);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();

  const tex = finalizeTexture(canvas);
  texCache.set(key, tex);
  return tex;
}

export function getZombieSpriteTexture(
  type: ZombieType,
  state: ZombieAnimState,
  frame: number,
): THREE.CanvasTexture {
  const key = `zombie_${type}_${state}_${frame}`;
  const cached = texCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(160);
  const cx = 80;
  const baseY = 144;

  const palette = {
    normal: { skin: '#7ca971', coat: '#475569', pants: '#334155', eye: '#fef08a' },
    runner: { skin: '#a3b18a', coat: '#991b1b', pants: '#1f2937', eye: '#f97316' },
    heavy: { skin: '#658354', coat: '#3f3f46', pants: '#18181b', eye: '#ef4444' },
    boss: { skin: '#4d7c4f', coat: '#450a0a', pants: '#1c1917', eye: '#fde047' },
  }[type];

  if (state === 'death') {
    const progress = (frame + 1) / 3;
    ctx.save();
    ctx.translate(cx, baseY - 12);
    ctx.rotate(-progress * (Math.PI / 2));
    ctx.globalAlpha = 1 - progress * 0.3;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#111827';
    ctx.fillStyle = palette.coat;
    drawRoundedRect(ctx, -18, -36, 36, 44, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = palette.skin;
    ctx.beginPath();
    ctx.arc(0, -48, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    const tex = finalizeTexture(canvas);
    texCache.set(key, tex);
    return tex;
  }

  const cycle = Math.sin((frame / 4) * Math.PI * 2);
  const bob = Math.abs(cycle) * (type === 'runner' ? 7 : 3.5);
  const isHurt = state === 'damage';
  const widthScale = type === 'heavy' ? 1.24 : type === 'boss' ? 1.38 : type === 'runner' ? 0.9 : 1;

  ctx.save();
  ctx.translate(cx, baseY - bob);
  ctx.scale(widthScale, type === 'boss' ? 1.08 : 1);
  if (type === 'runner') ctx.rotate(0.16);
  else ctx.rotate(0.05);

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#111827';
  ctx.lineJoin = 'round';

  // Legs
  ctx.save();
  ctx.translate(-8, -26);
  ctx.rotate(-cycle * 0.45);
  ctx.fillStyle = palette.pants;
  drawRoundedRect(ctx, -6, 0, 12, 25, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(8, -26);
  ctx.rotate(cycle * 0.45);
  ctx.fillStyle = palette.pants;
  drawRoundedRect(ctx, -6, 0, 12, 25, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Torso
  ctx.fillStyle = isHurt ? '#f87171' : palette.coat;
  drawRoundedRect(ctx, -19, -74, 38, 50, 9);
  ctx.fill();
  ctx.stroke();

  // Torn shirt / rib marks for zombie detail
  ctx.fillStyle = isHurt ? '#fecaca' : palette.skin;
  ctx.beginPath();
  ctx.moveTo(-4, -64);
  ctx.lineTo(10, -58);
  ctx.lineTo(2, -46);
  ctx.closePath();
  ctx.fill();

  // Boss shoulder spikes / armor plates
  if (type === 'boss' || type === 'heavy') {
    ctx.fillStyle = type === 'boss' ? '#b91c1c' : '#52525b';
    drawRoundedRect(ctx, -23, -76, 14, 14, 4);
    ctx.fill();
    ctx.stroke();
    drawRoundedRect(ctx, 9, -76, 14, 14, 4);
    ctx.fill();
    ctx.stroke();
  }

  // Head
  ctx.fillStyle = isHurt ? '#fecaca' : palette.skin;
  ctx.beginPath();
  ctx.arc(2, -90, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Boss mutated horns / scars
  if (type === 'boss') {
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(-8, -104);
    ctx.lineTo(-14, -118);
    ctx.lineTo(-2, -107);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Glowing zombie eyes
  ctx.fillStyle = palette.eye;
  ctx.beginPath();
  ctx.arc(9, -91, 3.2, 0, Math.PI * 2);
  ctx.arc(16, -90, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Mouth / teeth
  ctx.fillStyle = '#450a0a';
  drawRoundedRect(ctx, 6, -83, 12, 6, 2);
  ctx.fill();

  // Outstretched zombie arms
  const attackOffset =
    state === 'attack' ? (frame === 1 ? -0.7 : frame === 2 ? 0.35 : -0.2) : cycle * 0.15;

  ctx.save();
  ctx.translate(10, -60);
  ctx.rotate(attackOffset);
  ctx.fillStyle = isHurt ? '#fca5a5' : palette.skin;
  drawRoundedRect(ctx, 0, -5, 28, 10, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  const tex = finalizeTexture(canvas);
  texCache.set(key, tex);
  return tex;
}

export function getCoinTexture(): THREE.CanvasTexture {
  const cached = texCache.get('gold_coin');
  if (cached) return cached;

  const [canvas, ctx] = makeCanvas(96);
  ctx.translate(48, 48);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#78350f';
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(-6, -8, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', 0, 2);

  const tex = finalizeTexture(canvas);
  texCache.set('gold_coin', tex);
  return tex;
}
