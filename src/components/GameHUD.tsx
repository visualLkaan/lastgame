import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpCircle,
  Hammer,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCw,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  BASE_LEVEL_NAMES,
  TOOL_CATALOG,
  WEAPON_CATALOG,
} from '../game/catalog';
import { useGameStore } from '../game/store';
import type { ToolId, WeaponId } from '../game/types';
import {
  DayPhaseIcon,
  GoldIcon,
  ScrapIcon,
  StoneIcon,
  ToolPreviewIcon,
  WeaponPreviewIcon,
  WoodIcon,
} from './GameIcons';

function shortSlotLabel(name: string): string {
  if (name.length <= 10) return name;
  const first = name.split(' ')[0];
  return first.length <= 10 ? first : `${first.slice(0, 9)}.`;
}

export const GameHUD: React.FC = () => {
  const hud = useGameStore((s) => s.hud);
  const bridge = useGameStore((s) => s.bridge);
  const shopOpen = useGameStore((s) => s.shopOpen);
  const setShopOpen = useGameStore((s) => s.setShopOpen);
  const baseUpgradeOpen = useGameStore((s) => s.baseUpgradeOpen);
  const setBaseUpgradeOpen = useGameStore((s) => s.setBaseUpgradeOpen);
  const audioMixerOpen = useGameStore((s) => s.audioMixerOpen);
  const setAudioMixerOpen = useGameStore((s) => s.setAudioMixerOpen);

  const [baseTrailHp, setBaseTrailHp] = useState(hud.baseHp);
  const [playerTrailHp, setPlayerTrailHp] = useState(hud.playerHp);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Delayed damage-drain trail for Gas Station & Player HP bars
  useEffect(() => {
    if (hud.baseHp > baseTrailHp) {
      setBaseTrailHp(hud.baseHp);
      return;
    }
    if (hud.baseHp < baseTrailHp) {
      const t = window.setTimeout(() => setBaseTrailHp(hud.baseHp), 280);
      return () => window.clearTimeout(t);
    }
  }, [hud.baseHp, baseTrailHp]);

  useEffect(() => {
    if (hud.playerHp > playerTrailHp) {
      setPlayerTrailHp(hud.playerHp);
      return;
    }
    if (hud.playerHp < playerTrailHp) {
      const t = window.setTimeout(() => setPlayerTrailHp(hud.playerHp), 240);
      return () => window.clearTimeout(t);
    }
  }, [hud.playerHp, playerTrailHp]);

  // Refresh clock briefly when recent damage or switch callout is active
  useEffect(() => {
    const activeWindow =
      Date.now() - hud.lastBaseDamageAt < 2500 || Date.now() - hud.lastSwitchAt < 1800;
    if (!activeWindow) return;
    setNowMs(Date.now());
    const interval = window.setInterval(() => setNowMs(Date.now()), 180);
    return () => window.clearInterval(interval);
  }, [hud.lastBaseDamageAt, hud.lastSwitchAt]);

  if (hud.screen === 'title') return null;

  const playerHpPct = Math.max(0, Math.min(100, (hud.playerHp / hud.playerMaxHp) * 100));
  const playerTrailPct = Math.max(
    playerHpPct,
    Math.min(100, (playerTrailHp / hud.playerMaxHp) * 100)
  );
  const playerXpPct = Math.max(0, Math.min(100, (hud.playerXp / hud.playerNextXp) * 100));

  const baseHpPct = Math.max(0, Math.min(100, (hud.baseHp / hud.baseMaxHp) * 100));
  const baseTrailPct = Math.max(
    baseHpPct,
    Math.min(100, (baseTrailHp / hud.baseMaxHp) * 100)
  );
  const staminaPct = Math.max(0, Math.min(100, (hud.stamina / hud.maxStamina) * 100));

  const baseJustHit = nowMs - hud.lastBaseDamageAt < 650;
  const baseUnderAttack = nowMs - hud.lastBaseDamageAt < 2300;
  const showSwitchBanner =
    Boolean(hud.lastSwitchLabel) && nowMs - hud.lastSwitchAt < 1650;

  const baseBarColor =
    baseHpPct > 75
      ? 'bg-emerald-500'
      : baseHpPct > 42
        ? 'bg-amber-500'
        : baseHpPct > 18
          ? 'bg-orange-500'
          : 'bg-red-500';

  const dayLabel =
    hud.dayPhase === 'night' ? 'Gece' : hud.dayPhase === 'dusk' ? 'Akşam' : 'Gündüz';

  const isWeapon = hud.equippedSlot.kind === 'weapon';
  const activeWeaponDef = isWeapon ? WEAPON_CATALOG[hud.equippedSlot.id as WeaponId] : null;
  const activeToolDef = !isWeapon ? TOOL_CATALOG[hud.equippedSlot.id as ToolId] : null;
  const activeLevel = isWeapon
    ? hud.weaponLevels[hud.equippedSlot.id as WeaponId] || 1
    : hud.toolLevels[hud.equippedSlot.id as ToolId] || 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3.5">
      {/* TOP COMMAND BAR */}
      <div className="flex flex-col items-center gap-2">
        <div className="pointer-events-auto flex w-full max-w-[1300px] flex-wrap items-center justify-between gap-3 rounded-xl border border-white/12 bg-[#11141a]/95 px-4 py-2 shadow-2xl">
          {/* 4 Resource Readouts */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2" title="Altın · Silah, alet ve taretler">
              <GoldIcon className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-400">Altın</div>
                <div className="font-mono-num text-sm font-bold text-amber-400 leading-tight">
                  {hud.gold}
                  <span className="text-[11px] font-normal text-stone-500">/{hud.goldCap}</span>
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-white/10" />

            <div className="flex items-center gap-2" title="Odun · Çam ağaçlarından toplanır">
              <WoodIcon className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-400">Odun</div>
                <div className="font-mono-num text-sm font-bold text-amber-200 leading-tight">
                  {hud.wood}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2" title="Taş · Kaya ve cevherlerden toplanır">
              <StoneIcon className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-400">Taş</div>
                <div className="font-mono-num text-sm font-bold text-stone-200 leading-tight">
                  {hud.stone}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2" title="Hurda · Enkaz ve toprak yığınlarından">
              <ScrapIcon className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-400">Hurda</div>
                <div className="font-mono-num text-sm font-bold text-sky-300 leading-tight">
                  {hud.scrap}
                </div>
              </div>
            </div>
          </div>

          {/* Wave Status & System Controls */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 pr-1">
              <DayPhaseIcon phase={hud.dayPhase} className="h-4 w-4" />
              <div className="text-right">
                <div className="text-[10px] text-stone-400">
                  {dayLabel} · {hud.totalKills} Leş
                </div>
                <div className="font-display text-lg font-bold tracking-wide text-stone-100 leading-none">
                  {hud.wave}. DALGA
                </div>
              </div>
            </div>

            {hud.waveState === 'prep' ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end text-right">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-300">
                    {hud.nextWaveHasBoss && (
                      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] text-red-300">
                        BOSS
                      </span>
                    )}
                    {hud.nextWaveIsNight && (
                      <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] text-sky-300">
                        GECE
                      </span>
                    )}
                    <span className="text-amber-300">Hazırlık</span>
                  </div>
                  <div className="mt-0.5 h-1 w-24 overflow-hidden rounded bg-[#1b2029]">
                    <div
                      className="h-full bg-amber-400 transition-[width] duration-200"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, (hud.prepCountdown / Math.max(1, hud.prepDuration)) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => bridge?.startWaveNow()}
                  title={`Sıradaki: ${hud.nextWaveTitle} — Erken başlatmak için tıkla`}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-950 transition-colors hover:bg-amber-400 whitespace-nowrap"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Başlat ({hud.prepCountdown}s)
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-red-500/35 bg-red-950/60 px-3 py-1.5 font-mono-num text-xs font-bold text-red-300">
                Zombi: {hud.zombiesRemaining}
              </div>
            )}

            <div className="hidden sm:flex items-center rounded-lg border border-white/10 bg-[#181c24] p-0.5">
              <button
                onClick={() => bridge?.adjustCameraZoom(-1)}
                title="Yakınlaştır (+)"
                className="flex h-7 w-7 items-center justify-center rounded text-stone-300 hover:bg-white/10 hover:text-stone-100"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => bridge?.adjustCameraZoom(1)}
                title="Uzaklaştır (-)"
                className="flex h-7 w-7 items-center justify-center rounded text-stone-300 hover:bg-white/10 hover:text-stone-100"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={() => setAudioMixerOpen(!audioMixerOpen)}
              title="Ses Ayarları"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                audioMixerOpen
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                  : 'border-white/10 bg-[#181c24] text-stone-200 hover:bg-[#222834]'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <button
              onClick={() => bridge?.toggleMute()}
              title={hud.muted ? 'Sesi Aç' : 'Sesi Kapat'}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#181c24] text-stone-200 transition-colors hover:bg-[#222834]"
            >
              {hud.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => bridge?.setPaused(hud.screen !== 'paused')}
              title="Duraklat (ESC)"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#181c24] text-stone-200 transition-colors hover:bg-[#222834]"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tutorial Hint */}
        {hud.tutorialHint && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-amber-500/40 bg-[#1a1711]/95 px-3.5 py-1.5 text-xs font-medium text-amber-200 shadow-lg">
            <span>{hud.tutorialHint}</span>
            <button
              onClick={() => bridge?.dismissTutorial()}
              className="rounded p-0.5 text-amber-300/70 hover:text-amber-100"
              title="Kapat"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* MIDDLE FLANKS: LEFT (Survivor) & RIGHT (Gas Station Status) */}
      <div className="flex items-start justify-between gap-4">
        {/* LEFT: Survivor Panel */}
        <div className="pointer-events-auto w-56 rounded-xl border border-white/12 bg-[#11141a]/94 p-3 shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-100">Karakter Sv.{hud.playerLevel}</span>
            <span className="font-mono-num font-semibold text-emerald-400">
              {hud.playerHp}/{hud.playerMaxHp}
            </span>
          </div>
          <div className="relative mt-1.5 h-2.5 w-full overflow-hidden rounded bg-[#1b2029]">
            <div
              className="absolute inset-y-0 left-0 bg-red-400/70 transition-[width] duration-300"
              style={{ width: `${playerTrailPct}%` }}
            />
            <div
              className="relative h-full bg-emerald-500 transition-[width] duration-150"
              style={{ width: `${playerHpPct}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[10px] text-stone-400">
            <span>Deneyim (XP)</span>
            <span className="font-mono-num">
              {hud.playerXp}/{hud.playerNextXp}
            </span>
          </div>
          <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded bg-[#1b2029]">
            <div
              className="h-full bg-amber-400 transition-[width] duration-150"
              style={{ width: `${playerXpPct}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400">
            <span>Enerji (Space)</span>
            <span className="font-mono-num">{hud.stamina}%</span>
          </div>
          <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded bg-[#1b2029]">
            <div
              className="h-full bg-sky-400 transition-[width] duration-100"
              style={{ width: `${staminaPct}%` }}
            />
          </div>
        </div>

        {/* RIGHT: Gas Station Integrity Panel */}
        <div
          key={baseJustHit ? `hit-${hud.lastBaseDamageAt}` : 'base-card'}
          className={`pointer-events-auto w-64 rounded-xl border p-3 shadow-xl transition-colors duration-200 ${
            baseJustHit ? 'animate-hit-shake' : ''
          } ${
            baseJustHit
              ? 'border-red-500/85 bg-[#231417]/96'
              : baseUnderAttack
                ? 'border-orange-500/60 bg-[#1a1514]/95'
                : 'border-white/12 bg-[#11141a]/94'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-amber-400">
              <Shield className="h-3.5 w-3.5" />
              Üs Sv.{hud.baseLevel}/5
            </span>
            <span
              className={`font-mono-num font-bold ${
                baseUnderAttack ? 'text-red-300' : 'text-stone-200'
              }`}
            >
              {hud.baseHp}/{hud.baseMaxHp}
            </span>
          </div>

          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span className="truncate text-[11px] text-stone-400">
              {BASE_LEVEL_NAMES[hud.baseLevel]}
            </span>
            {baseUnderAttack && (
              <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-400">
                <AlertTriangle className="h-3 w-3" />
                Saldırı Altında
              </span>
            )}
          </div>

          {/* Animated Damage-Drain Health Bar */}
          <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded bg-[#1b2029]">
            <div
              className="absolute inset-y-0 left-0 bg-red-400/80 transition-[width] duration-300"
              style={{ width: `${baseTrailPct}%` }}
            />
            <div
              className={`relative h-full transition-[width,background-color] duration-150 ${
                baseJustHit ? 'bg-white' : baseBarColor
              }`}
              style={{ width: `${baseHpPct}%` }}
            />
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center text-[10px]">
            <div className="rounded-md bg-[#181c24] px-1.5 py-1">
              <div className="text-stone-400">Duvar</div>
              <div className="font-mono-num font-bold text-stone-200">{hud.wallCount}</div>
            </div>
            <div className="rounded-md bg-[#181c24] px-1.5 py-1">
              <div className="text-stone-400">Taret</div>
              <div className="font-mono-num font-bold text-amber-300">{hud.turretCount}</div>
            </div>
            <div className="rounded-md bg-[#181c24] px-1.5 py-1">
              <div className="flex items-center justify-center gap-0.5 text-stone-400">
                <Zap className="h-2.5 w-2.5 text-yellow-400" /> Güç
              </div>
              <div
                className={`font-mono-num font-bold ${
                  hud.powerUsed > hud.powerGenerated ? 'text-red-400' : 'text-stone-200'
                }`}
              >
                {hud.powerUsed}/{hud.powerGenerated}
              </div>
            </div>
          </div>

          <button
            onClick={() => setBaseUpgradeOpen(!baseUpgradeOpen)}
            title="Üs Geliştirme Panelini Aç (U)"
            className={`mt-2.5 flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs font-extrabold transition-colors ${
              hud.baseLevel >= 5
                ? 'border-emerald-500/35 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50'
                : hud.canUpgradeBase
                  ? 'border-amber-400 bg-amber-500 text-stone-950 hover:bg-amber-400'
                  : 'border-amber-500/45 bg-[#1b1f29] text-amber-300 hover:border-amber-400 hover:bg-[#232836]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ArrowUpCircle className="h-4 w-4 shrink-0" />
              ÜS GELİŞTİRME
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                hud.baseLevel >= 5
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : hud.canUpgradeBase
                    ? 'bg-stone-950/20 text-stone-950'
                    : 'bg-white/8 text-stone-300'
              }`}
            >
              {hud.baseLevel >= 5 ? 'Maks' : hud.canUpgradeBase ? 'Hazır!' : 'U'}
            </span>
          </button>

          {hud.baseHp < hud.baseMaxHp && (
            <button
              onClick={() => bridge?.repairGasStation()}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-[#1a1d24] py-1.5 text-[11px] font-semibold text-amber-300 transition-colors hover:bg-[#232832]"
            >
              <Wrench className="h-3.5 w-3.5" />
              İstasyonu Tamir Et (Odun)
            </button>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Node Indicator, Switch Banner, Unified 6-Slot Hotbar */}
      <div className="flex flex-col items-center gap-2">
        {/* Nearby Resource Node Interactive Indicator */}
        {hud.nearbyNode && !hud.buildMode && (
          <div className="pointer-events-none flex items-center gap-3 rounded-xl border border-amber-500/40 bg-[#11141a]/95 px-3.5 py-2 shadow-xl">
            <ToolPreviewIcon
              id={hud.nearbyNode.requiredTool}
              className={`h-5 w-5 ${hud.nearbyNode.hasTool ? 'text-amber-400' : 'text-red-400'}`}
            />
            <div className="min-w-[175px]">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-stone-100">{hud.nearbyNode.name}</span>
                <span className="font-mono-num text-[10px] text-stone-400">
                  {hud.nearbyNode.hp}/{hud.nearbyNode.maxHp}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-[#1b2029]">
                <div
                  className={`h-full transition-[width] duration-75 ${
                    hud.nearbyNode.isGathering ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${
                      hud.nearbyNode.isGathering
                        ? hud.nearbyNode.progress * 100
                        : (hud.nearbyNode.hp / hud.nearbyNode.maxHp) * 100
                    }%`,
                  }}
                />
              </div>
              <div className="mt-1 text-[10px] text-stone-300">
                {hud.nearbyNode.hasTool
                  ? `[E] veya [Sol Tık] ile topla · ${hud.nearbyNode.requiredToolName}`
                  : `${hud.nearbyNode.requiredToolName} Gerekli · Cephanelik (Tab)`}
              </div>
            </div>
          </div>
        )}

        {/* Contextual Gate / Med / Repair Prompt */}
        {hud.nearPrompt && !hud.nearbyNode && (
          <div className="rounded-lg border border-amber-500/40 bg-[#11141a]/95 px-3.5 py-1 text-xs font-semibold text-amber-300 shadow-lg">
            {hud.nearPrompt}
          </div>
        )}

        {/* Brief Item Switch Callout */}
        {showSwitchBanner && hud.lastSwitchLabel && (
          <div
            key={`switch-${hud.lastSwitchAt}`}
            className="animate-switch-pop rounded-lg border border-amber-400/45 bg-[#11141a]/95 px-3.5 py-1 text-xs font-bold tracking-wide text-amber-300 shadow-lg"
          >
            {hud.lastSwitchLabel}
          </div>
        )}

        {/* Unified Bottom Dock: Active Info + 6-Slot Inventory (1-6) + Primary Actions */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/12 bg-[#11141a]/96 px-3.5 py-2 shadow-2xl">
          {/* Active Equipment Summary */}
          <div className="flex items-center gap-2.5 border-r border-white/10 pr-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isWeapon
                  ? 'border-amber-500/40 bg-amber-500/12 text-amber-400'
                  : 'border-sky-500/40 bg-sky-500/12 text-sky-400'
              }`}
            >
              {isWeapon ? (
                <WeaponPreviewIcon id={hud.equippedSlot.id as WeaponId} className="h-5 w-5" />
              ) : (
                <ToolPreviewIcon id={hud.equippedSlot.id as ToolId} className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-[92px]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                {isWeapon ? 'Silah' : 'Alet'} · Sv.{activeLevel}
              </div>
              <div className="font-display text-base font-bold leading-tight text-stone-100">
                {activeWeaponDef ? activeWeaponDef.name : activeToolDef?.name}
              </div>
            </div>

            {activeWeaponDef?.kind === 'firearm' && (
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-white/10 bg-[#181c24] px-2 py-1 font-mono-num text-xs font-bold text-amber-400">
                  {hud.isReloading ? '...' : `${hud.ammoInMag}/${hud.maxMag}`}
                </span>
                <button
                  onClick={() => bridge?.reloadWeapon()}
                  title="Şarjör Değiştir (R)"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#181c24] text-stone-300 transition-colors hover:bg-[#232834]"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Unified 6 Inventory Slots (Keys 1-6) */}
          <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
            {hud.inventorySlots.map((slot, idx) => {
              const active = slot !== null && hud.activeSlotIndex === idx;
              if (!slot) {
                return (
                  <button
                    key={idx}
                    onClick={() => setShopOpen(true, 'weapons')}
                    title={`Yuva ${idx + 1} (Boş) — Cephanelikten eşya ata`}
                    className="relative flex h-12 w-14 flex-col items-center justify-center rounded-xl border border-dashed border-white/12 bg-[#0b0d11]/85 text-stone-600 transition-colors hover:border-white/25 hover:text-stone-400"
                  >
                    <span className="absolute top-1 left-1.5 font-mono-num text-[9px] font-bold text-stone-500">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-medium">Boş</span>
                  </button>
                );
              }

              const slotIsWeapon = slot.kind === 'weapon';
              const wDef = slotIsWeapon ? WEAPON_CATALOG[slot.id] : null;
              const tDef = !slotIsWeapon ? TOOL_CATALOG[slot.id] : null;
              const label = wDef ? wDef.name : tDef ? tDef.name : '';
              const slotLv = slotIsWeapon
                ? hud.weaponLevels[slot.id] || 1
                : hud.toolLevels[slot.id] || 1;

              return (
                <button
                  key={idx}
                  onClick={() => bridge?.selectInventorySlot(idx)}
                  title={`${label} · Sv.${slotLv} (${idx + 1})`}
                  className={`relative flex h-12 w-16 flex-col items-center justify-center rounded-xl border px-1.5 transition-all duration-150 ${
                    active
                      ? slotIsWeapon
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-md -translate-y-0.5'
                        : 'border-sky-400 bg-sky-500/20 text-sky-200 shadow-md -translate-y-0.5'
                      : 'border-white/12 bg-[#181c24] text-stone-200 hover:border-white/25 hover:bg-[#202631]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1.5 font-mono-num text-[9px] font-bold ${
                      active
                        ? slotIsWeapon
                          ? 'text-amber-300'
                          : 'text-sky-300'
                        : 'text-stone-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="absolute top-1 right-1.5 font-mono-num text-[9px] font-semibold text-stone-400">
                    {slotLv > 1 ? `S${slotLv}` : ''}
                  </span>
                  <div className="mt-1">
                    {slotIsWeapon ? (
                      <WeaponPreviewIcon
                        id={slot.id}
                        className={`h-4 w-4 ${active ? 'text-amber-300' : 'text-amber-400/85'}`}
                      />
                    ) : (
                      <ToolPreviewIcon
                        id={slot.id}
                        className={`h-4 w-4 ${active ? 'text-sky-300' : 'text-sky-400/85'}`}
                      />
                    )}
                  </div>
                  <span className="mt-0.5 w-full truncate text-center text-[9px] font-semibold leading-none">
                    {shortSlotLabel(label)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShopOpen(!shopOpen, 'weapons')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors whitespace-nowrap ${
                shopOpen
                  ? 'bg-sky-500 text-stone-950'
                  : 'border border-white/12 bg-[#181c24] text-stone-100 hover:bg-[#232834]'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Cephanelik (Tab)
            </button>

            <button
              onClick={() => bridge?.toggleBuildMode()}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors whitespace-nowrap ${
                hud.buildMode
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              <Hammer className="h-4 w-4" />
              {hud.buildMode ? 'Kapat (B)' : 'İnşa Et (B)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
