import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { Header, Footer } from './components/Layout';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Terms } from './components/Terms';
import { Chatbot } from './components/Chatbot';
import { ReferralModal } from './components/ReferralModal';
import { ReferralBanner } from './components/ReferralBanner';
import { LiveMarketTicker } from './components/LiveMarketTicker';
import { Calculator, Home as HomeIcon, PiggyBank, ShieldAlert, Building2, CreditCard } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { ViewModeProvider } from './context/ViewModeContext';
import { motion, AnimatePresence } from 'motion/react';

const Home = lazy(() => import('./components/Home').then(m => ({ default: m.Home })));
const CompanyAnalysis = lazy(() => import('./components/CompanyAnalysis').then(m => ({ default: m.CompanyAnalysis })));
const FinancialProtocolFunnel = lazy(() => import('./components/FinancialProtocolFunnel').then(m => ({ default: m.FinancialProtocolFunnel })));
const LoanCalculator = lazy(() => import('./components/LoanCalculator').then(m => ({ default: m.LoanCalculator })));
const MortgageSimulator = lazy(() => import('./components/MortgageSimulator').then(m => ({ default: m.MortgageSimulator })));
const SavingsGoal = lazy(() => import('./components/SavingsGoal').then(m => ({ default: m.SavingsGoal })));
const BankAccountsHub = lazy(() => import('./components/BankAccountsHub').then(m => ({ default: m.BankAccountsHub })));
const AboutUs = lazy(() => import('./components/AboutUs').then(m => ({ default: m.AboutUs })));

