import React from 'react';
import { Play, RotateCcw, Shield, Skull } from 'lucide-react';
import { useGameStore } from '../game/store';
import { AudioMixerControls } from './AudioMixerModal';

export const StartPauseOverlays: React.FC = () => {
  const hud = useGameStore((s) => s.hud);
  const hasSave = useGameStore((s) => s.hasSave);
  const bridge = useGameStore((s) => s.bridge);

  if (hud.screen === 'playing') return null;

  if (hud.screen === 'title') {
    return (
      <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
        <div className="animate-panel-enter w-full max-w-lg rounded-2xl border border-amber-500/35 bg-[#11141a]/97 p-7 shadow-2xl">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
            2.5D Zombi Hayatta Kalma ve Üs Savunma
          </div>
          <h1 className="font-display mt-1 text-6xl font-extrabold tracking-tight text-stone-100">
            LAST STOP
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-300">
            Terk edilmiş yol kenarı benzin istasyonunu zombi kıyametinin son kalesine dönüştür.
            Kaynak topla, silah kuşan, duvarlar ör ve otomatik taretlerle istasyonu savun.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 rounded-xl border border-white/10 bg-[#0b0d11] p-3.5 text-xs text-stone-300">
            <div>
              <strong className="text-amber-400">WASD</strong> — Hareket
            </div>
            <div>
              <strong className="text-amber-400">Sol Tık / E</strong> — Saldır / Topla
            </div>
            <div>
              <strong className="text-amber-400">1–6 / Tekerlek</strong> — Envanter
            </div>
            <div>
              <strong className="text-amber-400">B / Tab / U</strong> — İnşa / Cephanelik / Üs
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            {hasSave && (
              <button
                onClick={() => bridge?.continueSavedGame()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-bold text-stone-950 transition-colors hover:bg-amber-400"
              >
                <Play className="h-4 w-4 fill-current" />
                Kayıttan Devam Et
              </button>
            )}

            <button
              onClick={() => bridge?.startNewGame()}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-colors ${
                hasSave
                  ? 'border border-white/15 bg-[#1a1f28] text-stone-100 hover:bg-[#232936]'
                  : 'bg-amber-500 text-stone-950 hover:bg-amber-400'
              }`}
            >
              {hasSave ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              {hasSave ? 'Yeni Oyun Başlat (Sıfırla)' : 'Hayatta Kalmaya Başla'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hud.screen === 'paused') {
    return (
      <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
        <div className="animate-panel-enter w-full max-w-md rounded-2xl border border-white/12 bg-[#11141a] p-6 shadow-2xl">
          <h2 className="font-display text-3xl font-bold text-stone-100">OYUN DURAKLATILDI</h2>
          <p className="mt-1 text-xs text-stone-400">
            Dalga {hud.wave} · Üs Seviyesi {hud.baseLevel} · {hud.gold} Altın
          </p>

          <div className="mt-4">
            <AudioMixerControls />
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              onClick={() => bridge?.setPaused(false)}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-950 transition-colors hover:bg-amber-400"
            >
              <Play className="h-4 w-4 fill-current" />
              Devam Et
            </button>

            <button
              onClick={() => bridge?.startNewGame()}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-900/50"
            >
              <RotateCcw className="h-4 w-4" />
              Oyunu Sıfırla
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
      <div className="animate-panel-enter w-full max-w-md rounded-2xl border border-red-500/40 bg-[#11141a] p-7 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <Skull className="h-6 w-6" />
        </div>
        <h2 className="font-display mt-3 text-4xl font-extrabold text-red-400">ÜS DÜŞTÜ</h2>
        <p className="mt-1 text-sm text-stone-300">
          Zombiler savunmayı aştı. İstasyon düştü ama mücadeleye yeniden başlayabilirsin.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-[#0b0d11] p-3 text-xs">
          <div>
            <div className="text-stone-400">Ulaşılan Dalga</div>
            <div className="font-mono-num mt-0.5 text-lg font-bold text-amber-400">{hud.wave}</div>
          </div>
          <div>
            <div className="text-stone-400">Toplam Leş</div>
            <div className="font-mono-num mt-0.5 text-lg font-bold text-stone-100">
              {hud.totalKills}
            </div>
          </div>
          <div>
            <div className="text-stone-400">Üs Seviyesi</div>
            <div className="font-mono-num mt-0.5 flex items-center justify-center gap-1 text-lg font-bold text-emerald-400">
              <Shield className="h-4 w-4" />
              {hud.baseLevel}
            </div>
          </div>
        </div>

        <button
          onClick={() => bridge?.startNewGame()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-stone-950 transition-colors hover:bg-amber-400"
        >
          <RotateCcw className="h-4 w-4" />
          Yeniden Başla
        </button>
      </div>
    </div>
  );
};
