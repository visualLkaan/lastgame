import React, { useState } from 'react';
import { ArrowUp, ArrowUpCircle, Check, Hammer, Lock, Pin, Swords, Wrench, X } from 'lucide-react';
import {
  TOOL_CATALOG,
  TOOL_ORDER,
  WEAPON_CATALOG,
  WEAPON_ORDER,
  WORKSHOP_LEVEL_UNLOCKS,
} from '../game/catalog';
import { useGameStore } from '../game/store';
import type { EquippedSlot } from '../game/types';
import { CostChips, GoldIcon, ToolPreviewIcon, WeaponPreviewIcon } from './GameIcons';

export const WeaponShopModal: React.FC = () => {
  const hud = useGameStore((s) => s.hud);
  const bridge = useGameStore((s) => s.bridge);
  const open = useGameStore((s) => s.shopOpen);
  const shopTab = useGameStore((s) => s.shopTab);
  const setOpen = useGameStore((s) => s.setShopOpen);
  const setShopTab = useGameStore((s) => s.setShopTab);

  const [targetSlotIdx, setTargetSlotIdx] = useState<number>(0);

  if (!open || hud.screen !== 'playing') return null;

  const findSlotIndexForItem = (item: EquippedSlot): number =>
    hud.inventorySlots.findIndex((s) => s && s.kind === item.kind && s.id === item.id);

  const wsNextLv = Math.min(4, hud.workshopLevel + 1);
  const wsUnlocks = hud.workshopLevel < 4 ? WORKSHOP_LEVEL_UNLOCKS[wsNextLv] || [] : [];
  const wsMissing: string[] = [];
  if (hud.workshopLevel < 4) {
    if (hud.workshopUpgradeCost.gold && hud.gold < hud.workshopUpgradeCost.gold) {
      wsMissing.push(`${hud.workshopUpgradeCost.gold - hud.gold} Altın`);
    }
    if (hud.workshopUpgradeCost.wood && hud.wood < hud.workshopUpgradeCost.wood) {
      wsMissing.push(`${hud.workshopUpgradeCost.wood - hud.wood} Odun`);
    }
    if (hud.workshopUpgradeCost.stone && hud.stone < hud.workshopUpgradeCost.stone) {
      wsMissing.push(`${hud.workshopUpgradeCost.stone - hud.stone} Taş`);
    }
    if (hud.workshopUpgradeCost.scrap && hud.scrap < hud.workshopUpgradeCost.scrap) {
      wsMissing.push(`${hud.workshopUpgradeCost.scrap - hud.scrap} Hurda`);
    }
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
      <div className="animate-panel-enter flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#11141a] p-5 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wide text-stone-100">
              CEPHANELİK VE EKİPMAN
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-400">
              <span className="flex items-center gap-1 font-mono-num font-bold text-amber-400">
                <GoldIcon className="h-3.5 w-3.5" />
                {hud.gold} Altın
              </span>
              <span>·</span>
              <span>
                Silah Atölyesi:{' '}
                <strong className="text-sky-400">
                  {hud.workshopLevel === 0 ? 'Kurulu Değil' : `Sv.${hud.workshopLevel}/4`}
                </strong>
              </span>
              <span>·</span>
              <span className="text-stone-400">Tab veya Esc ile kapat</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShopTab('weapons')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                shopTab === 'weapons'
                  ? 'bg-amber-500 text-stone-950'
                  : 'border border-white/10 bg-[#181c24] text-stone-300 hover:bg-[#222834]'
              }`}
            >
              <Swords className="h-3.5 w-3.5" />
              Silahlar
            </button>
            <button
              onClick={() => setShopTab('tools')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                shopTab === 'tools'
                  ? 'bg-sky-500 text-stone-950'
                  : 'border border-white/10 bg-[#181c24] text-stone-300 hover:bg-[#222834]'
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              Toplama Aletleri
            </button>
            <button
              onClick={() => setOpen(false)}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#181c24] text-stone-300 transition-colors hover:bg-[#222834]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Interactive 6-Slot Loadout Bar */}
        <div className="mt-3.5 rounded-xl border border-white/10 bg-[#161a22] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="font-bold uppercase tracking-wider text-stone-300">
              Envanter Yuvaları (1–6)
            </span>
            <span className="text-stone-400">
              Atamak istediğin yuvayı seç, ardından eşyadaki{' '}
              <strong className="text-amber-300">Yuva {targetSlotIdx + 1}</strong> düğmesine bas.
            </span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {hud.inventorySlots.map((slot, idx) => {
              const isTarget = targetSlotIdx === idx;
              const isEquipped = slot !== null && hud.activeSlotIndex === idx;
              const name = slot
                ? slot.kind === 'weapon'
                  ? WEAPON_CATALOG[slot.id].name
                  : TOOL_CATALOG[slot.id].name
                : 'Boş Yuva';

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setTargetSlotIdx(idx);
                    if (slot) bridge?.selectInventorySlot(idx);
                  }}
                  className={`relative flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                    isTarget
                      ? 'border-amber-400 bg-amber-500/15 text-stone-100'
                      : isEquipped
                        ? 'border-sky-400/60 bg-sky-500/10 text-stone-100'
                        : 'border-white/10 bg-[#101319] text-stone-400 hover:border-white/25'
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-black/40 font-mono-num text-[10px] font-bold text-amber-300">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-semibold leading-tight">
                      {name}
                    </div>
                    <div className="text-[9px] text-stone-500">
                      {isTarget ? 'Hedef Yuva' : slot ? (isEquipped ? 'Elde' : 'Atanmış') : 'Boş'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Weapons or Tools Grid */}
        {shopTab === 'weapons' ? (
          <div className="custom-scroll mt-3.5 flex-1 overflow-y-auto pr-1">
            {/* Weapon Workshop Progression Card */}
            <div className="mb-3.5 rounded-xl border border-sky-500/35 bg-[#131923] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/40 bg-sky-500/15 text-sky-400">
                    <Hammer className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold text-stone-100">
                        SİLAH ATÖLYESİ
                      </span>
                      <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono-num text-[11px] font-bold text-sky-300">
                        {hud.workshopLevel === 0 ? 'Kurulu Değil' : `Sv.${hud.workshopLevel}/4`}
                      </span>
                    </div>
                    {hud.workshopLevel >= 4 ? (
                      <div className="text-xs text-emerald-400">
                        Maksimum seviye — Tüm silahlar ve Sv.5 silah geliştirmeleri açık.
                      </div>
                    ) : (
                      <div className="mt-0.5 text-[11px] text-stone-300">
                        <span className="font-semibold text-amber-300">Sv.{wsNextLv}:</span>{' '}
                        {wsUnlocks.join(' · ')}
                      </div>
                    )}
                  </div>
                </div>

                {hud.workshopLevel < 4 && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="rounded-lg border border-white/10 bg-[#0d1117] px-2.5 py-1.5">
                      <CostChips
                        cost={hud.workshopUpgradeCost}
                        gold={hud.gold}
                        wood={hud.wood}
                        stone={hud.stone}
                        scrap={hud.scrap}
                      />
                    </div>

                    {hud.workshopLevel === 0 ? (
                      <button
                        onClick={() => bridge?.buildWeaponWorkshopShortcut()}
                        className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-extrabold text-stone-950 transition-colors hover:bg-sky-400"
                      >
                        <Hammer className="h-3.5 w-3.5" />
                        Atölye Kur (İnşa)
                      </button>
                    ) : (
                      <button
                        disabled={!hud.workshopCanUpgrade}
                        onClick={() => bridge?.upgradeWeaponWorkshop()}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-extrabold text-stone-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-[#1e232d] disabled:text-stone-500"
                      >
                        <ArrowUpCircle className="h-3.5 w-3.5" />
                        {hud.workshopCanUpgrade
                          ? `Atölyeyi Yükselt (Sv.${wsNextLv})`
                          : 'Kaynak Yetersiz'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {hud.workshopLevel < 4 && wsMissing.length > 0 && (
                <div className="mt-2 text-[11px] text-red-300">
                  Eksik kaynak: <span className="font-semibold">{wsMissing.join(', ')}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {WEAPON_ORDER.map((wId) => {
                const def = WEAPON_CATALOG[wId];
                const owned = hud.ownedWeapons.includes(wId);
                const equipped =
                  hud.equippedSlot.kind === 'weapon' && hud.equippedSlot.id === wId;
                const assignedIdx = findSlotIndexForItem({ kind: 'weapon', id: wId });
                const lv = hud.weaponLevels[wId] || 1;
                const workshopLocked = !owned && hud.workshopLevel < def.requiredWorkshopLevel;
                const canBuy = !owned && !workshopLocked && hud.gold >= def.cost;
                const upgradeCost = 60 + lv * 55;
                const maxAllowedLv = Math.min(5, hud.workshopLevel + 1);
                const upgradeWorkshopCapped = owned && hud.workshopLevel >= 1 && lv >= maxAllowedLv && lv < 5;
                const canUpgrade =
                  owned &&
                  hud.workshopLevel >= 1 &&
                  lv < maxAllowedLv &&
                  hud.gold >= upgradeCost;

                const effectiveDmg = Math.round(def.damage * (1 + (lv - 1) * 0.25));

                return (
                  <div
                    key={wId}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 ${
                      equipped
                        ? 'border-amber-500/60 bg-amber-500/10'
                        : 'border-white/10 bg-[#161a22]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-[#0e1117] text-amber-400">
                            <WeaponPreviewIcon id={wId} className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-display text-lg font-bold leading-none text-stone-100">
                              {def.name}
                            </h3>
                            <span className="text-[11px] text-stone-400">{def.shortDesc}</span>
                          </div>
                        </div>
                        {owned ? (
                          <div className="text-right">
                            <div className="font-mono-num text-xs font-bold text-emerald-400">
                              Sv.{lv}/5
                            </div>
                            {assignedIdx !== -1 && (
                              <div className="font-mono-num text-[10px] text-amber-300">
                                Yuva {assignedIdx + 1}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 font-mono-num text-sm font-bold text-amber-400">
                            <GoldIcon className="h-3.5 w-3.5" />
                            {def.cost}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-[#0e1117] p-2 text-[11px]">
                        <div>
                          <div className="text-stone-500">Hasar</div>
                          <div className="font-mono-num font-bold text-stone-200">
                            {effectiveDmg}
                            {def.pellets > 1 ? `x${def.pellets}` : ''}
                          </div>
                        </div>
                        <div>
                          <div className="text-stone-500">Menzil</div>
                          <div className="font-mono-num font-bold text-stone-200">{def.range}m</div>
                        </div>
                        <div>
                          <div className="text-stone-500">Şarjör</div>
                          <div className="font-mono-num font-bold text-stone-200">
                            {def.magSize === 0 ? '∞' : def.magSize}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {owned ? (
                        <>
                          <button
                            disabled={equipped}
                            onClick={() => bridge?.buyOrEquipWeapon(wId)}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold transition-colors ${
                              equipped
                                ? 'bg-amber-500 text-stone-950'
                                : 'bg-[#252b37] text-stone-100 hover:bg-[#313949]'
                            }`}
                          >
                            {equipped ? (
                              <>
                                <Check className="h-3.5 w-3.5" /> Kuşanıldı
                              </>
                            ) : (
                              'Kuşan'
                            )}
                          </button>

                          <button
                            onClick={() =>
                              bridge?.assignToInventorySlot(
                                { kind: 'weapon', id: wId },
                                targetSlotIdx
                              )
                            }
                            className="flex items-center gap-1 rounded-lg border border-amber-500/35 bg-amber-500/12 px-2.5 py-2 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/22"
                            title={`Yuva ${targetSlotIdx + 1}'e ata`}
                          >
                            <Pin className="h-3.5 w-3.5" />
                            Yuva {targetSlotIdx + 1}
                          </button>

                          <button
                            disabled={!canUpgrade}
                            onClick={() => bridge?.upgradeWeapon(wId)}
                            title={
                              hud.workshopLevel < 1
                                ? 'Silah Atölyesi kurmalısın'
                                : upgradeWorkshopCapped
                                  ? `Sv.${lv + 1} için Atölye Sv.${lv} gerekli`
                                  : `Geliştir (${upgradeCost} Altın)`
                            }
                            className="flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:bg-[#1e232d] disabled:text-stone-500"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                            {lv >= 5
                              ? 'MAKS'
                              : hud.workshopLevel < 1
                                ? 'Atölye Yok'
                                : upgradeWorkshopCapped
                                  ? `Atölye Sv.${lv}`
                                  : `${upgradeCost} A`}
                          </button>
                        </>
                      ) : workshopLocked ? (
                        <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1e232d] px-3 py-2 text-xs font-medium text-red-300">
                          <Lock className="h-3.5 w-3.5" />
                          Silah Atölyesi Sv.{def.requiredWorkshopLevel} Gerekli
                        </div>
                      ) : (
                        <button
                          disabled={!canBuy}
                          onClick={() => bridge?.buyOrEquipWeapon(wId)}
                          className="flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:bg-[#1e232d] disabled:text-stone-500"
                        >
                          {canBuy ? `Satın Al (${def.cost} Altın)` : 'Yetersiz Altın'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="custom-scroll mt-4 grid max-h-[52vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {TOOL_ORDER.map((tId) => {
              const def = TOOL_CATALOG[tId];
              const owned = hud.ownedTools.includes(tId);
              const equipped =
                hud.equippedSlot.kind === 'tool' && hud.equippedSlot.id === tId;
              const assignedIdx = findSlotIndexForItem({ kind: 'tool', id: tId });
              const lv = hud.toolLevels[tId] || 1;
              const canBuy = !owned && hud.gold >= def.cost;
              const upgradeCost = 45 + lv * 45;
              const canUpgrade = owned && lv < 5 && hud.gold >= upgradeCost;

              const effPower = Math.round(def.gatherPower * (1 + (lv - 1) * 0.25));
              const effYield = Math.round(def.yieldBonus * (1 + (lv - 1) * 0.15) * 100);

              return (
                <div
                  key={tId}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 ${
                    equipped
                      ? 'border-sky-500/60 bg-sky-500/10'
                      : 'border-white/10 bg-[#161a22]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-[#0e1117] text-sky-400">
                          <ToolPreviewIcon id={tId} className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-bold leading-none text-stone-100">
                            {def.name}
                          </h3>
                          <span className="text-[11px] text-stone-400">{def.shortDesc}</span>
                        </div>
                      </div>
                      {owned ? (
                        <div className="text-right">
                          <div className="font-mono-num text-xs font-bold text-emerald-400">
                            Sv.{lv}/5
                          </div>
                          {assignedIdx !== -1 && (
                            <div className="font-mono-num text-[10px] text-sky-300">
                              Yuva {assignedIdx + 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 font-mono-num text-sm font-bold text-amber-400">
                          <GoldIcon className="h-3.5 w-3.5" />
                          {def.cost}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-[#0e1117] p-2 text-[11px]">
                      <div>
                        <div className="text-stone-500">Güç</div>
                        <div className="font-mono-num font-bold text-stone-200">{effPower}</div>
                      </div>
                      <div>
                        <div className="text-stone-500">Verim</div>
                        <div className="font-mono-num font-bold text-emerald-400">%{effYield}</div>
                      </div>
                      <div>
                        <div className="text-stone-500">Hedef</div>
                        <div className="truncate font-semibold text-stone-200">{def.targetLabel}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {owned ? (
                      <>
                        <button
                          disabled={equipped}
                          onClick={() => bridge?.buyOrEquipTool(tId)}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold transition-colors ${
                            equipped
                              ? 'bg-sky-500 text-stone-950'
                              : 'bg-[#252b37] text-stone-100 hover:bg-[#313949]'
                          }`}
                        >
                          {equipped ? (
                            <>
                              <Check className="h-3.5 w-3.5" /> Elde
                            </>
                          ) : (
                            'Ele Al'
                          )}
                        </button>

                        <button
                          onClick={() =>
                            bridge?.assignToInventorySlot(
                              { kind: 'tool', id: tId },
                              targetSlotIdx
                            )
                          }
                          className="flex items-center gap-1 rounded-lg border border-sky-500/35 bg-sky-500/12 px-2.5 py-2 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/22"
                          title={`Yuva ${targetSlotIdx + 1}'e ata`}
                        >
                          <Pin className="h-3.5 w-3.5" />
                          Yuva {targetSlotIdx + 1}
                        </button>

                        <button
                          disabled={!canUpgrade}
                          onClick={() => bridge?.upgradeTool(tId)}
                          className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400 disabled:bg-[#1e232d] disabled:text-stone-500"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                          {lv >= 5 ? 'MAKS' : `${upgradeCost} A`}
                        </button>
                      </>
                    ) : (
                      <button
                        disabled={!canBuy}
                        onClick={() => bridge?.buyOrEquipTool(tId)}
                        className="flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:bg-[#1e232d] disabled:text-stone-500"
                      >
                        {canBuy ? `Satın Al (${def.cost} Altın)` : 'Yetersiz Altın'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
