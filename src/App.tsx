import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { Header, Footer } from './components/Layout';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Terms } from './components/Terms';
import { Chatbot } from './components/Chatbot';
import { Calculator, Home as HomeIcon, PiggyBank, ShieldAlert, Building2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { ViewModeProvider } from './context/ViewModeContext';
import { motion, AnimatePresence } from 'motion/react';

const Home = lazy(() => import('./components/Home').then(m => ({ default: m.Home })));
const CompanyAnalysis = lazy(() => import('./components/CompanyAnalysis').then(m => ({ default: m.CompanyAnalysis })));
const FinancialProtocolFunnel = lazy(() => import('./components/FinancialProtocolFunnel').then(m => ({ default: m.FinancialProtocolFunnel })));
const LoanCalculator = lazy(() => import('./components/LoanCalculator').then(m => ({ default: m.LoanCalculator })));
const MortgageSimulator = lazy(() => import('./components/MortgageSimulator').then(m => ({ default: m.MortgageSimulator })));
const SavingsGoal = lazy(() => import('./components/SavingsGoal').then(m => ({ default: m.SavingsGoal })));
const NotificationSystem = lazy(() => import('./components/NotificationSystem').then(m => ({ default: m.NotificationSystem })));

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const isCompanyActive = location.pathname === '/firma' || location.pathname === '/spolka' || location.pathname === '/krs' || location.pathname === '/analiza-firmy';
  const isProtocolActive = location.pathname === '/protokol' || location.pathname === '/funnel' || location.pathname === '/lejek' || location.pathname === '/audyt';
  const isLoanActive = location.pathname === '/loan';
  const isMortgageActive = location.pathname === '/mortgage';
  const isSavingsActive = location.pathname === '/savings';

  const mobileNavItems = [
    { label: 'Kredyty', path: '/loan', active: isLoanActive, icon: Calculator },
    { label: 'Hipoteka', path: '/mortgage', active: isMortgageActive, icon: HomeIcon },
    { label: 'Oszczędź', path: '/savings', active: isSavingsActive, icon: PiggyBank },
    { label: 'Protokół', path: '/protokol', active: isProtocolActive, icon: ShieldAlert },
    { label: 'Firma / NIP', path: '/firma', active: isCompanyActive, icon: Building2 },
  ];

  return (
    <div className="relative z-20 w-full flex-1 flex flex-col mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
      <Suspense fallback={<div className="flex items-center justify-center h-64 text-zinc-400 text-sm">Ładowanie modułu finansowego...</div>}>
        <div className="absolute top-4 right-4 z-50">
          <NotificationSystem />
        </div>

        {/* Mobile Navigation Bar (visible on small screens < md) */}
        <div className="md:hidden flex items-center justify-between gap-1 p-1.5 mb-4 rounded-2xl bg-[#121216] border border-white/[0.08] shadow-lg">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                  item.active
                    ? 'bg-[#DC143C] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon size={15} className="mb-0.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
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
          </AnimatePresence>
        </div>
      </Suspense>
    </div>
  );
}

function AppLayout() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <main className="relative min-h-screen w-full flex flex-col bg-[#09090b] text-zinc-100 selection:bg-[#DC143C] selection:text-white">
      <Header />
      <AppContent />
      <Footer onPrivacyClick={() => setShowPrivacy(true)} onTermsClick={() => setShowTerms(true)} />
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      {showTerms && <Terms onClose={() => setShowTerms(false)} />}
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

