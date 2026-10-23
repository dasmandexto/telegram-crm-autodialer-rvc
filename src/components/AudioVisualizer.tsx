import React, { useEffect, useState } from 'react';

interface AudioVisualizerProps {
  isMuted: boolean;
  isActive: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isMuted, isActive }) => {
  const barCount = 28;
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 8)
  );

  useEffect(() => {
    if (!isActive) {
      setHeights(Array.from({ length: barCount }, () => 6));
      return;
    }

    if (isMuted) {
      // Flat line when muted
      setHeights(Array.from({ length: barCount }, () => 4));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          // Center bars have higher average amplitude
          const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
          const weight = 1 - distFromCenter * 0.5;
          const randomFactor = Math.random();
          const baseHeight = Math.floor(10 + randomFactor * 48 * weight);
          return Math.max(6, baseHeight);
        })
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isActive, isMuted, barCount]);

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-16 px-4 py-2 w-full max-w-md mx-auto">
      {heights.map((h, idx) => (
        <div
          key={idx}
          className={`w-1 sm:w-1.5 rounded-full transition-all duration-150 ${
            isMuted
              ? 'bg-rose-500/40'
              : isActive
              ? 'bg-gradient-to-t from-emerald-500 to-teal-300 shadow-sm shadow-emerald-500/30'
              : 'bg-slate-700'
          }`}
          style={{
            height: `${h}px`,
          }}
        />
      ))}
    </div>
  );
};
