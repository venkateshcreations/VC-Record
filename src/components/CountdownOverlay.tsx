import React, { useEffect, useState } from 'react';

interface CountdownOverlayProps {
  initialSeconds: number;
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  initialSeconds,
  onComplete,
}) => {
  const [count, setCount] = useState<number>(initialSeconds);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (count <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center select-none pointer-events-none">
      <div className="relative flex items-center justify-center">
        {/* Animated outer ring */}
        <div className="w-32 h-32 rounded-full border-4 border-red-500/30 animate-ping absolute" />
        <div className="w-28 h-28 rounded-full border-4 border-red-500 flex items-center justify-center bg-black/40 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
          <span className="text-white text-5xl font-extrabold font-mono animate-in zoom-in duration-300">
            {count}
          </span>
        </div>
      </div>
    </div>
  );
};
