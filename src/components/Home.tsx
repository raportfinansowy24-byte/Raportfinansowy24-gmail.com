import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  Home as HomeIcon, 
  Zap, 
  CreditCard, 
  PiggyBank, 
  Building2, 
  ArrowRight, 
  ShieldAlert, 
  Search, 
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Globe,
  Gift,
  Crown
} from 'lucide-react';
import { fetchOffersFromApi } from '../services/apiClient';
import { validateNip, cleanNip, formatNip } from '../services/companyClient';
import { useViewMode } from '../context/ViewModeContext';

export function Home() {
  const navigate = useNavigate();
  const { isBrowserMode } = useViewMode();

  // Stan sekcji 3: Szybki kalkulator (orientacyjny)
  const [quickAmount, setQuickAmount] = useState<number>(20000);
  const [quickPeriod, setQuickPeriod] = useState<number>(36);

  // Szacunkowa orientacyjna rata (stopa referencyjna ok. 9.5%)
  const estimatedMonthlyRate = (() => {
    const r = 0.095 / 12;
    const n = quickPeriod;
    const p = quickAmount;
    if (r <= 0 || n <= 0) return 0;
    return Math.round((p * r) / (1 - Math.pow(1 + r, -n)));
  })();

  // Stan sekcji 4: Dostępne oferty (maksymalnie 3 wyróżnione)
  const [offers, setOffers] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState<boolean>(true);
  const [marketPulse, setMarketPulse] = useState<{ summary?: string; sources?: Array<{ title?: string; uri?: string }> } | null>(null);

  // Stan sekcji 6: Sprawdzanie firmy po NIP
  const [nipInput, setNipInput] = useState<string>('');
  const [nipError, setNipError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function loadOffers() {
      try {
        setLoadingOffers(true);
        // Pobieramy dostępne oferty dla widoku startowego
        const data = await fetchOffersFromApi({ goal: 'cash' });
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            // Maksymalnie 3 wyróżnione oferty na Home
            setOffers(data.slice(0, 3));
          } else {
            setOffers([]);
          }
        }
      } catch {
        // Ciche przechwycenie błędu sieci - bez eksponowania szczegółów technicznych
        if (isMounted) {
          setOffers([]);
        }
      } finally {
        if (isMounted) {
          setLoadingOffers(false);
        }
      }
    }

    async function loadMarketPulse() {
      try {
        const res = await fetch('/api/market-pulse');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMarketPulse(data);
          }
        }
      } catch {
        // Cichy fallback
      }
    }

    loadOffers();
    loadMarketPulse();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickCalcSubmit = () => {
    try {
      // Mapowanie kwoty i okresu na dopasowane kategorie LoanCalculator
      let mappedAmount = 'medium';
      if (quickAmount < 3000) mappedAmount = 'small';
      else if (quickAmount <= 10000) mappedAmount = 'medium';
      else if (quickAmount <= 50000) mappedAmount = 'big';
      else mappedAmount = 'huge';

      let mappedPeriod = 'medium';
      if (quickPeriod <= 12) mappedPeriod = 'short';
      else if (quickPeriod <= 36) mappedPeriod = 'medium';
      else if (quickPeriod <= 96) mappedPeriod = 'long';
      else mappedPeriod = 'verylong';

      const currentQuiz = JSON.parse(localStorage.getItem('quizData') || '{}');
      localStorage.setItem('quizData', JSON.stringify({
        ...currentQuiz,
        amount: mappedAmount,
        period: mappedPeriod,
        rawAmount: quickAmount,
        rawPeriod: quickPeriod,
        fromHomeQuickCalc: true
      }));
    } catch {
      // Ignorujemy błędy localStorage
    }
    navigate('/loan');
  };

  const handleNipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNipError('');
    const clean = cleanNip(nipInput);
    if (!clean) {
      navigate('/firma');
      return;
    }
    const val = validateNip(clean);
    if (!val.isValid) {
      setNipError(val.error || 'Wpisz poprawny 10-cyfrowy NIP.');
      return;
    }
    try {
      sessionStorage.setItem('pending_nip_search', clean);
    } catch {
      // ignore
    }
    navigate(`/firma?nip=${clean}`);
  };

  const handleNipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = cleanNip(raw);
    if (/^\d{10}$/.test(clean)) {
      setNipInput(formatNip(clean));
    } else {
      setNipInput(raw);
    }
    if (nipError) setNipError('');
  };

  return (
    <div className="w-full flex flex-col space-y-10 sm:space-y-14 pb-12 font-sans text-white overflow-x-hidden">
      
      {/* ========================================================
          SEKCJA 1 — HERO (Kompaktowy, wyrazisty, above-the-fold)
          ======================================================== */}
      <section className="relative pt-2 sm:pt-6 text-center max-w-3xl mx-auto px-4 w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[11px] sm:text-xs font-semibold mb-3 sm:mb-4">
          <Sparkles size={13} className="text-[#DC143C]" />
          <span>Porównywarka i kalkulatory finansowe</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight mb-3 sm:mb-4">
          Sprawdź swoje finanse.<br className="hidden sm:inline" /> Wybierz najtańszy kredyt lub konto.
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto font-normal leading-relaxed mb-6 sm:mb-8">
          Oblicz ratę, porównaj dostępne oferty bankowe, zaplanuj bezpieczne oszczędzanie i odbierz do 650 zł premii za otwarcie konta.
        </p>

        {/* Dwa główne CTA: Primary & Secondary */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3.5 max-w-md mx-auto w-full">
          <button
            onClick={() => navigate('/loan')}
            className="min-h-[44px] sm:min-h-[48px] px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-[#DC143C] hover:bg-[#b01030] text-white font-bold text-sm sm:text-base transition-all duration-200 shadow-md shadow-[#DC143C]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <span>Oblicz ratę kredytu</span>
            <ArrowRight size={16} />
          </button>
          
          <button
            onClick={() => navigate('/konta')}
            className="min-h-[44px] sm:min-h-[48px] px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <CreditCard size={16} className="text-[#DC143C]" />
            <span>Konta z premią</span>
          </button>
        </div>
      </section>

      {/* ========================================================
          PULS RYNKU — GOOGLE SEARCH GROUNDING (gemini-3.5-flash)
          ======================================================== */}
      {marketPulse?.summary && (
        <section className="max-w-4xl mx-auto px-4 w-full">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#18181b] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Globe size={16} />
              </span>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-white text-[11px] uppercase tracking-wider">Aktualny Puls Rynku NBP / WIBOR</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                    Google Search Data
                  </span>
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed">{marketPulse.summary}</p>
              </div>
            </div>
            {marketPulse.sources && marketPulse.sources.length > 0 && (
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-1.5 sm:pt-0 border-t sm:border-t-0 border-white/5 w-full sm:w-auto justify-end">
                <span className="text-[10px] text-zinc-400">Źródło:</span>
                <a
                  href={marketPulse.sources[0].uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-semibold text-zinc-300 hover:text-white underline truncate max-w-[150px] inline-flex items-center gap-1"
                >
                  <span className="truncate">{marketPulse.sources[0].title || 'NBP'}</span>
                  <ArrowRight size={10} />
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================
          SEKCJA 2 — SZYBKIE NARZĘDZIA (6 KART — 2 kolumny mobile)
          ======================================================== */}
      <section className="max-w-5xl mx-auto w-full px-4">
        <div className="text-center sm:text-left mb-4 sm:mb-5">
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Szybkie narzędzia
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Wybierz obszar, który chcesz przeanalizować i przejdź do kalkulacji.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          
          {/* Karta 1: Kredyt gotówkowy */}
          <button
            onClick={() => navigate('/loan')}
            className="group p-3.5 sm:p-4 rounded-xl bg-[#18181b] border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 text-left flex flex-col justify-between min-h-[110px] sm:min-h-[125px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
          >
            <div className="w-full">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#DC143C] mb-2 group-hover:bg-[#DC143C]/10 transition-colors">
                <Calculator size={18} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#DC143C] transition-colors leading-tight">
                Kredyt gotówkowy
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-tight">
                Oblicz orientacyjną ratę kredytu
              </p>
            </div>
            <div className="flex items-center text-[10px] sm:text-xs font-semibold text-zinc-400 group-hover:text-white pt-2 mt-1 border-t border-white/5 transition-colors">
              <span>Kalkulator</span>
              <ChevronRight size={13} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Karta 2: Konta bankowe i premie */}
          <button
            onClick={() => navigate('/konta')}
            className="group p-3.5 sm:p-4 rounded-xl bg-[#18181b] border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 text-left flex flex-col justify-between min-h-[110px] sm:min-h-[125px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
          >
            <div className="w-full">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#DC143C] mb-2 group-hover:bg-[#DC143C]/10 transition-colors">
                <CreditCard size={18} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#DC143C] transition-colors leading-tight">
                Konta i premie
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-tight">
                Konta 0 zł + bonusy do 650 zł
              </p>
            </div>
            <div className="flex items-center text-[10px] sm:text-xs font-semibold text-zinc-400 group-hover:text-white pt-2 mt-1 border-t border-white/5 transition-colors">
              <span>Ranking kont</span>
              <ChevronRight size={13} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Karta 3: Hipoteka */}
          <button
            onClick={() => navigate('/mortgage')}
            className="group p-3.5 sm:p-4 rounded-xl bg-[#18181b] border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 text-left flex flex-col justify-between min-h-[110px] sm:min-h-[125px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
          >
            <div className="w-full">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#DC143C] mb-2 group-hover:bg-[#DC143C]/10 transition-colors">
                <HomeIcon size={18} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#DC143C] transition-colors leading-tight">
                Kredyt hipoteczny
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-tight">
                Symulacja z wkładem własnym
              </p>
            </div>
            <div className="flex items-center text-[10px] sm:text-xs font-semibold text-zinc-400 group-hover:text-white pt-2 mt-1 border-t border-white/5 transition-colors">
              <span>Symulator</span>
              <ChevronRight size={13} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Karta 4: Konsolidacja kredytów */}
          <button
            onClick={() => navigate('/loan?goal=debt')}
            className="group p-3.5 sm:p-4 rounded-xl bg-[#18181b] border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 text-left flex flex-col justify-between min-h-[110px] sm:min-h-[125px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
          >
            <div className="w-full">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#DC143C] mb-2 group-hover:bg-[#DC143C]/10 transition-colors">
                <Zap size={18} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#DC143C] transition-colors leading-tight">
                Konsolidacja
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-tight">
                Połącz długi w 1 niższą ratę
              </p>
            </div>
            <div className="flex items-center text-[10px] sm:text-xs font-semibold text-zinc-400 group-hover:text-white pt-2 mt-1 border-t border-white/5 transition-colors">
              <span>Obniż raty</span>
              <ChevronRight size={13} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Karta 5: Oszczędzanie i lokaty */}
          <button
            onClick={() => navigate('/savings')}
            className="group p-3.5 sm:p-4 rounded-xl bg-[#18181b] border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 text-left flex flex-col justify-between min-h-[110px] sm:min-h-[125px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
          >
            <div className="w-full">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#DC143C] mb-2 group-hover:bg-[#DC143C]/10 transition-colors">
                <PiggyBank size={18} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#DC143C] transition-colors leading-tight">
                Oszczędzanie i lokaty
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-tight">
                Plan wpłat i procent składany
              </p>
            </div>
            <div className="flex items-center text-[10px] sm:text-xs font-semibold text-zinc-400 group-hover:text-white pt-2 mt-1 border-t border-white/5 transition-colors">
              <span>Zaplanuj</span>
              <ChevronRight size={13} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Karta 6: Doradca Finansowy AI */}
          <button
            onClick={() => navigate('/protokol')}
            className="group p-3.5 sm:p-4 rounded-xl bg-[#18181b] border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 text-left flex flex-col justify-between min-h-[110px] sm:min-h-[125px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
          >
            <div className="w-full">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#DC143C] mb-2 group-hover:bg-[#DC143C]/10 transition-colors">
                <Sparkles size={18} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#DC143C] transition-colors leading-tight">
                Doradca AI
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-tight">
                Diagnoza portfela i ukrytych opłat
              </p>
            </div>
            <div className="flex items-center text-[10px] sm:text-xs font-semibold text-zinc-400 group-hover:text-white pt-2 mt-1 border-t border-white/5 transition-colors">
              <span>Rozpocznij</span>
              <ChevronRight size={13} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

        </div>
      </section>

      {/* ========================================================
          SEKCJA 3 — SZYBKI KALKULATOR (Natychmiastowa wartość)
          ======================================================== */}
      <section className="max-w-4xl mx-auto w-full px-4">
        <div className="p-5 sm:p-7 rounded-2xl bg-[#18181b] border border-white/10 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#DC143C] uppercase tracking-wider mb-1">
                <Calculator size={14} />
                <span>Kalkulator orientacyjny</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Chcesz sprawdzić ratę?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Wpisz kwotę i okres, aby szybko przejść do kalkulatora.
              </p>
            </div>

            {/* Szacunek orientacyjny */}
            <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-left sm:text-right shrink-0 w-full sm:w-auto">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">
                Szacunkowa rata
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white">
                ~{estimatedMonthlyRate.toLocaleString('pl-PL')} <span className="text-xs text-zinc-400 font-normal">PLN/mc</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5">
            {/* Kwota */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="quick-amount-slider" className="text-xs font-semibold text-zinc-300">
                  Kwota
                </label>
                <span className="text-sm font-bold text-white">
                  {quickAmount.toLocaleString('pl-PL')} PLN
                </span>
              </div>
              <input
                id="quick-amount-slider"
                type="range"
                min="2000"
                max="150000"
                step="1000"
                value={quickAmount}
                onChange={(e) => setQuickAmount(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#DC143C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC143C]"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>2 000 PLN</span>
                <span>150 000 PLN</span>
              </div>
            </div>

            {/* Okres */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="quick-period-slider" className="text-xs font-semibold text-zinc-300">
                  Okres
                </label>
                <span className="text-sm font-bold text-white">
                  {quickPeriod} miesięcy ({Math.round(quickPeriod / 12 * 10) / 10} lat)
                </span>
              </div>
              <input
                id="quick-period-slider"
                type="range"
                min="6"
                max="120"
                step="6"
                value={quickPeriod}
                onChange={(e) => setQuickPeriod(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#DC143C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC143C]"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>6 mies.</span>
                <span>120 mies.</span>
              </div>
            </div>
          </div>

          {/* Dół karty z notatką i CTA */}
          <div className="pt-5 mt-5 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <p className="text-[11px] text-zinc-400 leading-tight">
              To orientacyjne wyliczenie. Dokładna oferta zależy od wybranego produktu i profilu.
            </p>
            <button
              onClick={handleQuickCalcSubmit}
              className="min-h-[44px] w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#DC143C] hover:bg-[#b01030] text-white font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <span>Oblicz ratę</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          SEKCJA 4 — OFERTY (Maksymalnie 3 wyróżnione oferty)
          ======================================================== */}
      <section className="max-w-5xl mx-auto w-full px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Dostępne oferty
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Przegląd przykładowych ofert instytucji finansowych.
            </p>
          </div>
          <button
            onClick={() => navigate('/loan')}
            className="text-xs font-semibold text-[#DC143C] hover:text-white transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer focus-visible:ring-1 focus-visible:ring-[#DC143C] outline-none"
          >
            <span>Wszystkie w kalkulatorze</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {loadingOffers ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 rounded-xl bg-[#18181b] border border-white/10 animate-pulse h-36" />
            ))}
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="p-4 sm:p-5 rounded-xl bg-[#18181b] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
                      {offer.category || 'Produkt bankowy'}
                    </span>
                    {offer.comment && (
                      <span className="text-[10px] font-medium text-emerald-400">
                        {offer.comment}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm sm:text-base font-bold text-white mb-2 line-clamp-1">
                    {offer.name}
                  </h3>

                  {offer.features && Array.isArray(offer.features) && offer.features.length > 0 && (
                    <ul className="space-y-1 mb-3">
                      {offer.features.slice(0, 2).map((f: string, fIdx: number) => (
                        <li key={fIdx} className="text-xs text-zinc-400 flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-[#DC143C] shrink-0" />
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-3 mt-auto border-t border-white/5">
                  <a
                    href={`/api/go?offerId=${encodeURIComponent(offer.id)}&source=home`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-[#DC143C] text-white text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
                  >
                    <span>Sprawdź ofertę</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-xl bg-[#18181b] border border-white/10 text-center">
            <p className="text-xs sm:text-sm text-zinc-400 mb-3">
              Sprawdź dostępne opcje po przejściu do kalkulatora.
            </p>
            <button
              onClick={() => navigate('/loan')}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#DC143C] hover:bg-[#b01030] text-white font-bold text-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              Przejdź do kalkulatora
            </button>
          </div>
        )}
      </section>

      {/* ========================================================
          SEKCJA 5 — PROTOKÓŁ (Subtelna, dodatkowa funkcja)
          ======================================================== */}
      <section className="max-w-4xl mx-auto w-full px-4">
        <div className="p-5 sm:p-6 rounded-2xl bg-[#18181b] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#DC143C]/10 border border-[#DC143C]/20 flex items-center justify-center text-[#DC143C] shrink-0 mt-0.5">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Masz już kredyty?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 mt-0.5 leading-relaxed">
                Sprawdź, czy możesz ograniczyć koszt swojego finansowania.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/protokol')}
            className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-[#DC143C] text-white font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
          >
            <span>Uruchom audyt</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* ========================================================
          SEKCJA VIRAL — PROGRAM POLECEŃ (Zyskaj Raporty Premium)
          ======================================================== */}
      <section className="max-w-4xl mx-auto w-full px-4">
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#1c1216] via-[#16161d] to-[#111116] border border-[#DC143C]/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#DC143C]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#DC143C] to-[#8B0000] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#DC143C]/30 mt-0.5">
              <Gift size={22} className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Crown size={10} /> Program Poleceń
                </span>
                <span className="text-xs text-emerald-400 font-semibold">+2 Raporty za znajomego</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-1">
                Polecaj i Odbieraj Raporty Premium B2B
              </h2>
              <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed max-w-lg">
                Zyskaj nielimitowany dostęp do oficjalnych audytów PDF i wskaźników ryzyka upadłości Altman Z-Score. Każde polecenie daje darmowe raporty dla Ciebie i znajomego.
              </p>
            </div>
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open_referral_modal'))}
            className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-black font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95 shadow-md shadow-amber-500/20 relative z-10"
          >
            <Gift size={15} />
            <span>Twój kod & bonus</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* ========================================================
          SEKCJA 6 — OSOBISTY DORADCA FINANSOWY — WYBIERZ SWÓJ CEL
          ======================================================== */}
      <section className="max-w-4xl mx-auto w-full px-4">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#18181f] via-[#121217] to-[#0c0c10] border border-white/10 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Usługa dla osób prywatnych
                </span>
                <span className="text-xs text-zinc-400">100% bezpłatnie</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                W czym możemy Ci dzisiaj pomóc?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">
                Wybierz obszar, a nasz algorytm przekieruje Cię bezpośrednio do wyliczeń i ofert:
              </p>
            </div>
            
            <button
              onClick={() => navigate('/protokol')}
              className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 self-start sm:self-center transition-colors cursor-pointer"
            >
              <span>Pełna diagnoza AI portfela</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Opcja 1 */}
            <div 
              onClick={() => navigate('/loan')}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-[#DC143C]/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#DC143C]/10 text-[#DC143C] flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#DC143C] transition-colors">
                    Potrzebuję gotówki lub pożyczki
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Kalkulator rat, najniższe RRSO i decyzja w 15 minut
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </div>

            {/* Opcja 2 */}
            <div 
              onClick={() => navigate('/konta')}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                  <Gift size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    Chcę darmowe konto z premią
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Konta 0 zł bez opłat + premie do 650 zł gotówki
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </div>

            {/* Opcja 3 */}
            <div 
              onClick={() => navigate('/loan?goal=debt')}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-[#DC143C]/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                    Chcę zmniejszyć obecne raty
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Konsolidacja: połącz kilka kredytów w 1 tańszy
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </div>

            {/* Opcja 4 */}
            <div 
              onClick={() => navigate('/savings')}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                  <PiggyBank size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Chcę bezpiecznie pomnożyć oszczędności
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Lokaty i konta oszczędnościowe do 7.5% rocznie
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
