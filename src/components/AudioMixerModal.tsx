import React from 'react';
import { SlidersHorizontal, Volume2, VolumeX, X } from 'lucide-react';
import { useGameStore } from '../game/store';
import type { AudioSettings } from '../game/types';

export const AudioMixerControls: React.FC = () => {
  const hud = useGameStore((s) => s.hud);
  const bridge = useGameStore((s) => s.bridge);
  const settings = hud.audioSettings;

  const update = (patch: Partial<AudioSettings>) => {
    bridge?.setAudioSettings(patch);
  };

  const rows: Array<{
    key: 'masterVolume' | 'musicVolume' | 'sfxVolume' | 'ambientVolume';
    label: string;
    value: number;
  }> = [
    { key: 'masterVolume', label: 'Ana Ses', value: settings.masterVolume },
    { key: 'sfxVolume', label: 'Ses Efektleri', value: settings.sfxVolume },
    { key: 'ambientVolume', label: 'Ortam Sesleri', value: settings.ambientVolume },
    { key: 'musicVolume', label: 'Müzik', value: settings.musicVolume },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#161a22] px-3.5 py-2.5">
        <span className="text-xs font-bold text-stone-200">Genel Ses Durumu</span>
        <button
          onClick={() => bridge?.toggleMute()}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
            settings.muted
              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          {settings.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          {settings.muted ? 'Sessiz' : 'Açık'}
        </button>
      </div>

      {rows.map((row) => {
        const pct = Math.round(row.value * 100);
        return (
          <div
            key={row.key}
            className="rounded-xl border border-white/10 bg-[#161a22] px-3.5 py-2.5"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-200">{row.label}</span>
              <span className="font-mono-num font-bold text-amber-400">%{pct}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={pct}
              onChange={(e) => update({ [row.key]: Number(e.target.value) / 100 })}
              className="mt-2 h-1.5 w-full cursor-pointer accent-amber-500"
            />
          </div>
        );
      })}
    </div>
  );
};

export const AudioMixerModal: React.FC = () => {
  const hud = useGameStore((s) => s.hud);
  const open = useGameStore((s) => s.audioMixerOpen);
  const setOpen = useGameStore((s) => s.setAudioMixerOpen);

  if (hud.screen !== 'playing' || !open) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/65 p-4">
      <div className="animate-panel-enter w-full max-w-sm rounded-2xl border border-white/12 bg-[#11141a]/98 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-amber-400" />
            <h2 className="font-display text-xl font-bold tracking-wide text-stone-100">
              SES AYARLARI
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#181c24] text-stone-300 hover:bg-[#232936]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <AudioMixerControls />
        </div>
      </div>
    </div>
  );
};
