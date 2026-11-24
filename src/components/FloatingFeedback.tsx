import React, { useEffect, useState } from 'react';
import { useGameStore } from '../game/store';

export const FloatingFeedback: React.FC = () => {
  const notices = useGameStore((s) => s.notices);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (notices.length === 0) return;
    const timer = window.setInterval(() => setTick((t) => t + 1), 300);
    return () => clearInterval(timer);
  }, [notices.length]);

  const now = Date.now();
  const active = notices.filter((n) => now - n.createdAt < 2300);
  if (active.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-20 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5">
      {active.map((n) => {
        const cls =
          n.kind === 'gold'
            ? 'border-amber-400/50 bg-[#1a1610]/95 text-amber-300'
            : n.kind === 'wood'
              ? 'border-amber-700/60 bg-[#1d1610]/95 text-amber-200'
              : n.kind === 'stone'
                ? 'border-stone-400/50 bg-[#1a1c20]/95 text-stone-200'
                : n.kind === 'scrap'
                  ? 'border-sky-400/50 bg-[#101a23]/95 text-sky-300'
                  : n.kind === 'danger'
                    ? 'border-red-500/60 bg-[#231215]/96 text-red-300'
                    : n.kind === 'wave'
                      ? 'border-sky-400/50 bg-[#111924]/95 text-sky-200'
                      : 'border-white/15 bg-[#11141a]/95 text-stone-200';
        return (
          <div
            key={n.id}
            className={`animate-panel-enter rounded-lg border px-3.5 py-1 text-xs font-semibold shadow-xl ${cls}`}
          >
            {n.text}
          </div>
        );
      })}
    </div>
  );
};
