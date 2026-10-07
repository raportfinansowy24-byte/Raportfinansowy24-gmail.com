import React from 'react';
import { TrendingUp, ShieldCheck, Activity, Award, Percent } from 'lucide-react';

interface MarketItem {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

const MARKET_ITEMS: MarketItem[] = [
  {
    label: 'Stopa referencyjna NBP',
    value: '5,75%',
    sub: 'RPP',
    icon: <Percent className="w-3 h-3 text-[#DC143C]" />,
    highlight: true
  },
  {
    label: 'WIBOR 3M',
    value: '5,85%',
    sub: 'Rynek',
    icon: <TrendingUp className="w-3 h-3 text-amber-400" />
  },
  {
    label: 'WIBOR 6M',
    value: '5,84%',
    sub: 'Rynek',
    icon: <TrendingUp className="w-3 h-3 text-amber-400" />
  },
  {
    label: 'Gwarancja BFG',
    value: 'do 100 000 EUR',
    sub: '100% ochrony',
    icon: <ShieldCheck className="w-3 h-3 text-emerald-400" />
  },
  {
    label: 'Najwyższa premia za konto',
    value: 'do 650 zł',
    sub: 'Bonusy bankowe',
    icon: <Award className="w-3 h-3 text-amber-400" />,
    highlight: true
  },
  {
    label: 'Konta osobiste',
    value: '0 zł prowadzenie',
    sub: 'Konta bez opłat',
    icon: <Activity className="w-3 h-3 text-blue-400" />
  }
];

export const LiveMarketTicker: React.FC = () => {
  return (
    <div className="w-full bg-[#121216]/90 border-y border-white/[0.06] overflow-hidden py-1.5 backdrop-blur-md relative">
      {/* Subtle fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none" />

      <div className="flex items-center">
        {/* Static live badge */}
        <div className="flex items-center gap-1.5 px-3 py-0.5 shrink-0 z-20 border-r border-white/10 bg-[#121216]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
            Puls Rynku
          </span>
        </div>

        {/* Marquee Track with infinite seamless animation */}
        <div className="flex overflow-hidden select-none group">
          <div className="flex shrink-0 items-center gap-6 animate-marquee group-hover:[animation-play-state:paused] pl-4">
            {MARKET_ITEMS.map((item, idx) => (
              <div 
                key={`item-1-${idx}`} 
                className="inline-flex items-center gap-2 text-xs font-mono whitespace-nowrap text-zinc-300"
              >
                <span className="p-1 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  {item.icon}
                </span>
                <span className="text-zinc-400 text-[11px] font-sans font-medium">{item.label}:</span>
                <span className={`font-bold ${item.highlight ? 'text-white' : 'text-zinc-200'}`}>{item.value}</span>
                {item.sub && (
                  <span className="text-[9px] text-zinc-400 font-sans">({item.sub})</span>
                )}
                <span className="text-white/20 ml-2">/</span>
              </div>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-6 animate-marquee group-hover:[animation-play-state:paused] pl-4" aria-hidden="true">
            {MARKET_ITEMS.map((item, idx) => (
              <div 
                key={`item-2-${idx}`} 
                className="inline-flex items-center gap-2 text-xs font-mono whitespace-nowrap text-zinc-300"
              >
                <span className="p-1 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  {item.icon}
                </span>
                <span className="text-zinc-400 text-[11px] font-sans font-medium">{item.label}:</span>
                <span className={`font-bold ${item.highlight ? 'text-white' : 'text-zinc-200'}`}>{item.value}</span>
                {item.sub && (
                  <span className="text-[9px] text-zinc-400 font-sans">({item.sub})</span>
                )}
                <span className="text-white/20 ml-2">/</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
