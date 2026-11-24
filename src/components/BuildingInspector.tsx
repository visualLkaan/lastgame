import React from 'react';
import { AlertCircle, ArrowUp, DoorOpen, Trash2, Wrench, X } from 'lucide-react';
import {
  BUILDING_CATALOG,
  getTurretStatsAtLevel,
  isTurretBuilding,
  scaleResourceCost,
  WORKSHOP_LEVEL_UNLOCKS,
} from '../game/catalog';
import { useGameStore } from '../game/store';
import { BuildingPreviewIcon, CostChips } from './GameIcons';

export const BuildingInspector: React.FC = () => {
  const hud = useGameStore((s) => s.hud);
  const bridge = useGameStore((s) => s.bridge);

  if (hud.screen !== 'playing' || !hud.selectedPlacedInfo) return null;

  const placed = hud.selectedPlacedInfo;
  const def = BUILDING_CATALOG[placed.defId];
  const isMax = placed.level >= def.maxLevel;
  const canEvolve = isMax && Boolean(def.evolvesTo);
  const nextTierDef = def.evolvesTo ? BUILDING_CATALOG[def.evolvesTo] : null;

  const upgradeCost =
    canEvolve && nextTierDef
      ? nextTierDef.cost
      : scaleResourceCost(def.cost, placed.level, def.upgradeCostMultiplier);

  const missingResources: string[] = [];
  if (upgradeCost.gold && hud.gold < upgradeCost.gold) {
    missingResources.push(`${upgradeCost.gold - hud.gold} Altın`);
  }
  if (upgradeCost.wood && hud.wood < upgradeCost.wood) {
    missingResources.push(`${upgradeCost.wood - hud.wood} Odun`);
  }
  if (upgradeCost.stone && hud.stone < upgradeCost.stone) {
    missingResources.push(`${upgradeCost.stone - hud.stone} Taş`);
  }
  if (upgradeCost.scrap && hud.scrap < upgradeCost.scrap) {
    missingResources.push(`${upgradeCost.scrap - hud.scrap} Hurda`);
  }
  const baseLocked = Boolean(
    canEvolve && nextTierDef && hud.baseLevel < nextTierDef.requiredBaseLevel,
  );
  const canAffordUpgrade = missingResources.length === 0 && !baseLocked;

  const isTurret = isTurretBuilding(placed.defId);
  const curTurretStats = isTurret ? getTurretStatsAtLevel(placed.defId, placed.level) : null;
  const nextTurretStats =
    isTurret && !isMax ? getTurretStatsAtLevel(placed.defId, placed.level + 1) : null;

  const repairCost = Math.max(5, Math.round(((placed.maxHp - placed.hp) / placed.maxHp) * 20));
  const hpPct = Math.min(100, (placed.hp / placed.maxHp) * 100);

  return (
    <div className="animate-panel-enter pointer-events-auto fixed bottom-24 left-4 z-20 w-80 rounded-2xl border border-amber-500/40 bg-[#11141a]/96 p-4 shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-[#0e1117]">
            <BuildingPreviewIcon id={placed.defId} className="h-5 w-5" />
          </div>
          <div>
            <div className="font-mono-num text-[11px] font-semibold text-amber-400">
              Sv.{placed.level}/{def.maxLevel}
            </div>
            <div className="font-display text-lg font-bold leading-none text-stone-100">
              {def.name}
            </div>
          </div>
        </div>
        <button
          onClick={() => bridge?.clearSelectedPlaced()}
          className="rounded-lg p-1 text-stone-400 transition-colors hover:bg-[#1e232d] hover:text-stone-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-stone-300">
        <span>Dayanıklılık</span>
        <span className="font-mono-num font-semibold">
          {Math.ceil(placed.hp)} / {placed.maxHp}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded bg-[#1b2029]">
        <div
          className={`h-full transition-[width] duration-150 ${
            hpPct > 55 ? 'bg-emerald-500' : hpPct > 25 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${hpPct}%` }}
        />
      </div>

      {/* Turret Combat Stats + Next Level Preview */}
      {curTurretStats && (
        <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl border border-white/8 bg-[#0c0f15] p-2.5 text-[11px]">
          <div>
            <div className="text-stone-500">Hasar</div>
            <div className="font-mono-num font-bold text-stone-100">
              {curTurretStats.damage}
              {nextTurretStats && (
                <span className="ml-1 text-emerald-400">
                  (+{nextTurretStats.damage - curTurretStats.damage})
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-stone-500">Menzil</div>
            <div className="font-mono-num font-bold text-stone-100">
              {curTurretStats.range}m
              {nextTurretStats && (
                <span className="ml-1 text-emerald-400">
                  (+{(nextTurretStats.range - curTurretStats.range).toFixed(1)})
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-stone-500">Atış Hızı</div>
            <div className="font-mono-num font-bold text-stone-100">
              {curTurretStats.fireRate.toFixed(2)}/s
              {nextTurretStats && (
                <span className="ml-1 text-emerald-400">
                  (+{(nextTurretStats.fireRate - curTurretStats.fireRate).toFixed(2)})
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-stone-500">İsabet</div>
            <div className="font-mono-num font-bold text-stone-100">
              %{Math.round((1 - curTurretStats.spread / 0.25) * 100)}
              {nextTurretStats && (
                <span className="ml-1 text-emerald-400">
                  (→%{Math.round((1 - nextTurretStats.spread / 0.25) * 100)})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weapon Workshop Unlocks */}
      {placed.defId === 'weapon_workshop' && !isMax && (
        <div className="mt-3 rounded-xl border border-sky-500/25 bg-sky-950/20 p-2.5 text-[11px] text-sky-200">
          <div className="font-bold text-sky-300">Sv.{placed.level + 1} ile Açılacaklar:</div>
          <div className="mt-0.5 text-stone-300">
            {(WORKSHOP_LEVEL_UNLOCKS[placed.level + 1] || []).join(' · ')}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-1.5">
        {(!isMax || canEvolve) && (
          <>
            <button
              disabled={!canAffordUpgrade}
              onClick={() => bridge?.upgradeSelectedBuilding()}
              className="flex flex-col gap-1 rounded-xl bg-amber-500 px-3 py-2 text-left text-xs font-bold text-stone-950 transition-colors hover:bg-amber-400 disabled:bg-[#1e232d] disabled:text-stone-500"
            >
              <div className="flex items-center gap-1.5">
                <ArrowUp className="h-3.5 w-3.5" />
                {canEvolve && nextTierDef
                  ? `Dönüştür: ${nextTierDef.name}`
                  : `Yükselt (Sv.${placed.level + 1})`}
              </div>
              <div className="rounded-md bg-black/25 px-2 py-0.5">
                <CostChips
                  cost={upgradeCost}
                  gold={hud.gold}
                  wood={hud.wood}
                  stone={hud.stone}
                  scrap={hud.scrap}
                />
              </div>
            </button>

            {baseLocked && nextTierDef && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-950/40 px-2.5 py-1.5 text-[11px] text-red-300">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Üs Sv.{nextTierDef.requiredBaseLevel} gerekli
              </div>
            )}

            {!baseLocked && missingResources.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-950/35 px-2.5 py-1.5 text-[11px] text-red-300">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Eksik: {missingResources.join(', ')}
              </div>
            )}
          </>
        )}

        {placed.hp < placed.maxHp && (
          <button
            disabled={hud.gold < repairCost}
            onClick={() => bridge?.repairSelectedBuilding()}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-[#181c24] px-3 py-2 text-xs font-semibold text-stone-100 transition-colors hover:bg-[#222834] disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-emerald-400" />
              Tamir Et
            </span>
            <span className="font-mono-num text-amber-400">{repairCost} Altın</span>
          </button>
        )}

        {placed.defId === 'metal_gate' && (
          <button
            onClick={() => bridge?.toggleSelectedGate()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-500"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            {placed.isOpen ? 'Kapıyı Kapat' : 'Kapıyı Aç'}
          </button>
        )}

        <button
          onClick={() => bridge?.demolishSelectedBuilding()}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/35 bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-900/50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Yık (%50 İade)
        </button>
      </div>
    </div>
  );
};
