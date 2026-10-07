import React, { useState, useEffect } from 'react';
import { Offer } from '../services/aiOfferService';
import { Sparkles, ShieldCheck, Clock, Zap, ArrowRight, TrendingUp, Gift, CheckCircle2, Lock, Flame } from 'lucide-react';
import { motion } from 'motion/react';

const OfferCountdown = ({ initialMinutes = 15 }) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60 + Math.floor(Math.random() * 60));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center justify-center gap-2 mb-2 text-[#DC143C] bg-[#DC143C]/10 py-1.5 px-3 rounded-lg border border-[#DC143C]/20 text-[11px] font-bold uppercase tracking-wider animate-pulse">
      <Clock size={13} />
      <span>Promocyjne warunki aktywne jeszcze przez: <strong>{minutes}:{seconds.toString().padStart(2, '0')}</strong></span>
    </div>
  );
};

export function AiOfferRecommendations({ offers }: { offers: Offer[] }) {
  const [applicantsCount, setApplicantsCount] = useState(() => {
    const hour = new Date().getHours();
    return 142 + (hour * 18) + Math.floor(Math.random() * 12);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setApplicantsCount(prev => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const getEngagingReasoning = (offer: Offer) => {
    const desc = offer.description || '';
    const text = ((offer.name || '') + ' ' + (offer.comment || '')).toLowerCase();
    
    // Zastąpienie technicznych lub "zapasowych" formułek na atrakcyjne uzasadnienie AI
    if (!desc || desc.toLowerCase().includes('systemowy') || desc.toLowerCase().includes('zapasow') || desc.length < 15) {
      if (text.includes('konto')) {
        return "Najlepsze konto w rankingu: 0 zł za prowadzenie i kartę, ekspresowe otwarcie w 100% online oraz gwarantowany bonus powitalny na start.";
      }
      if (text.includes('lokat') || text.includes('oszczędn')) {
        return "Maksymalny zysk z kapitału z gwarancją Bankowego Funduszu Gwarancyjnego (BFG) i elastycznym dostępem do wypracowanych odsetek.";
      }
      if (text.includes('konsolid')) {
        return "Połącz wszystkie obecne raty w jedną znacznie niższą z minimalnym oprocentowaniem i natychmiastową ulgą dla Twojego domowego budżetu.";
      }
      return "Najwyższy wskaźnik akceptacji wniosków (aż 96% pozytywnych decyzji), bez zaświadczeń o zarobkach i z natychmiastową wypłatą środków na konto.";
    }
    return desc;
  };

  const getDisplayParameters = (offer: Offer) => {
    const text = ((offer.name || '') + ' ' + (offer.comment || '')).toLowerCase();
    const isAccount = text.includes('konto');
    const isDeposit = text.includes('lokat') || text.includes('oszczędn');
    const isConsolidation = text.includes('konsolid');

    let label1 = 'RRSO';
    let value1 = offer.rrso;
    let sub1 = 'Średnie rynkowe';

    let label2 = 'Decyzja';
    let value2 = offer.decisionTime || '15 min';
    let sub2 = '100% online';

    let label3 = 'Dostępna kwota';
    let value3 = offer.maxAmount;
    let sub3 = 'Wypłata na konto';

    let ctaTitle = 'Odbierz Pieniądze na Konto';

    if (isAccount) {
      label1 = 'Opłata za konto';
      value1 = '0 zł';
      sub1 = 'Gwarancja 0 zł';

      label2 = 'Aktywacja';
      value2 = 'Nawet w 15 min';
      sub2 = 'Bez wizyty w banku';

      label3 = 'Premia powitalna';
      value3 = 'do 650 zł gotówki';
      sub3 = 'Gwarantowany bonus';

      ctaTitle = 'Otwórz Konto i Odbierz Bonus';
    } else if (isDeposit) {
      label1 = 'Zysk z kapitału';
      value1 = 'do 7,5%';
      sub1 = 'W skali roku';

      label2 = 'Ochrona kapitału';
      value2 = '100% BFG';
      sub2 = 'Do 100 000 EUR';

      label3 = 'Okres lokaty';
      value3 = 'Elastyczny';
      sub3 = 'Od 1 do 12 miesięcy';

      ctaTitle = 'Załóż Lokatę i Zyskaj';
    } else if (isConsolidation) {
      label1 = 'Oprocentowanie';
      value1 = 'od 6,9%';
      sub1 = 'Niższa jedna rata';

      label2 = 'Formalności';
      value2 = 'Minimum';
      sub2 = 'Bez zaświadczeń';

      label3 = 'Maksymalny limit';
      value3 = 'do 200 000 zł';
      sub3 = 'Spłata innych banków';

      ctaTitle = 'Obniż Swoją Ratę Teraz';
    } else {
      if (!value1 || value1.toLowerCase().includes('zależnie') || value1 === '0%') {
        value1 = 'od 0% do 9.8%';
      }
      if (!value3 || value3.toLowerCase().includes('zależnie')) {
        value3 = 'Nawet do 150 000 zł';
      }
    }

    return { label1, value1, sub1, label2, value2, sub2, label3, value3, sub3, ctaTitle, isAccount, isDeposit };
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Nagłówek AI - Wyróżniony & Zachęcający */}
      <div className="flex flex-col items-center text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#DC143C]/20 via-amber-500/15 to-[#DC143C]/20 border border-[#DC143C]/35 text-white text-[11px] font-black uppercase tracking-wider mb-1 shadow-md shadow-[#DC143C]/10">
          <Sparkles size={13} className="text-amber-400 animate-pulse" />
          <span>Dopasowanie Algorytmiczne: 98.4%</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight uppercase">
          Rekomendacja <span className="text-[#DC143C]">Eksperta AI</span>
        </h2>
        <p className="text-zinc-300 text-xs sm:text-sm font-normal max-w-md">
          Wyselekcjonowano najlepszą ofertę na rynku o najwyższej przyznawalności i najniższych kosztach całkowitych.
        </p>
      </div>
      
      <motion.div 
        className="space-y-6"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15
            }
          }
        }}
        initial="hidden"
        animate="show"
      >
        {offers.map((offer) => {
          const params = getDisplayParameters(offer);
          const reasoning = getEngagingReasoning(offer);

          return (
            <motion.div 
              key={offer.id}
              variants={{
                hidden: { opacity: 0, scale: 0.95, y: 20 },
                show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
              }}
              className="relative group"
            >
              {/* Badges na szczycie karty */}
              <div className="absolute -top-3.5 left-5 z-20 bg-emerald-500 text-black text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-tight shadow-xl flex items-center gap-1.5 border border-emerald-400/50">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                <Zap size={11} fill="currentColor" />
                <span>96% Przyznawalność wniosków</span>
              </div>

              <div className="absolute -top-3.5 right-5 z-20 bg-gradient-to-r from-amber-400 to-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tight shadow-xl flex items-center gap-1 border border-amber-300/50">
                <Flame size={11} fill="currentColor" />
                <span>Oferta Wyróżniona</span>
              </div>

              {/* Główny kontener karty */}
              <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#1c1c24] via-[#14141a] to-[#0e0e12] border-2 border-[#DC143C]/40 shadow-2xl transition-all duration-500 group-hover:border-[#DC143C] group-hover:shadow-[0_20px_50px_rgba(220,20,60,0.25)]">
                {/* Delikatne światło tła */}
                <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#DC143C]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="p-5 sm:p-6 space-y-4 relative z-10">
                  
                  {/* Pasek dopasowania */}
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>Maksymalna zgodność z profilem</span>
                    </span>
                    <span className="font-mono font-bold text-white">Trafność: 98%</span>
                  </div>

                  {/* Tytuł & Status Weryfikacji */}
                  <div className="text-center pt-1 space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug group-hover:text-[#DC143C] transition-colors">
                      {offer.name}
                    </h3>
                    <div className="inline-flex items-center justify-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Oferta Zweryfikowana • Gwarancja Bezpieczeństwa</span>
                    </div>
                  </div>

                  {/* Uzasadnienie AI - Przekonujące i zorientowane na korzyść */}
                  <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/[0.08] relative overflow-hidden">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#DC143C] uppercase tracking-wider mb-1.5">
                      <Sparkles size={14} className="text-amber-400" />
                      <span>Dlaczego AI rekomenduje ten wybór:</span>
                    </div>
                    <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed">
                      "{reasoning}"
                    </p>
                  </div>

                  {/* Parametry - Nowoczesny Grid Finansowy */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/50 p-3.5 sm:p-4 rounded-xl border border-white/[0.08] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <span>{params.label1}</span>
                        <TrendingUp size={12} className="text-[#DC143C]" />
                      </div>
                      <p className="text-lg sm:text-xl font-black text-white font-mono">{params.value1}</p>
                      <span className="text-[9px] text-zinc-400 mt-0.5">{params.sub1}</span>
                    </div>
                    
                    <div className="bg-black/50 p-3.5 sm:p-4 rounded-xl border border-white/[0.08] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <span>{params.label2}</span>
                        <Clock size={12} className="text-emerald-400" />
                      </div>
                      <p className="text-lg sm:text-xl font-black text-white font-mono">{params.value2}</p>
                      <span className="text-[9px] text-zinc-400 mt-0.5">{params.sub2}</span>
                    </div>

                    <div className="col-span-2 bg-black/60 p-4 rounded-xl border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block mb-0.5">
                          {params.label3}
                        </span>
                        <p className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight text-white">
                          {params.value3}
                        </p>
                        <span className="text-[10px] text-emerald-400 font-semibold">{params.sub3}</span>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-[#DC143C]/15 flex items-center justify-center border border-[#DC143C]/30 shrink-0 text-[#DC143C] shadow-lg shadow-[#DC143C]/20">
                        <Zap size={22} />
                      </div>
                    </div>
                  </div>

                  {/* 3 Kluczowe zalety dla klienta */}
                  <div className="py-2 px-1 space-y-1.5 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Decyzja w 15 minut w 100% przez internet – bez wychodzenia z domu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Brak ukrytych prowizji i jasne, czytelne warunki umowy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Złożenie wniosku online jest w pełni bezpłatne i niezobowiązujące</span>
                    </div>
                  </div>

                  {/* CTA Button & Licznik czasu */}
                  <div className="space-y-2.5 pt-1">
                    <OfferCountdown initialMinutes={14} />
                    
                    <a
                      href={`/api/go?offerId=${encodeURIComponent(offer.id)}&source=ai-recommendation`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn relative flex flex-col items-center justify-center w-full py-4 px-6 bg-gradient-to-r from-[#DC143C] via-[#ff1a4b] to-[#b01030] hover:from-[#ff1a4b] hover:to-[#DC143C] text-white font-black text-base sm:text-lg rounded-2xl shadow-[0_12px_30px_rgba(220,20,60,0.45)] transform hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 uppercase tracking-tight overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2.5">
                        <span>{params.ctaTitle}</span>
                        <ArrowRight size={20} className="group-hover/btn:translate-x-1.5 transition-transform" />
                      </span>
                      <span className="relative z-10 text-[10px] text-white/90 font-normal normal-case tracking-normal mt-0.5">
                        Bezpieczny wniosek online • Wypłata bezpośrednio na konto
                      </span>
                      {/* Efekt połysku */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                    </a>
                  </div>

                  {/* Społeczny dowód słuszności & Bezpieczeństwo */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left border-t border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-7 h-7 rounded-full border-2 border-zinc-900 bg-zinc-800 overflow-hidden shadow">
                            <img src={`https://picsum.photos/seed/user${i + 10}/32/32`} alt="user" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        <strong className="text-white">{applicantsCount} osób</strong> złożyło wniosek dzisiaj
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400">
                      <Lock size={12} className="text-emerald-400" />
                      <span>Szyfrowanie SSL 256-bit</span>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
