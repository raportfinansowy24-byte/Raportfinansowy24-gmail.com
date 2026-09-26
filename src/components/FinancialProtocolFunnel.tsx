import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Unlock, 
  Mail, 
  Sparkles, 
  Clock, 
  Zap, 
  ChevronRight, 
  Calculator,
  RefreshCw,
  TrendingDown,
  ExternalLink,
  Terminal,
  Activity,
  Cpu,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useViewMode } from '../context/ViewModeContext';

interface FinancialProtocolFunnelProps {
  onComplete?: (email: string, tier: string) => void;
}

export const FinancialProtocolFunnel: React.FC<FinancialProtocolFunnelProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isBrowserMode } = useViewMode();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedLossTier, setSelectedLossTier] = useState<string>('');
  const [lossAmountText, setLossAmountText] = useState<string>('');
  const [annualLossText, setAnnualLossText] = useState<string>('');
  const [loadingTextIndex, setLoadingTextIndex] = useState<number>(0);
  const [loadingProgress, setLoadingProgress] = useState<number>(15);
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showExitWarning, setShowExitWarning] = useState<boolean>(false);

  const loadingSteps = [
    "Nawiązywanie bezpiecznego połączenia z bazami bankowymi...",
    "Skanowanie ukrytych prowizji, marż i kosztów pozaodsetkowych...",
    "Kalkulacja rzeczywistego wskaźnika RRSO dla Twojego profilu...",
    "Weryfikacja algorytmiczna ofert o najwyższym wskaźniku akceptacji...",
    "Generowanie indywidualnego protokołu optymalizacji kosztów..."
  ];

  // Obsługa nawigacji wstecz
  const handleBack = () => {
    if (currentStep === 1) {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/loan');
      }
    } else if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 4) {
      setCurrentStep(3);
    } else if (currentStep === 5) {
      setCurrentStep(3);
    }
  };

  // Obsługa wyboru progu straty
  const handleSelectLossTier = (tier: string, label: string, annualLoss: string) => {
    setSelectedLossTier(tier);
    setLossAmountText(label);
    setAnnualLossText(annualLoss);
    setCurrentStep(2);
  };

  // Uruchomienie sekwencji skanowania algorytmicznego
  const handleStartScanning = () => {
    setCurrentStep(4);
    setLoadingProgress(15);
    setLoadingTextIndex(0);

    const stepInterval = setInterval(() => {
      setLoadingTextIndex((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 700);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 98) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 18) + 8;
      });
    }, 280);

    setTimeout(() => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setCurrentStep(5);
      }, 400);
    }, 3500);
  };

  // Wysłanie leada do backendu /api/leads
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      setEmailError('Wprowadź prawidłowy adres e-mail (np. imie@gmail.com)');
      return;
    }

    setEmailError('');
    setIsSubmitting(true);

    try {
      // 1. Zapis do backendu
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          lossTier: selectedLossTier,
          lossAmount: lossAmountText,
          timestamp: new Date().toISOString()
        })
      });

      // 2. Zapis w pamięci przeglądarki dla personalizacji kalkulatora
      localStorage.setItem('protocol_unlocked', 'true');
      localStorage.setItem('protocol_email', cleanEmail);
      localStorage.setItem('protocol_loss_tier', selectedLossTier);
      localStorage.setItem('protocol_annual_loss', annualLossText);
      localStorage.setItem('protocol_timestamp', new Date().toISOString());

      setIsSubmitted(true);

      if (onComplete) {
        onComplete(cleanEmail, selectedLossTier);
      }

      // Automatyczne przejście do głównego portalu po 1.8 sekundy
      setTimeout(() => {
        navigate('/loan');
      }, 1800);
    } catch (err) {
      console.error('Błąd zapisu leada:', err);
      // Nawet w przypadku błędu sieci, odblokowujemy użytkownikowi kalkulator
      setIsSubmitted(true);
      setTimeout(() => {
        navigate('/loan');
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsMeta = [
    { num: 1, id: '01', tag: 'INSPEKCJA', name: 'Weryfikacja Strat', code: 'PROBE_LOSS' },
    { num: 2, id: '02', tag: 'KALKULACJA', name: 'Roczny Przeciek', code: 'CALC_BURNDOWN' },
    { num: 3, id: '03', tag: 'AUTORYZACJA', name: 'Gotowość Optym.', code: 'AUTH_OVERRIDE' },
    { num: 4, id: '04', tag: 'SKANOWANIE', name: 'Silnik Zero-Fee', code: 'EXEC_AI_SCAN' },
    { num: 5, id: '05', tag: 'ODBLOKOWANIE', name: 'Raport & Oferty', code: 'UNLOCK_ACCESS' }
  ];

  return (
    <div className={`w-full mx-auto flex flex-col items-center justify-center p-3 sm:p-6 transition-all duration-300 ${
      isBrowserMode ? 'max-w-4xl py-6' : 'max-w-md py-4'
    }`}>
      {/* Top Navigation Row: Distinct Back Button */}
      <div className="w-full flex items-center justify-between mb-3 px-0.5">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-zinc-900/90 hover:bg-[#1f1619] border border-white/20 hover:border-[#FF0033]/60 text-white font-mono text-xs sm:text-sm font-bold shadow-[0_2px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(255,0,51,0.25)] transition-all duration-200 group active:scale-95 cursor-pointer"
          title={currentStep > 1 ? `Wróć do poprzedniego etapu (${currentStep - 1})` : 'Wróć do kalkulatora'}
        >
          <ArrowLeft size={16} className="text-[#FF0033] group-hover:-translate-x-1 transition-transform" />
          <span className="tracking-wide uppercase font-black">WSTECZ</span>
          {currentStep > 1 && (
            <span className="text-[11px] text-zinc-400 font-sans font-medium hidden sm:inline">
              (do etapu 0{currentStep === 5 ? 3 : currentStep - 1})
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>KROK <strong className="text-white">{currentStep}</strong> / 5</span>
          </span>
          <button
            onClick={() => navigate('/loan')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all"
            title="Przejdź do standardowego kalkulatora"
          >
            <Calculator size={13} />
            <span className="hidden sm:inline">Kalkulator Kredytów</span>
          </button>
        </div>
      </div>

      {/* Terminal Step Indicator & Status Console Header */}
      <div className="w-full mb-5 font-mono">
        {/* Terminal Header Bar */}
        <div className="rounded-t-xl bg-[#09090b] border border-white/10 border-b-0 px-3 py-2 flex items-center justify-between text-[11px] select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-[10px] font-mono font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/10 hover:border-[#DC143C]/40 transition-colors"
              title="Cofnij"
            >
              <ArrowLeft size={10} className="text-[#FF0033]" />
              <span>WSTECZ</span>
            </button>
            <span className="text-zinc-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF0033]/80 border border-[#FF0033] shadow-[0_0_6px_rgba(255,0,51,0.6)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-emerald-500" />
            </div>
            <span className="text-zinc-500 mx-1">|</span>
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
              <Terminal size={12} className="text-[#FF0033]" />
              <span className="text-white/80">CORE_PROTOCOL://</span>
              <span className="text-[#FF0033]">AUDYT_ANTY_PROWIZJA</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              <Activity size={10} className="text-emerald-400 animate-pulse" />
              LIVE_FEED
            </span>
            <span className="text-[10px] font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              ETAP [{currentStep}/05]
            </span>
          </div>
        </div>

        {/* Terminal Step Indicator Pills */}
        <div className="bg-[#0e0e12] border border-white/10 px-2 sm:px-3 py-2.5">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {stepsMeta.map((s) => {
              const isPassed = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              const isPending = currentStep < s.num;

              return (
                <div
                  key={s.num}
                  className={`relative rounded-lg p-1.5 sm:p-2 border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                    isCurrent
                      ? 'bg-[#181114] border-[#DC143C] shadow-[0_0_15px_rgba(220,20,60,0.35)]'
                      : isPassed
                      ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-400'
                      : 'bg-black/40 border-white/5 text-zinc-600 opacity-60'
                  }`}
                >
                  {/* Top line with stage ID & Status Indicator */}
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold leading-none mb-1">
                    <span className={isCurrent ? 'text-[#FF0033]' : isPassed ? 'text-emerald-400' : 'text-zinc-500'}>
                      {s.id}
                    </span>
                    {isPassed ? (
                      <span className="text-emerald-400 text-[10px] sm:text-xs">✓</span>
                    ) : isCurrent ? (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF0033] animate-ping" />
                    ) : (
                      <span className="text-[8px] text-zinc-600">•</span>
                    )}
                  </div>

                  {/* Step Name */}
                  <div className="truncate">
                    <div className={`text-[10px] sm:text-[11px] font-bold truncate tracking-tight ${
                      isCurrent ? 'text-white' : isPassed ? 'text-emerald-300/90' : 'text-zinc-500'
                    }`}>
                      {s.tag}
                    </div>
                    <div className="hidden md:block text-[9px] text-zinc-500 truncate">
                      {s.name}
                    </div>
                  </div>

                  {/* Active bottom glow bar */}
                  {isCurrent && (
                    <motion.div 
                      layoutId="terminal-active-step"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#DC143C] via-[#FF0033] to-amber-400"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Sub-terminal Command Line Stream */}
          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400 px-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[#DC143C] font-bold">&gt;</span>
              <span className="text-zinc-500">SYS_EXEC:</span>
              <span className="text-white font-mono truncate">
                {currentStep === 1 && 'AUDYT_RYZYKA: analiza_prowizji_i_marz.sh --deep'}
                {currentStep === 2 && 'SZACUNEK_STRAT: calc_compound_annual_bleed.py --annual'}
                {currentStep === 3 && 'KONTROLA_DECYZJI: authorize_protocol_bypass.sh --force'}
                {currentStep === 4 && 'ENGINE_SCAN: zero_fee_matching_algorithm.exec'}
                {currentStep === 5 && 'STATUS_READY: unlock_session_token.enc --success'}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-500 shrink-0">
              <Cpu size={11} className="text-[#DC143C]" />
              <span>THREAD_OK</span>
            </div>
          </div>
        </div>

        {/* Continuous Segmented Progress Line */}
        <div className="rounded-b-xl bg-[#09090b] border border-white/10 border-t-0 p-1">
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#DC143C] via-[#FF0033] to-emerald-400 shadow-[0_0_8px_rgba(255,0,51,0.6)]"
              initial={{ width: '20%' }}
              animate={{ 
                width: currentStep === 1 ? '20%' : currentStep === 2 ? '40%' : currentStep === 3 ? '60%' : currentStep === 4 ? '80%' : '100%' 
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Główna karta protokołu */}
      <div className={`w-full rounded-2xl sm:rounded-3xl border transition-all duration-300 p-5 sm:p-8 shadow-2xl relative overflow-hidden ${
        theme === 'high-contrast'
          ? 'bg-black border-white/20 shadow-[0_0_40px_rgba(255,0,51,0.15)]'
          : 'bg-[#18181e]/90 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl'
      }`}>
        {/* Subtelny ambient glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#DC143C]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {/* KROK 1: Pytanie o skalę ukrytych prowizji */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DC143C]/15 border border-[#DC143C]/30 text-[#FF0033] text-[11px] font-black uppercase tracking-wider">
                  <Flame size={13} />
                  Pilna Weryfikacja Kapitału
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                  Ile pieniędzy banki kradną Ci co miesiąc w ukrytych prowizjach i zawyżonych ratach?
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
                  Przeciętny kredytobiorca w Polsce płaci o 20-40% za dużo przez sztucznie napompowane marże, zbędne ubezpieczenia i ukryte prowizje przygotowawcze.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => handleSelectLossTier('low', 'Poniżej 1000 PLN', 'do 12 000 PLN')}
                  className="group relative w-full text-left p-4 sm:p-5 rounded-2xl bg-white/5 hover:bg-[#DC143C]/15 border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 active:scale-[0.99] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-base group-hover:text-red-400 transition-colors flex items-center gap-2">
                      <span>Poniżej 1 000 PLN miesięcznie</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">„Biednieję, ale powoli” – strata do 12 000 PLN rocznie</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#DC143C] group-hover:text-white flex items-center justify-center text-zinc-400 transition-all">
                    <ChevronRight size={18} />
                  </div>
                </button>

                <button
                  onClick={() => handleSelectLossTier('mid', '1000 - 3000 PLN', 'od 12 000 do 36 000 PLN')}
                  className="group relative w-full text-left p-4 sm:p-5 rounded-2xl bg-white/5 hover:bg-[#DC143C]/15 border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 active:scale-[0.99] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-base group-hover:text-red-400 transition-colors flex items-center gap-2">
                      <span>1 000 – 3 000 PLN miesięcznie</span>
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold uppercase">Najczęstsze</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">„Odczuwam poważną stratę” – ucieka równowartość wypłat</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#DC143C] group-hover:text-white flex items-center justify-center text-zinc-400 transition-all">
                    <ChevronRight size={18} />
                  </div>
                </button>

                <button
                  onClick={() => handleSelectLossTier('high', 'Powyżej 3000 PLN', 'ponad 36 000 PLN')}
                  className="group relative w-full text-left p-4 sm:p-5 rounded-2xl bg-white/5 hover:bg-[#DC143C]/15 border border-white/10 hover:border-[#DC143C]/50 transition-all duration-200 active:scale-[0.99] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-base group-hover:text-red-400 transition-colors flex items-center gap-2">
                      <span>Powyżej 3 000 PLN miesięcznie</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">Krytyczne</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">„Zarabiam na system” – wielotysięczne straty kapitałowe</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#DC143C] group-hover:text-white flex items-center justify-center text-zinc-400 transition-all">
                    <ChevronRight size={18} />
                  </div>
                </button>
              </div>

              {/* Dolny odnośnik do bezpośredniego kalkulatora */}
              <div className="text-center pt-2">
                <button
                  onClick={() => navigate('/loan')}
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4 transition-colors inline-flex items-center gap-1"
                >
                  <Calculator size={13} />
                  Przejdź od razu do standardowego kalkulatora kredytów
                </button>
              </div>
            </motion.div>
          )}

          {/* KROK 2: Uświadomienie rocznej straty */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-[#FF0033] mx-auto mb-2">
                <TrendingDown size={32} />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#DC143C]">
                  Wyliczenie Skali Przecieku
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                  Przy poziomie <span className="text-[#FF0033]">{lossAmountText}</span> tracisz rocznie aż:
                </h2>
                
                <div className="py-4 px-6 rounded-2xl bg-black/40 border border-red-500/30 inline-block shadow-[inset_0_0_20px_rgba(220,20,60,0.15)]">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                    {annualLossText}
                  </span>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-widest mt-1">
                    To równowartość luksusowych wakacji dla całej rodziny
                  </p>
                </div>

                <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed pt-2">
                  Czy chcesz natychmiast zobaczyć, w których umowach i prowizjach banki ukryły te pieniądze?
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#DC143C] to-[#B22222] hover:from-[#FF0033] hover:to-[#DC143C] text-white font-extrabold text-base sm:text-lg shadow-[0_0_25px_rgba(220,20,60,0.4)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>TAK, pokaż mi wycieki kapitału</span>
                  <ArrowRight size={20} />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleBack}
                    className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 hover:border-white/30 active:scale-95"
                  >
                    <ArrowLeft size={16} className="text-[#FF0033]" />
                    <span>Wróć do wyboru kwoty</span>
                  </button>
                  <button
                    onClick={() => setShowExitWarning(true)}
                    className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Nie, rezygnuję
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* KROK 3: Gotowość do wdrożenia cięć */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-2">
                <AlertTriangle size={32} />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Wymagana Autoryzacja Użytkownika
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                  Zidentyfikowano krytyczne luki w finansach.
                </h2>
                <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                  Jesteś gotowy wdrożyć agresywne cięcia kosztów, skonsolidować obciążenia i odzyskać pełną płynność finansową?
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 size={16} className="text-green-400" />
                  <span>Dostęp do algorytmicznych ofert bez prowizji</span>
                </div>
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 size={16} className="text-green-400" />
                  <span>Obniżenie RRSO do rzeczywistych wartości rynkowych</span>
                </div>
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 size={16} className="text-green-400" />
                  <span>Zabezpieczenie przed podwyżkami stóp procentowych</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-3">
                <button
                  onClick={handleStartScanning}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#DC143C] to-[#B22222] hover:from-[#FF0033] hover:to-[#DC143C] text-white font-extrabold text-base sm:text-lg shadow-[0_0_25px_rgba(220,20,60,0.4)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Flame size={20} />
                  <span>TAK, uruchom protokół naprawczy</span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleBack}
                    className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 hover:border-white/30 active:scale-95"
                  >
                    <ArrowLeft size={16} className="text-[#FF0033]" />
                    <span>Wróć do wyliczenia strat</span>
                  </button>
                  <button
                    onClick={() => setShowExitWarning(true)}
                    className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Nie, rezygnuję
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* KROK 4: Skanowanie algorytmiczne (Scanning Engine) */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="py-8 sm:py-12 flex flex-col items-center justify-center text-center space-y-6"
            >
              {/* Animated Radar / Spinner */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-[#DC143C] border-r-red-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border border-red-500/20 animate-ping opacity-30" />
                <div className="w-14 h-14 rounded-full bg-red-600/15 border border-[#DC143C]/40 flex items-center justify-center text-[#FF0033]">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
              </div>

              <div className="space-y-3 max-w-md">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF0033] bg-[#DC143C]/10 px-3 py-1 rounded-full border border-[#DC143C]/20">
                  Algorytm Analityczny w toku
                </span>
                <p className="text-base sm:text-lg font-mono font-bold text-white min-h-[50px] flex items-center justify-center px-4">
                  {loadingSteps[loadingTextIndex]}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs space-y-1.5">
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-600 via-[#DC143C] to-emerald-400 rounded-full"
                    style={{ width: `${loadingProgress}%` }}
                    transition={{ ease: "easeOut", duration: 0.2 }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-zinc-500 px-1">
                  <span>Przetwarzanie danych</span>
                  <span className="text-white font-bold">{loadingProgress}%</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* KROK 5: Finał & Odblokowanie Lead Formularzem */}
          {currentStep === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 text-center"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 size={14} />
                Analiza Ukończona Pomyślnie
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Twój Raport i Dostęp do Ukrytych Ofert są Gotowe.
                </h2>
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/20 py-2 px-3 rounded-xl max-w-md mx-auto">
                  <Clock size={14} />
                  <span>Dostęp wygasa za 24h. Zabezpieczamy unikalny klucz sesji.</span>
                </div>
              </div>

              {isSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Unlock size={24} />
                  </div>
                  <h3 className="font-bold text-white text-lg">Dostęp Odblokowany!</h3>
                  <p className="text-xs text-emerald-300">
                    Raport dla adresu <strong className="text-white">{email}</strong> został aktywowany. Przekierowujemy Cię do spersonalizowanego centrum ofert...
                  </p>
                  <button
                    onClick={() => navigate('/loan')}
                    className="mt-3 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-all"
                  >
                    Przejdź teraz do ofert
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitLead} className="space-y-4 max-w-md mx-auto text-left">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                      Gdzie przesłać raport optymalizacji i odblokować oferty?
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Wpisz swój najlepszy e-mail..."
                        className={`w-full pl-11 pr-4 py-3.5 sm:py-4 rounded-xl text-white placeholder-zinc-500 text-sm sm:text-base outline-none transition-all ${
                          emailError 
                            ? 'bg-red-950/20 border-2 border-red-500' 
                            : 'bg-black/50 border border-white/20 focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/20'
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="text-red-400 text-xs mt-1.5 font-medium">{emailError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#DC143C] to-[#FF0033] hover:from-[#FF0033] hover:to-[#DC143C] text-white font-extrabold text-base sm:text-lg shadow-[0_0_30px_rgba(220,20,60,0.5)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Generowanie dostępu...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={18} />
                        <span>ODBLOKUJ MOJĄ OFERTĘ & RAPORT</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ArrowLeft size={15} className="text-[#FF0033]" />
                    <span>Wróć do etapu autoryzacji</span>
                  </button>

                  <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                    Szanujemy Twoją prywatność. Żadnego spamu. Zgodność z RODO. Dostęp do poufnych ofert ze zniżką prowizji.
                  </p>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal ostrzeżenia przy próbie rezygnacji (Psychological confirmation) */}
      <AnimatePresence>
        {showExitWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-red-500/40 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/15 text-[#FF0033] flex items-center justify-center mx-auto">
                <AlertTriangle size={26} />
              </div>
              <h3 className="text-lg font-bold text-white leading-snug">
                Czy na pewno chcesz zrezygnować i dalej tracić pieniądze?
              </h3>
              <p className="text-xs text-zinc-400">
                Bez uruchomienia protokołu banki nadal będą pobierać od Ciebie zbędne marże i prowizje. Pozostało tylko kilka sekund do odblokowania.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => setShowExitWarning(false)}
                  className="w-full py-3 rounded-xl bg-[#DC143C] hover:bg-[#FF0033] text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Wróć do optymalizacji
                </button>
                <button
                  onClick={() => {
                    setShowExitWarning(false);
                    navigate('/loan');
                  }}
                  className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Przejdź do zwykłego kalkulatora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
