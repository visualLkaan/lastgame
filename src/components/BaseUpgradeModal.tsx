import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpCircle,
  Check,
  CheckCircle2,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import {
  BASE_LEVEL_COSTS,
  BASE_LEVEL_NAMES,
  BASE_LEVEL_UNLOCKS,
  BASE_MAX_HP_BY_LEVEL,
} from '../game/catalog';
import { useGameStore } from '../game/store';
import { GoldIcon, ScrapIcon, StoneIcon, WoodIcon } from './GameIcons';

const StationTierPreview: React.FC<{ level: number }> = ({ level }) => {
  const isSteel = level >= 3;
  const isFortress = level >= 4;
  const isCitadel = level >= 5;
  const wallFill = isCitadel ? '#1e293b' : isFortress ? '#475569' : isSteel ? '#9ca3af' : level === 2 ? '#c4b7a3' : '#7e838b';
  const fasciaFill = isCitadel ? '#f59e0b' : isFortress ? '#eab308' : level >= 2 ? '#dc2626' : '#7c3f23';
  const canopyFill = isFortress ? '#334155' : isSteel ? '#64748b' : '#78716c';
  const pillarFill = isFortress ? '#f59e0b' : isSteel ? '#334155' : level === 2 ? '#94a3b8' : '#7c3f23';

  return (
    <svg viewBox="0 0 280 155" className="h-36 w-full rounded-xl border border-white/10 bg-[#0b0e14]">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#162033" />
          <stop offset="100%" stopColor="#0d1118" />
        </linearGradient>
      </defs>
      <rect width="280" height="155" fill="url(#skyGrad)" />
      <rect x="0" y="122" width="280" height="33" fill="#292524" />
      <rect x="20" y="118" width="240" height="6" rx="2" fill="#57534e" />

      {/* Store Building */}
      <rect x="44" y={isCitadel ? 36 : 42} width="128" height={isCitadel ? 82 : 76} rx="2" fill={wallFill} stroke="#1f2937" strokeWidth="2" />
      {level >= 3 && (
        <g>
          <rect x="44" y="96" width="128" height="22" fill="#334155" />
          <rect x="44" y="42" width="6" height="76" fill="#1e293b" />
          <rect x="166" y="42" width="6" height="76" fill="#1e293b" />
        </g>
      )}
      {level >= 4 && (
        <g>
          <rect x="42" y="48" width="132" height="10" fill="#1e293b" />
          {/* Exterior Generator on flank */}
          <rect x="28" y="88" width="16" height="30" rx="1.5" fill={isCitadel ? '#334155' : '#f59e0b'} stroke="#0f172a" strokeWidth="1" />
          <rect x="33" y="76" width="4" height="12" fill="#38bdf8" />
        </g>
      )}
      {isCitadel && (
        <g>
          <rect x="40" y="28" width="12" height="90" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" />
          <rect x="164" y="28" width="12" height="90" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" />
          {/* 2nd-story steel catwalk */}
          <rect x="38" y="44" width="140" height="5" fill="#64748b" />
        </g>
      )}
      <rect x="40" y={isCitadel ? 30 : 36} width="136" height="8" rx="1.5" fill={fasciaFill} />

      {/* Lv.4+ Sandbags, Watch Platform & Radar on roof */}
      {level >= 4 && (
        <g>
          {[48, 66, 84, 102, 120, 138, 156].map((sx) => (
            <rect
              key={sx}
              x={sx}
              y={isCitadel ? 24 : 30}
              width="15"
              height="6"
              rx="2.5"
              fill="#a8906e"
              stroke="#574a38"
              strokeWidth="1"
            />
          ))}
          <rect x="142" y={isCitadel ? 16 : 20} width="24" height="12" fill="#334155" stroke="#f59e0b" strokeWidth="1" />
          <line x1="60" y1="28" x2="60" y2="10" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="60" cy="10" r="5" fill={isCitadel ? '#38bdf8' : '#94a3b8'} />
        </g>
      )}

      {/* Lv.5 Twin Solar Panels */}
      {isCitadel && (
        <g>
          <polygon points="74,16 106,16 110,24 70,24" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1" />
          <polygon points="112,16 140,16 144,24 108,24" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1" />
        </g>
      )}

      {/* Store Windows & Door */}
      <rect
        x="56"
        y="58"
        width="32"
        height="24"
        rx="1.5"
        fill={level >= 2 ? '#fbbf24' : '#0f172a'}
        opacity={level >= 2 ? 0.85 : 1}
      />
      <rect
        x="128"
        y="58"
        width="32"
        height="24"
        rx="1.5"
        fill={level >= 2 ? '#fbbf24' : '#0f172a'}
        opacity={level >= 2 ? 0.85 : 1}
      />
      {level === 1 && (
        <g stroke="#5c3a1b" strokeWidth="2.5">
          <line x1="59" y1="60" x2="72" y2="80" />
          <line x1="145" y1="60" x2="132" y2="80" />
        </g>
      )}
      {level === 3 && (
        <g stroke="#1e293b" strokeWidth="2">
          {[62, 70, 78, 134, 142, 150].map((bx) => (
            <line key={bx} x1={bx} y1="58" x2={bx} y2="82" />
          ))}
        </g>
      )}
      {level >= 4 && (
        <g>
          <rect x="55" y="57" width="34" height="13" fill="#1e293b" />
          <rect x="127" y="57" width="34" height="13" fill="#1e293b" />
        </g>
      )}

      <rect
        x="97"
        y="66"
        width="22"
        height="52"
        rx="1"
        fill={level >= 3 ? '#1e293b' : '#78350f'}
        transform={level === 1 ? 'rotate(-5 108 92)' : undefined}
      />
      {level === 2 && <rect x="92" y="61" width="32" height="5" fill="#925e2e" />}
      {level >= 3 && <rect x="94" y="62" width="28" height="5" fill={level >= 4 ? '#f59e0b' : '#334155'} />}

      {/* Fuel Canopy */}
      <rect x="150" y="54" width="104" height="10" rx="2" fill={canopyFill} />
      <rect x="148" y="48" width="108" height="7" rx="1.5" fill={fasciaFill} />
      <rect x="164" y="64" width="7" height="54" fill={pillarFill} />
      <rect x="234" y="64" width="7" height="54" fill={pillarFill} />

      {/* Lv.5 Canopy Spotlight Towers & Fortress Gantry */}
      {isCitadel && (
        <g>
          <rect x="152" y="32" width="5" height="16" fill="#334155" />
          <rect x="149" y="29" width="11" height="4" fill="#fef08a" />
          <rect x="246" y="32" width="5" height="16" fill="#334155" />
          <rect x="243" y="29" width="11" height="4" fill="#fef08a" />
        </g>
      )}

      {/* Lit Signboard */}
      <rect
        x="166"
        y="34"
        width="70"
        height="14"
        rx="2"
        fill="#111827"
        stroke={level >= 2 ? '#f59e0b' : '#4b5563'}
        strokeWidth="1.5"
      />
      <text
        x="201"
        y="43.5"
        textAnchor="middle"
        fill={level >= 3 ? '#fef08a' : '#f59e0b'}
        fontSize="7.5"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        LAST STOP · SV.{level}
      </text>

      {/* Fuel Pumps */}
      <rect x="184" y="88" width="12" height="30" rx="1.5" fill={level >= 2 ? '#dc2626' : '#7c3f23'} />
      <rect x="212" y="88" width="12" height="30" rx="1.5" fill={level >= 2 ? '#dc2626' : '#7c3f23'} />
      <rect x="186" y="92" width="8" height="6" fill={level >= 2 ? '#fde047' : '#334155'} />
      <rect x="214" y="92" width="8" height="6" fill={level >= 2 ? '#fde047' : '#334155'} />

      {/* Perimeter defensive structures on forecourt corners */}
      {level === 2 && (
        <g>
          <rect x="152" y="106" width="18" height="12" rx="1" fill="#925e2e" />
          <rect x="234" y="106" width="18" height="12" rx="1" fill="#925e2e" />
        </g>
      )}
      {level === 3 && (
        <g>
          <rect x="150" y="103" width="20" height="15" rx="1" fill="#78716c" />
          <rect x="234" y="103" width="20" height="15" rx="1" fill="#78716c" />
          <rect x="150" y="100" width="20" height="3" fill="#f59e0b" />
          <rect x="234" y="100" width="20" height="3" fill="#f59e0b" />
        </g>
      )}
      {level >= 4 && (
        <g>
          <rect x="152" y="92" width="12" height="26" fill="#1e293b" />
          <rect x="240" y="92" width="12" height="26" fill="#1e293b" />
          <rect x="152" y="92" width="12" height="4" fill="#f59e0b" />
          <rect x="240" y="92" width="12" height="4" fill="#f59e0b" />
          {isCitadel && <rect x="164" y="90" width="76" height="5" fill="#f59e0b" />}
        </g>
      )}

      {level >= 2 && (
        <ellipse cx="201" cy="118" rx="46" ry="7" fill="#f59e0b" opacity="0.22" />
      )}
    </svg>
  );
};

