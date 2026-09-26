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
  ChevronRight
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
    loadOffers();
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
          Sprawdź swoje finanse.<br className="hidden sm:inline" /> Zanim podejmiesz decyzję.
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto font-normal leading-relaxed mb-6 sm:mb-8">
          Oblicz ratę, porównaj dostępne oferty, zaplanuj oszczędzanie albo sprawdź firmę po NIP.
        </p>

        {/* Dwa główne CTA: Primary & Secondary */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3.5 max-w-md mx-auto w-full">
          <button
            onClick={() => navigate('/loan')}
            className="min-h-[48px] px-6 py-3.5 rounded-xl bg-[#DC143C] hover:bg-[#b01030] text-white font-bold text-sm sm:text-base transition-all duration-200 shadow-md shadow-[#DC143C]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <span>Potrzebuję finansowania</span>
            <ArrowRight size={17} />
          </button>
          
          <button
            onClick={() => navigate('/firma')}
            className="min-h-[48px] px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <Building2 size={17} className="text-zinc-300" />
            <span>Sprawdzam firmę</span>
          </button>
        </div>
      </section>

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

          {/* Karta 2: Hipoteka */}
          <button
            onClick={() => navigate('/mortgage')}
            className="group p-3.5 sm:p-4 rounded-xl bg-[#18181b] border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 text-left flex flex-col justify-between min-h-[110px] sm:min-h-[125px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
          >
            <div className="w-full">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#DC143C] mb-2 group-hover:bg-[#DC143C]/10 transition-colors">
                <HomeIcon size={18} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#DC143C] transition-colors leading-tight">
                Hipoteka
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

          {/* Karta 3: Pożyczka */}
          <button
            onClick={() => navigate('/loan')}
            className="group p-3.5 sm:p-4 rounded-xl bg-[#18181b] border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 text-left flex flex-col justify-between min-h-[110px] sm:min-h-[125px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
          >
            <div className="w-full">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#DC143C] mb-2 group-hover:bg-[#DC143C]/10 transition-colors">
                <Zap size={18} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#DC143C] transition-colors leading-tight">
                Pożyczka
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-tight">
                Krótkoterminowe finansowanie
              </p>
            </div>
            <div className="flex items-center text-[10px] sm:text-xs font-semibold text-zinc-400 group-hover:text-white pt-2 mt-1 border-t border-white/5 transition-colors">
              <span>Dopasuj</span>
              <ChevronRight size={13} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Karta 4: Konto i lokata */}
          <button
            onClick={() => navigate('/savings')}
            className="group p-3.5 sm:p-4 rounded-xl bg-[#18181b] border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 text-left flex flex-col justify-between min-h-[110px] sm:min-h-[125px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
          >
            <div className="w-full">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#DC143C] mb-2 group-hover:bg-[#DC143C]/10 transition-colors">
                <CreditCard size={18} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#DC143C] transition-colors leading-tight">
                Konto i lokata
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-tight">
                Rachunki i lokaty terminowe
              </p>
            </div>
            <div className="flex items-center text-[10px] sm:text-xs font-semibold text-zinc-400 group-hover:text-white pt-2 mt-1 border-t border-white/5 transition-colors">
              <span>Przeglądaj</span>
              <ChevronRight size={13} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Karta 5: Oszczędzanie */}
          <button
            onClick={() => navigate('/savings')}
            className="group p-3.5 sm:p-4 rounded-xl bg-[#18181b] border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 text-left flex flex-col justify-between min-h-[110px] sm:min-h-[125px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
          >
            <div className="w-full">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#DC143C] mb-2 group-hover:bg-[#DC143C]/10 transition-colors">
                <PiggyBank size={18} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#DC143C] transition-colors leading-tight">
                Oszczędzanie
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

          {/* Karta 6: Firma / NIP */}
          <button
            onClick={() => navigate('/firma')}
            className="group p-3.5 sm:p-4 rounded-xl bg-[#18181b] border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 text-left flex flex-col justify-between min-h-[110px] sm:min-h-[125px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#DC143C] focus-visible:outline-none"
          >
            <div className="w-full">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#DC143C] mb-2 group-hover:bg-[#DC143C]/10 transition-colors">
                <Building2 size={18} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#DC143C] transition-colors leading-tight">
                Firma / NIP
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-tight">
                Dane z rejestrów KRS i MF
              </p>
            </div>
            <div className="flex items-center text-[10px] sm:text-xs font-semibold text-zinc-400 group-hover:text-white pt-2 mt-1 border-t border-white/5 transition-colors">
              <span>Weryfikuj</span>
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
            {offers.map((offer, idx) => (
              <div
                key={offer.id || idx}
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
                    href={`/api/go?offerId=${encodeURIComponent(offer.id || '')}&source=home`}
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
          SEKCJA 6 — FIRMA / WERYFIKACJA PO NIP (Drugi filar)
          ======================================================== */}
      <section className="max-w-4xl mx-auto w-full px-4">
        <div className="p-5 sm:p-6 rounded-2xl bg-[#18181b] border border-white/10">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Sprawdzasz kontrahenta?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 mt-0.5 leading-relaxed">
                Sprawdź dane firmy po NIP i zobacz informacje dostępne w rejestrach MF/KRS.
              </p>
            </div>
          </div>

          <form onSubmit={handleNipSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Wpisz NIP (np. 734-286-71-48)"
                value={nipInput}
                onChange={handleNipChange}
                maxLength={13}
                aria-label="Numer NIP do weryfikacji"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C] transition-all"
              />
              {nipError && (
                <p className="text-[11px] text-[#DC143C] mt-1 font-medium">
                  {nipError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <Search size={15} />
              <span>Sprawdź firmę</span>
            </button>
          </form>

          <div className="flex items-center gap-2 mt-3 text-[10px] text-zinc-400">
            <span>Bazy:</span>
            <span className="text-zinc-300 font-medium">Biała Lista VAT MF</span>
            <span>•</span>
            <span className="text-zinc-300 font-medium">KRS</span>
            <span>•</span>
            <span className="text-zinc-300 font-medium">REGON</span>
          </div>
        </div>
      </section>

    </div>
  );
}
