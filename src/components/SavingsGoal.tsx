import React, { useState, useMemo, useEffect } from 'react';
import { AiOfferRecommendations } from './AiOfferRecommendations';
import { Offer } from '../services/aiOfferService';
import { fetchOffersFromApi } from '../services/apiClient';
import { Zap, TrendingUp, FileText } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import * as d3 from 'd3';
import { FinancialReportModal } from './FinancialReportModal';

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString('pl-PL'));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

interface SavingsChartProps {
  currentSavings: number;
  monthlyContribution: number;
  years: number;
  rateOfReturn: number;
  targetAmount: number;
}

const SavingsChart: React.FC<SavingsChartProps> = ({ currentSavings, monthlyContribution, years, rateOfReturn, targetAmount }) => {
  const data = useMemo(() => {
    const points = [];
    const r = rateOfReturn / 100 / 12;
    let balance = currentSavings;
    points.push({ month: 0, balance, target: targetAmount });
    for(let i=1; i<=years*12; i++) {
        balance = balance * (1 + r) + monthlyContribution;
        points.push({ month: i, balance, target: targetAmount });
    }
    return points;
  }, [currentSavings, monthlyContribution, years, rateOfReturn, targetAmount]);

  const width = 600;
  const height = 240;
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = d3.scaleLinear()
    .domain([0, years * 12])
    .range([0, innerWidth]);

  const yMax = Math.max(targetAmount, data[data.length-1]?.balance || 0) * 1.1; // Add 10% padding
  const yScale = d3.scaleLinear()
    .domain([0, yMax])
    .range([innerHeight, 0]);

  const lineGenerator = d3.line<{month: number, balance: number, target: number}>()
    .x(d => xScale(d.month))
    .y(d => yScale(d.balance))
    .curve(d3.curveMonotoneX);

  const targetLineGenerator = d3.line<{month: number, balance: number, target: number}>()
    .x(d => xScale(d.month))
    .y(d => yScale(d.target));

  const areaGenerator = d3.area<{month: number, balance: number, target: number}>()
    .x(d => xScale(d.month))
    .y0(innerHeight)
    .y1(d => yScale(d.balance))
    .curve(d3.curveMonotoneX);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-black/40 border border-[#DC143C]/20 rounded-3xl p-5 mb-6 overflow-hidden"
    >
      <h3 className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 pl-4 text-center">Symulacja Wzrostu Kapitału</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-xl" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DC143C" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#DC143C" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Grid */}
          <g className="grid-lines opacity-20">
            {yScale.ticks(5).map((tick, i) => (
              <g key={`y-${i}`} transform={`translate(0, ${yScale(tick)})`}>
                <line x1={0} x2={innerWidth} stroke="url(#chart-gradient)" strokeWidth={0.5} />
                <text x={-10} y={4} fill="rgba(255,255,255,0.6)" fontSize="10" textAnchor="end" className="font-mono">
                  {tick > 1000 ? (tick/1000).toFixed(0) + 'k' : tick}
                </text>
              </g>
            ))}
          </g>

          {/* Area under the growth curve */}
          <path 
             d={areaGenerator(data) || undefined} 
             fill="url(#chart-gradient)" 
          />

          {/* Target Line */}
          <path 
             d={targetLineGenerator(data) || undefined} 
             fill="none" 
             stroke="rgba(255,255,255,0.4)" 
             strokeWidth="1.5" 
             strokeDasharray="4 4" 
          />

          {/* Balance Growth Line */}
          <path 
             d={lineGenerator(data) || undefined} 
             fill="none" 
             stroke="#DC143C" 
             strokeWidth="3" 
             strokeLinecap="round"
          />

          {/* X Axis labels */}
          <g transform={`translate(0, ${innerHeight})`}>
            {xScale.ticks(Math.min(years, 8)).map((tick, i) => {
              if (tick === 0) return null;
              return (
                <g key={`x-${i}`} transform={`translate(${xScale(tick)}, 0)`}>
                  <line y1={0} y2={5} stroke="rgba(255,255,255,0.2)" />
                  <text y={18} fill="rgba(255,255,255,0.6)" fontSize="9" textAnchor="middle" className="font-mono uppercase tracking-widest">
                    {tick / 12} {tick / 12 === 1 ? 'rok' : 'lat'}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#DC143C]"></div>
          <span className="text-[9px] text-white/50 uppercase tracking-widest">Kapitał</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-white/40 border-t border-dashed"></div>
          <span className="text-[9px] text-white/50 uppercase tracking-widest">Cel</span>
        </div>
      </div>
    </motion.div>
  );
};

export function SavingsGoal() {
  const [targetAmount, setTargetAmount] = useState<number>(50000);
  const [currentSavings, setCurrentSavings] = useState<number>(5000);
  const [years, setYears] = useState<number>(5);
  const [rateOfReturn, setRateOfReturn] = useState<number>(5);
  const [showReportModal, setShowReportModal] = useState(false);
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'account' | 'investments' | null>(null);

  const targetError = targetAmount <= 0 ? 'Kwota musi być większa od 0' : '';
  const currentError = currentSavings < 0 ? 'Kwota nie może być ujemna' : '';
  const yearsError = years <= 0 ? 'Okres musi być większy od 0' : '';
  const rateError = rateOfReturn < 0 ? 'Stopa zwrotu nie może być ujemna' : '';

  const isInputValid = !targetError && !currentError && !yearsError && !rateError;

  const { monthlyContribution, totalInvested, interestEarned } = useMemo(() => {
    if (!isInputValid) return { monthlyContribution: 0, totalInvested: 0, interestEarned: 0 };
    
    const r = rateOfReturn / 100 / 12;
    const n = years * 12;
    const futureValueOfCurrent = currentSavings * Math.pow(1 + r, n);
    const amountToSave = targetAmount - futureValueOfCurrent;
    
    let monthly = 0;
    if (r === 0) {
      monthly = amountToSave / n;
    } else {
      monthly = (amountToSave * r) / (Math.pow(1 + r, n) - 1);
    }
    
    monthly = Math.max(0, monthly);
    const invested = currentSavings + (monthly * n);
    const interest = targetAmount - invested;

    return {
      monthlyContribution: monthly,
      totalInvested: invested,
      interestEarned: Math.max(0, interest)
    };
  }, [targetAmount, currentSavings, years, rateOfReturn, isInputValid]);

  const generateTextReport = () => {
    let report = `=========================================\n`;
    report += `  RAPORT FINANSOWY - PLAN OSZCZĘDNOŚCIOWY\n`;
    report += `=========================================\n`;
    report += `Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}\n\n`;

    report += `--- PARAMETRY PLANU OSZCZĘDZANIA ---\n`;
    report += `• Cel finansowy (kwota docelowa): ${targetAmount.toLocaleString('pl-PL')} PLN\n`;
    report += `• Startowe oszczędności: ${currentSavings.toLocaleString('pl-PL')} PLN\n`;
    report += `• Horyzont czasowy: ${years} lat (${years * 12} miesięcy)\n`;
    report += `• Szacowana roczna stopa zwrotu: ${rateOfReturn}%\n\n`;

    report += `--- WYLICZENIA KAPITAŁOWE ---\n`;
    report += `• Wymagana wpłata miesięczna: ${monthlyContribution.toFixed(2)} PLN/mc\n`;
    report += `• Łączny wpłacony kapitał: ${totalInvested.toFixed(2)} PLN\n`;
    report += `• Szacowany zysk z odsetek / inwestycji: ${interestEarned.toFixed(2)} PLN\n\n`;

    report += `--- KOLEJNE KROKI ---\n`;
    report += `1. Skonfiguruj automatyczne zlecenie stałe na dzień wypłaty.\n`;
    report += `2. Rozważ rozdzielenie środków między konto oszczędnościowe a fundusze/obligacje.\n`;
    report += `3. Skonsultuj z AI najlepsze lokaty lub konta oszczędnościowe dla Twojego kapitału.\n`;
    report += `=========================================\n`;

    return report;
  };

  const fetchOffers = async (type: 'all' | 'account' | 'investments') => {
    setIsLoadingOffers(true);
    setSelectedCategory(type);
    setOffers([]);
    
    try {
      const data = await fetchOffersFromApi({
        goal: 'savings',
        savingsType: type === 'all' ? undefined : type
      });
      if (Array.isArray(data)) {
        setOffers(data);
      }
    } catch (error) {
      console.error("Błąd pobierania ofert:", error);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center font-sans relative overflow-hidden px-2 pb-2">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#DC143C]/10 blur-[80px] pointer-events-none"></div>

      <div className="text-center pt-2 pb-1 w-full flex-shrink-0">
        <div className="flex justify-center mb-1.5">
          <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white/80 font-bold text-[9px] tracking-widest">FF</span>
          </div>
        </div>
        <h1 className="flex flex-col gap-1.5 mb-3 tracking-tight">
          <span className="text-2xl sm:text-3xl font-light text-white/90 uppercase tracking-[0.15em] leading-none">FINANCIAL FREEDOM</span>
          <span className="text-xs sm:text-sm font-medium text-[#DC143C] tracking-widest uppercase leading-none">Zbuduj swój kapitał</span>
        </h1>
        <p className="text-white/40 text-xs sm:text-sm max-w-[320px] mx-auto leading-tight mt-2 font-light mb-6">
          Oblicz, ile musisz odkładać, aby osiągnąć swój cel finansowy.
        </p>
      </div>

      <div className="flex-1 w-full flex flex-col min-h-0 px-4 overflow-y-auto custom-scrollbar">
        <div className="flex flex-row gap-3 mb-6">
          <div className="flex-[2] flex flex-col gap-3">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-medium text-white/50 uppercase tracking-widest">Kwota docelowa (PLN)</label>
              <input 
                type="number" 
                placeholder="np. 50000"
                value={targetAmount} 
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#DC143C] focus:border-transparent outline-none transition-all ${targetError ? 'border-[#DC143C]' : 'border-white/10'}`}
              />
              {targetError && <p className="text-[10px] text-[#DC143C] mt-1 uppercase tracking-widest">{targetError}</p>}
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-medium text-white/50 uppercase tracking-widest">Obecne oszczędności (PLN)</label>
              <input 
                type="number" 
                placeholder="np. 5000"
                value={currentSavings} 
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
                className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#DC143C] focus:border-transparent outline-none transition-all ${currentError ? 'border-[#DC143C]' : 'border-white/10'}`}
              />
              {currentError && <p className="text-[10px] text-[#DC143C] mt-1 uppercase tracking-widest">{currentError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-medium text-white/50 uppercase tracking-widest">Okres (lata)</label>
                <input 
                  type="number" 
                  placeholder="np. 5"
                  value={years} 
                  onChange={(e) => setYears(Number(e.target.value))}
                  className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#DC143C] focus:border-transparent outline-none transition-all ${yearsError ? 'border-[#DC143C]' : 'border-white/10'}`}
                />
                {yearsError && <p className="text-[10px] text-[#DC143C] mt-1 uppercase tracking-widest">{yearsError}</p>}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-medium text-white/50 uppercase tracking-widest">Zysk (%)</label>
                <input 
                  type="number" 
                  placeholder="np. 5"
                  value={rateOfReturn} 
                  onChange={(e) => setRateOfReturn(Number(e.target.value))}
                  className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#DC143C] focus:border-transparent outline-none transition-all ${rateError ? 'border-[#DC143C]' : 'border-white/10'}`}
                />
                {rateError && <p className="text-[10px] text-[#DC143C] mt-1 uppercase tracking-widest">{rateError}</p>}
              </div>
            </div>
          </div>

          <div className="flex-[1] flex flex-col gap-3">
            {isInputValid ? (
              <>
                <div className="flex-1 p-3 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center">
                  <p className="text-white/50 text-[9px] uppercase tracking-widest mb-1">Wpłacone</p>
                  <p className="text-sm font-bold text-white flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <AnimatedNumber value={totalInvested} /> PLN
                  </p>
                </div>
                <div className="flex-1 p-3 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center">
                  <p className="text-white/50 text-[9px] uppercase tracking-widest mb-1">Odsetki</p>
                  <p className="text-sm font-bold text-[#DC143C] flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <AnimatedNumber value={interestEarned} /> PLN
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 p-3 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center opacity-50">
                  <p className="text-white/50 text-[9px] uppercase tracking-widest mb-1">Wpłacone</p>
                  <p className="text-sm font-bold text-white">-</p>
                </div>
                <div className="flex-1 p-3 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center opacity-50">
                  <p className="text-white/50 text-[9px] uppercase tracking-widest mb-1">Odsetki</p>
                  <p className="text-sm font-bold text-[#DC143C]">-</p>
                </div>
              </>
            )}
          </div>
        </div>

        {isInputValid && (
          <SavingsChart 
            currentSavings={currentSavings} 
            monthlyContribution={monthlyContribution} 
            years={years} 
            rateOfReturn={rateOfReturn} 
            targetAmount={targetAmount} 
          />
        )}

        <div className="bg-[#DC143C]/10 rounded-3xl p-6 mb-6 border border-[#DC143C]/20 flex flex-col items-center gap-6">
          <div className="text-center w-full">
            <p className="text-[#DC143C] text-[10px] uppercase font-black tracking-[0.2em] mb-2">Twoja miesięczna wpłata powinna wynosić:</p>
            {isInputValid ? (
              <p className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                {monthlyContribution.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl text-white/40">PLN</span>
              </p>
            ) : (
              <p className="text-lg font-medium text-[#DC143C] tracking-tight py-2">
                Wprowadź poprawne dane
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button 
              onClick={() => fetchOffers('all')}
              disabled={isLoadingOffers || !isInputValid}
              className="flex-1 flex items-center justify-center gap-3 bg-[#DC143C] hover:bg-[#FF0000] text-white px-6 py-4 rounded-2xl font-black uppercase tracking-tighter shadow-[0_10px_20px_rgba(220,20,60,0.3)] transition-all disabled:opacity-50 active:scale-95 text-sm"
            >
              {isLoadingOffers ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Zap size={18} /> Dopasuj Ofertę</>
              )}
            </button>
            {isInputValid && (
              <button 
                onClick={() => setShowReportModal(true)}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95"
              >
                <FileText size={16} className="text-[#DC143C]" /> Raport Tekstowy
              </button>
            )}
          </div>
        </div>

        {isLoadingOffers && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#DC143C] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white/50 text-xs uppercase tracking-widest">Szukam najlepszych ofert...</p>
          </div>
        )}

        {!isLoadingOffers && offers.length > 0 && (
          <div className="w-full pb-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest text-center mb-4">
              Najlepsze oferty dla Ciebie
            </h3>
            <AiOfferRecommendations offers={offers} />
          </div>
        )}

        <div className="text-center mt-auto pb-4">
          <p className="text-white/30 text-[10px] font-light italic uppercase tracking-widest">
            "Oszczędzanie to inwestowanie w swoją przyszłość."
          </p>
        </div>
      </div>

      <FinancialReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Raport Planu Oszczędnościowego"
        reportText={generateTextReport()}
      />
    </div>
  );
}