export const BaseUpgradeModal: React.FC = () => {
  const hud = useGameStore((s) => s.hud);
  const bridge = useGameStore((s) => s.bridge);
  const open = useGameStore((s) => s.baseUpgradeOpen);
  const setOpen = useGameStore((s) => s.setBaseUpgradeOpen);

  if (hud.screen !== 'playing' || !open) return null;

  const isMax = hud.baseLevel >= 5;
  const nextLv = Math.min(5, hud.baseLevel + 1);
  const cost = isMax ? {} : BASE_LEVEL_COSTS[nextLv] || {};
  const unlocks = isMax ? [] : BASE_LEVEL_UNLOCKS[nextLv] || [];
  const currentMaxHp = BASE_MAX_HP_BY_LEVEL[hud.baseLevel] || hud.baseMaxHp;
  const nextMaxHp = BASE_MAX_HP_BY_LEVEL[nextLv] || currentMaxHp;

  const requirements = [
    {
      key: 'wood',
      label: 'Odun',
      required: cost.wood || 0,
      have: hud.wood,
      icon: <WoodIcon className="h-5 w-5" />,
      barColor: 'bg-amber-500',
    },
    {
      key: 'stone',
      label: 'Taş',
      required: cost.stone || 0,
      have: hud.stone,
      icon: <StoneIcon className="h-5 w-5" />,
      barColor: 'bg-stone-300',
    },
    {
      key: 'scrap',
      label: 'Hurda',
      required: cost.scrap || 0,
      have: hud.scrap,
      icon: <ScrapIcon className="h-5 w-5" />,
      barColor: 'bg-sky-400',
    },
    {
      key: 'gold',
      label: 'Altın',
      required: cost.gold || 0,
      have: hud.gold,
      icon: <GoldIcon className="h-5 w-5" />,
      barColor: 'bg-amber-400',
    },
  ].filter((r) => r.required > 0);

  const missingList = requirements
    .filter((r) => r.have < r.required)
    .map((r) => `${r.required - r.have} ${r.label}`);

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
      <div className="animate-panel-enter flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-amber-500/35 bg-[#11141a]/98 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-wide text-stone-100">
                ÜS GELİŞTİRME MERKEZİ
              </h2>
              <p className="text-xs text-stone-400">
                Mevcut Seviye:{' '}
                <span className="font-bold text-amber-400">
                  Sv.{hud.baseLevel}/5 — {BASE_LEVEL_NAMES[hud.baseLevel]}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#181c24] text-stone-300 transition-colors hover:bg-[#232936]"
            title="Kapat (ESC / U)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tier Stepper */}
        <div className="grid grid-cols-5 gap-2 border-b border-white/10 bg-[#0d1016] px-6 py-2.5">
          {[1, 2, 3, 4, 5].map((lv) => {
            const completed = lv < hud.baseLevel;
            const current = lv === hud.baseLevel;
            const target = !isMax && lv === nextLv;
            return (
              <div
                key={lv}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-bold ${
                  current
                    ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                    : target
                      ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                      : completed
                        ? 'border-white/10 bg-[#181c24] text-stone-300'
                        : 'border-white/5 bg-[#12151c] text-stone-500'
                }`}
              >
                {completed && <Check className="h-3 w-3 text-emerald-400" />}
                <span>Sv.{lv}</span>
              </div>
            );
          })}
        </div>

        {/* Main Body */}
        <div className="custom-scroll flex-1 overflow-y-auto p-6">
          {isMax ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-full max-w-md">
                <StationTierPreview level={5} />
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-1.5 text-sm font-bold text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Maksimum Üs Seviyesine Ulaşıldı
              </div>
              <p className="max-w-md text-xs leading-relaxed text-stone-300">
                Benzin istasyonun tüm yapısal zırh, güneş enerjisi ve genişletilmiş inşa alanı
                geliştirmelerine sahip. Savunma kuleleri ve duvarlarla dalgalara karşı koy!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Left: Visual Preview & Unlocks */}
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-stone-400">
                    Sonraki Seviye Önizlemesi
                  </span>
                  <span className="font-display text-base font-bold text-amber-400">
                    Sv.{nextLv} · {BASE_LEVEL_NAMES[nextLv]}
                  </span>
                </div>

                <StationTierPreview level={nextLv} />

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#161a22] px-3.5 py-2.5 text-xs">
                  <span className="text-stone-400">İstasyon Dayanıklılığı</span>
                  <div className="flex items-center gap-2 font-mono-num font-bold">
                    <span className="text-stone-300">{currentMaxHp}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-emerald-400">{nextMaxHp}</span>
                    <span className="text-[10px] text-emerald-500">
                      (+{nextMaxHp - currentMaxHp})
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#161a22] p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Sv.{nextLv} ile Açılacaklar
                  </div>
                  <ul className="mt-2.5 space-y-1.5">
                    {unlocks.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-stone-200">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right: Requirements & Upgrade Action */}
              <div className="flex flex-col justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Gerekli Kaynaklar
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {requirements.map((req) => {
                      const ok = req.have >= req.required;
                      const pct = Math.min(100, (req.have / req.required) * 100);
                      const diff = req.required - req.have;
                      return (
                        <div
                          key={req.key}
                          className={`rounded-xl border p-3 ${
                            ok
                              ? 'border-emerald-500/35 bg-emerald-950/20'
                              : 'border-red-500/35 bg-red-950/15'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              {req.icon}
                              <span className="text-sm font-bold text-stone-100">{req.label}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono-num text-sm font-bold ${
                                  ok ? 'text-emerald-300' : 'text-red-300'
                                }`}
                              >
                                {req.have} / {req.required}
                              </span>
                              {ok ? (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                  <Check className="h-3 w-3" />
                                  Tamam
                                </span>
                              ) : (
                                <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                                  -{diff} Eksik
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-[#1b2029]">
                            <div
                              className={`h-full transition-[width] duration-200 ${
                                ok ? 'bg-emerald-500' : req.barColor
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {missingList.length > 0 && (
                    <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-red-500/35 bg-red-950/30 p-3 text-xs text-red-200">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      <div>
                        <div className="font-bold text-red-300">
                          Eksik Kaynak: {missingList.join(', ')}
                        </div>
                        <div className="mt-0.5 text-[11px] text-red-200/80">
                          Çevredeki ağaçları baltayla, kayaları kazmayla, enkazları kürekle
                          toplayarak gereken malzemeleri tamamlayabilirsin.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-3">
                  <button
                    disabled={!hud.canUpgradeBase}
                    onClick={() => bridge?.upgradeGasStation()}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-extrabold tracking-wide transition-colors ${
                      hud.canUpgradeBase
                        ? 'bg-amber-500 text-stone-950 shadow-lg hover:bg-amber-400'
                        : 'cursor-not-allowed border border-white/10 bg-[#1a1f28] text-stone-500'
                    }`}
                  >
                    <ArrowUpCircle className="h-5 w-5" />
                    {hud.canUpgradeBase
                      ? `ÜSSÜ GELİŞTİR (Sv.${nextLv})`
                      : 'KAYNAKLAR YETERSİZ'}
                  </button>
                  <div className="mt-2 text-center text-[11px] text-stone-400">
                    Geliştirme istasyonu anında yeniler ve tam can ({nextMaxHp} HP) verir.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
