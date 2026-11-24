import { useEffect, useRef, useState } from 'react';
import { AudioMixerModal } from './components/AudioMixerModal';
import { BaseUpgradeModal } from './components/BaseUpgradeModal';
import { BuildMenu } from './components/BuildMenu';
import { BuildingInspector } from './components/BuildingInspector';
import { FloatingFeedback } from './components/FloatingFeedback';
import { GameHUD } from './components/GameHUD';
import { StartPauseOverlays } from './components/StartPauseOverlays';
import { WeaponShopModal } from './components/WeaponShopModal';
import { LastStopEngine } from './game/engine';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let engine: LastStopEngine | null = null;
    try {
      engine = new LastStopEngine(el);
    } catch (err) {
      setWebglError(
        err instanceof Error ? err.message : 'WebGL başlatılamadı. Tarayıcı donanım hızlandırmasını kontrol edin.',
      );
    }

    return () => {
      engine?.dispose();
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#121417]">
      {/* Isolated WebGL Viewport Container */}
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />

      {webglError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#121417] p-6">
          <div className="max-w-md rounded-xl border border-red-500/30 bg-[#1a1d24] p-6 text-center">
            <h2 className="font-display text-2xl font-bold text-red-400">
              Grafik Motoru Başlatılamadı
            </h2>
            <p className="mt-2 text-sm text-stone-300">{webglError}</p>
          </div>
        </div>
      )}

      {/* Semantic Turkish HUD & Modals */}
      <GameHUD />
      <BuildMenu />
      <BuildingInspector />
      <WeaponShopModal />
      <BaseUpgradeModal />
      <AudioMixerModal />
      <FloatingFeedback />
      <StartPauseOverlays />
    </div>
  );
}