import { getLastCalculationMeta, hasSessionBeenRedirected, markSessionRedirected, CalculationSessionMeta } from './lib/userSessionState';
import { RotateCcw, Sparkles } from 'lucide-react';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [restoredBanner, setRestoredBanner] = useState<CalculationSessionMeta | null>(null);

  // Automatyczne przywracanie ostatniego okna i kalkulacji dla powracającego klienta
  useEffect(() => {
    if (location.pathname === '/' && !hasSessionBeenRedirected()) {
      const lastCalc = getLastCalculationMeta();
      if (lastCalc && lastCalc.route) {
        markSessionRedirected();
        setRestoredBanner(lastCalc);
        navigate(lastCalc.route, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  // Automatyczne ukrywanie banera po 8 sekundach
  useEffect(() => {
    if (restoredBanner) {
      const timer = setTimeout(() => setRestoredBanner(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [restoredBanner]);

  const isCompanyActive = location.pathname === '/firma' || location.pathname === '/spolka' || location.pathname === '/krs' || location.pathname === '/analiza-firmy';
  const isProtocolActive = location.pathname === '/protokol' || location.pathname === '/funnel' || location.pathname === '/lejek' || location.pathname === '/audyt';
  const isLoanActive = location.pathname === '/loan';
  const isKontaActive = location.pathname === '/konta' || location.pathname === '/banki' || location.pathname === '/konta-bankowe';
  const isMortgageActive = location.pathname === '/mortgage';
  const isSavingsActive = location.pathname === '/savings';
  const isAboutActive = location.pathname === '/o-nas' || location.pathname === '/about' || location.pathname === '/about-us';

  const mobileNavItems = [
    { label: 'Kredyty', path: '/loan', active: isLoanActive, icon: Calculator },
    { label: 'Konta', path: '/konta', active: isKontaActive, icon: CreditCard },
    { label: 'Hipoteka', path: '/mortgage', active: isMortgageActive, icon: HomeIcon },
    { label: 'Oszczędź', path: '/savings', active: isSavingsActive, icon: PiggyBank },
    { label: 'Doradca AI', path: '/protokol', active: isProtocolActive, icon: ShieldAlert },
  ];

  return (
    <div className="relative z-20 w-full flex-1 flex flex-col mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2.5 sm:py-6 pb-20 sm:pb-8">
      {/* Floating notification when returning user is restored to their last window */}
      <AnimatePresence>
        {restoredBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-zinc-900/95 via-[#18181b]/95 to-zinc-900/95 border border-[#DC143C]/40 shadow-xl shadow-black/50 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#DC143C]/20 border border-[#DC143C]/40 flex items-center justify-center text-[#DC143C] shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Witaj z powrotem!</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#DC143C]/20 text-[#DC143C] text-[10px] font-bold uppercase tracking-wider">
                    {restoredBanner.badge}
                  </span>
                </div>
                <p className="text-zinc-300 text-[11px] sm:text-xs mt-0.5">
                  Przywrócono Twoje ostatnie okno: <span className="text-white font-medium">{restoredBanner.title}</span> ({restoredBanner.summary})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => navigate('/')}
                className="px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer text-[11px] font-medium"
              >
                Strona główna
              </button>
              <button
                onClick={() => setRestoredBanner(null)}
                className="px-3 py-1.5 rounded-xl bg-[#DC143C] text-white hover:bg-[#b01030] transition-colors cursor-pointer font-bold text-[11px] shadow-sm shadow-[#DC143C]/30"
              >
                Rozumiem
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Suspense fallback={<div className="flex items-center justify-center h-64 text-zinc-400 text-sm">Ładowanie modułu finansowego...</div>}>
        {/* Mobile Navigation Bar (visible on small screens < md) */}
        <div className="md:hidden grid grid-cols-5 gap-1 p-1 mb-3.5 rounded-2xl bg-[#121216]/95 backdrop-blur-md border border-white/[0.08] shadow-lg">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                  item.active
                    ? 'bg-[#DC143C] text-white shadow-sm shadow-[#DC143C]/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                <Icon size={16} className="mb-0.5" />
                <span className="text-[9px] font-bold tracking-tight truncate w-full text-center">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Container */}
        <div className="flex-1 w-full relative flex flex-col">
          <AnimatePresence mode="wait">
            {location.pathname === '/' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full flex flex-col"
              >
                <Home />
              </motion.div>
            )}
            {isCompanyActive && (
              <motion.div
                key="company"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full flex flex-col"
              >
                <CompanyAnalysis />
              </motion.div>
            )}
            {isProtocolActive && (
              <motion.div
                key="protokol"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full flex flex-col"
              >
                <FinancialProtocolFunnel />
              </motion.div>
            )}
            {location.pathname === '/loan' && (
              <motion.div
                key="loan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full flex flex-col"
              >
                <LoanCalculator />
              </motion.div>
            )}
            {location.pathname === '/mortgage' && (
              <motion.div
                key="mortgage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full flex flex-col"
              >
                <MortgageSimulator />
              </motion.div>
            )}
            {location.pathname === '/savings' && (
              <motion.div
                key="savings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full flex flex-col"
              >
                <SavingsGoal />
              </motion.div>
            )}
            {isKontaActive && (
              <motion.div
                key="konta"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full flex flex-col"
              >
                <BankAccountsHub />
              </motion.div>
            )}
            {isAboutActive && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full flex flex-col"
              >
                <AboutUs />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Suspense>
    </div>
  );
}

function AppLayout() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  useEffect(() => {
    const handleOpenReferral = () => setShowReferral(true);
    window.addEventListener('open_referral_modal', handleOpenReferral);
    return () => window.removeEventListener('open_referral_modal', handleOpenReferral);
  }, []);

  return (
    <main className="relative min-h-screen w-full flex flex-col bg-[#09090b] text-zinc-100 selection:bg-[#DC143C] selection:text-white overflow-x-hidden">
      {/* Dynamic Ambient Background Glow Orbs */}
      <div className="ambient-glow-orb w-[500px] h-[500px] -top-32 -left-32 bg-[#DC143C]/[0.04] animate-float-slow" />
      <div className="ambient-glow-orb w-[600px] h-[600px] top-1/3 -right-48 bg-indigo-500/[0.025] animate-float-reverse" />
      <div className="ambient-glow-orb w-[450px] h-[450px] bottom-32 left-1/4 bg-[#DC143C]/[0.03] animate-pulse-subtle" />

      <ReferralBanner onOpenModal={() => setShowReferral(true)} />
      <Header onOpenReferral={() => setShowReferral(true)} />
      <LiveMarketTicker />
      <AppContent />
      <Footer 
        onPrivacyClick={() => setShowPrivacy(true)} 
        onTermsClick={() => setShowTerms(true)} 
        onOpenReferral={() => setShowReferral(true)}
      />
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      {showTerms && <Terms onClose={() => setShowTerms(false)} />}
      <ReferralModal isOpen={showReferral} onClose={() => setShowReferral(false)} />
      <Chatbot />
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ViewModeProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </ViewModeProvider>
    </ThemeProvider>
  );
}

