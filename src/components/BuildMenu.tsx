import React from 'react';
import {
  ArrowUpCircle,
  BrickWall,
  Building2,
  Crosshair,
  RotateCcw,
  RotateCw,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { BASE_LEVEL_NAMES, BUILDING_LIST } from '../game/catalog';
import { useGameStore } from '../game/store';
import { BuildingCategory } from '../game/types';
import { BuildingPreviewIcon, CostChips } from './GameIcons';

const TABS: { id: BuildingCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'walls', label: 'Duvarlar', icon: <BrickWall className="h-3.5 w-3.5" /> },
  { id: 'defenses', label: 'Savunmalar', icon: <Crosshair className="h-3.5 w-3.5" /> },
  { id: 'buildings', label: 'Binalar', icon: <Building2 className="h-3.5 w-3.5" /> },
  { id: 'special', label: 'Özel', icon: <Sparkles className="h-3.5 w-3.5" /> },
];

export const BuildMenu: React.FC = () => {
  const hud = useGameStore((s) => s.hud);
  const bridge = useGameStore((s) => s.bridge);
  const activeTab = useGameStore((s) => s.activeBuildTab);
  const setActiveTab = useGameStore((s) => s.setActiveBuildTab);

  if (hud.screen !== 'playing' || !hud.buildMode) return null;

  const items = BUILDING_LIST.filter((b) => b.category === activeTab);
  const isVertical = hud.buildRotation % 2 === 1;

  const canAfford = (cost: { gold?: number; wood?: number; stone?: number; scrap?: number }) => {
    if (cost.gold && hud.gold < cost.gold) return false;
    if (cost.wood && hud.wood < cost.wood) return false;
    if (cost.stone && hud.stone < cost.stone) return false;
    if (cost.scrap && hud.scrap < cost.scrap) return false;
    return true;
  };

  return (
    <div className="animate-panel-enter pointer-events-auto fixed bottom-24 left-1/2 z-20 w-[min(920px,95vw)] -translate-x-1/2 rounded-2xl border border-amber-500/35 bg-[#11141a]/96 p-3.5 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-1.5">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-amber-500 text-stone-950'
                    : 'border border-white/8 bg-[#181c24] text-stone-300 hover:bg-[#222834]'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {hud.selectedBuildId ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-[#181c24] px-2 py-1">
              <button
                onClick={() => bridge?.rotateBuildItem(-1)}
                title="Sola Döndür (Q)"
                className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-[#11141a] text-stone-200 transition-colors hover:border-amber-400 hover:text-amber-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[68px] text-center text-[11px] font-bold text-amber-300">
                {isVertical ? 'Dikey (|)' : 'Yatay (—)'}
              </span>
              <button
                onClick={() => bridge?.rotateBuildItem(1)}
                title="Sağa Döndür (R / E)"
                className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-[#11141a] text-stone-200 transition-colors hover:border-amber-400 hover:text-amber-300"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
              <span className="hidden md:inline pl-1 text-[10px] font-medium text-stone-400">
                Q / E / R
              </span>
            </div>
          ) : null}

          <span className="hidden lg:inline text-[11px] text-stone-400">
            {hud.selectedBuildId
              ? 'Izgaraya tıkla · Sağ tık iptal'
              : 'Yapı seç veya mevcut yapıya tıkla'}
          </span>
          <button
            onClick={() => bridge?.toggleBuildMode(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-[#181c24] text-stone-300 transition-colors hover:bg-[#222834]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="custom-scroll mt-3 flex gap-2.5 overflow-x-auto pb-1">
        {items.map((def) => {
          if (def.isBaseUpgradeAction) {
            const isMax = hud.baseLevel >= 5;
            const affordable = !isMax && hud.canUpgradeBase;
            return (
              <button
                key={def.id}
                onClick={() => useGameStore.getState().setBaseUpgradeOpen(true)}
                className={`flex min-w-[220px] flex-col justify-between rounded-xl border p-3 text-left transition-colors ${
                  isMax
                    ? 'border-emerald-500/35 bg-emerald-950/25 text-emerald-300 hover:bg-emerald-950/40'
                    : affordable
                      ? 'border-amber-500/60 bg-amber-950/35 hover:bg-amber-900/45'
                      : 'border-amber-500/30 bg-[#161a22] hover:border-amber-500/55 hover:bg-[#1d222d]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                    <ArrowUpCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-amber-300">{def.name}</div>
                    <div className="truncate text-[10px] text-stone-400">
                      {isMax
                        ? 'Maks Seviye'
                        : `Sv.${hud.baseLevel + 1}: ${BASE_LEVEL_NAMES[hud.baseLevel + 1]}`}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 border-t border-white/10 pt-2">
                  {isMax ? (
                    <span className="text-[11px] font-semibold text-emerald-400">Tamamlandı</span>
                  ) : (
                    <CostChips
                      cost={hud.baseUpgradeCost}
                      gold={hud.gold}
                      wood={hud.wood}
                      stone={hud.stone}
                      scrap={hud.scrap}
                    />
                  )}
                </div>
              </button>
            );
          }

          const selected = hud.selectedBuildId === def.id;
          const levelLocked = hud.baseLevel < def.requiredBaseLevel;
          const powerShort =
            def.powerUse > 0 && hud.powerUsed + def.powerUse > hud.powerGenerated;
          const affordable = canAfford(def.cost);
          const disabled = levelLocked || powerShort || !affordable;

          return (
            <button
              key={def.id}
              onClick={() => bridge?.selectBuildItem(selected ? null : def.id)}
              className={`flex min-w-[195px] max-w-[210px] flex-col justify-between rounded-xl border p-3 text-left transition-colors ${
                selected
                  ? 'border-amber-400 bg-amber-500/15'
                  : disabled
                    ? 'border-white/10 bg-[#151820] opacity-60 hover:opacity-85'
                    : 'border-white/12 bg-[#181c25] hover:border-amber-500/45 hover:bg-[#1e232e]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-[#0e1117]">
                  <BuildingPreviewIcon id={def.id} className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-stone-100">{def.name}</div>
                  <div className="truncate text-[10px] text-stone-400">{def.shortDesc}</div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                <CostChips
                  cost={def.cost}
                  gold={hud.gold}
                  wood={hud.wood}
                  stone={hud.stone}
                  scrap={hud.scrap}
                />
                {levelLocked ? (
                  <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-red-400">
                    <ShieldAlert className="h-3 w-3" /> Sv.{def.requiredBaseLevel}
                  </span>
                ) : powerShort ? (
                  <span className="shrink-0 text-[10px] font-bold text-red-400">Güç Yok</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
