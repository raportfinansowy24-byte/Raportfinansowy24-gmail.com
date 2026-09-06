import React, { useState, useEffect } from 'react';

export const Timer = ({ start = true, initialTime = 900 }: { start?: boolean, initialTime?: number }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (!start) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [start]);

  return (
    <div className="flex items-center justify-center gap-2 py-2 bg-[#DC143C]/10 rounded-xl border border-[#DC143C]/20">
      <div className="w-2 h-2 bg-[#DC143C] rounded-full animate-ping"></div>
      <span className="text-[10px] text-white/80 font-bold uppercase tracking-tighter">
        Gwarancja warunków wygasa za: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </span>
    </div>
  );
};
