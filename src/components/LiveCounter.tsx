import React, { useState, useEffect } from 'react';

export function LiveCounter() {
  // Wartość startowa: losowa cyfra z przedziału 134-187
  const [count, setCount] = useState(() => Math.floor(Math.random() * (187 - 134 + 1)) + 134);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateCounter = () => {
      setCount(prev => {
        // Zmiana od -1 do +3
        const change = Math.floor(Math.random() * 5) - 1;
        const next = prev + change;
        // Zabezpieczenie, aby licznik nie spadł poniżej zera
        return next < 0 ? 0 : next;
      });

      // Następna aktualizacja za 3-8 sekund (3000ms - 8000ms)
      const nextInterval = Math.floor(Math.random() * (8000 - 3000 + 1)) + 3000;
      timeoutId = setTimeout(updateCounter, nextInterval);
    };

    // Inicjalizacja pierwszego cyklu
    const initialInterval = Math.floor(Math.random() * (8000 - 3000 + 1)) + 3000;
    timeoutId = setTimeout(updateCounter, initialInterval);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="mx-auto bg-[#0a0a0a] border-2 border-[#FF0033] rounded-2xl p-4 pb-8 max-w-[280px] shadow-[0_0_40px_rgba(255,0,51,0.5),inset_0_0_20px_rgba(255,0,51,0.2)] relative overflow-hidden group">
      {/* Subtelny gradient w tle dla efektu szkła neonowego */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF0033]/10 to-transparent pointer-events-none"></div>
      
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 bg-[#FF0033] rounded-full animate-pulse shadow-[0_0_8px_#FF0033]"></div>
        <span className="text-[#FF0033] text-[8px] font-bold tracking-widest drop-shadow-[0_0_5px_rgba(255,0,51,0.8)]">LIVE</span>
      </div>
      
      <div className="text-5xl font-mono font-black text-[#FF0033] tracking-wider drop-shadow-[0_0_15px_rgba(255,0,51,0.8)] leading-none transition-all duration-300">
        {count}
      </div>
      
      <div className="text-[9px] text-white/80 uppercase tracking-widest mt-3 font-bold leading-none drop-shadow-md">
        Obecnie generowane raporty
      </div>
      
      {/* Fake Slider dots below text */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        <div className="w-4 h-1 bg-[#FF0033] rounded-full shadow-[0_0_5px_rgba(255,0,51,0.8)]"></div>
        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
      </div>
    </div>
  );
}
