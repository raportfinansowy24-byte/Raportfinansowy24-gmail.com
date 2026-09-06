import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Layout';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Terms } from './components/Terms';
import { Chatbot } from './components/Chatbot';
import { Calculator, Home, PiggyBank } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

const LoanCalculator = lazy(() => import('./components/LoanCalculator').then(m => ({ default: m.LoanCalculator })));
const MortgageSimulator = lazy(() => import('./components/MortgageSimulator').then(m => ({ default: m.MortgageSimulator })));
const SavingsGoal = lazy(() => import('./components/SavingsGoal').then(m => ({ default: m.SavingsGoal })));
const NotificationSystem = lazy(() => import('./components/NotificationSystem').then(m => ({ default: m.NotificationSystem })));

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`relative z-20 w-full max-w-[480px] flex-1 flex flex-col mx-auto sm:border-x transition-colors duration-300 overflow-hidden ${
      theme === 'high-contrast' 
        ? 'bg-black border-white/5' 
        : 'bg-[#18181b] border-white/10'
    }`}>
      <Suspense fallback={<div className="flex items-center justify-center h-full text-white/50">Ładowanie...</div>}>
        <div className="absolute top-4 right-4 z-50">
          <NotificationSystem />
        </div>
        
        {/* Navigation Bar */}
        <div className={`flex justify-between items-center transition-colors duration-300 border-b p-4 z-40 rounded-t-3xl sm:rounded-none ${
          theme === 'high-contrast'
            ? 'bg-[#0a0a0a] border-white/5'
            : 'bg-[#1e1e24] border-white/10'
        }`}>
          <button 
            onClick={() => navigate('/loan')}
            className={`flex-1 flex flex-col items-center justify-center py-4 rounded-3xl transition-all ${
              location.pathname === '/loan' || location.pathname === '/' 
                ? (theme === 'high-contrast'
                    ? 'bg-[#1a1114] border border-[#FF0033] text-[#FF0033] shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                    : 'bg-[#ff0033]/10 border border-[#dc143c]/30 text-[#dc143c]'
                  )
                : (theme === 'high-contrast' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-200')
            }`}
          >
            <Calculator size={20} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Kredyty</span>
          </button>
          <button 
            onClick={() => navigate('/mortgage')}
            className={`flex-1 flex flex-col items-center justify-center py-4 rounded-3xl transition-all mx-2 ${
              location.pathname === '/mortgage' 
                ? (theme === 'high-contrast'
                    ? 'bg-[#1a1114] border border-[#FF0033] text-[#FF0033] shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                    : 'bg-[#ff0033]/10 border border-[#dc143c]/30 text-[#dc143c]'
                  )
                : (theme === 'high-contrast' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-200')
            }`}
          >
            <Home size={20} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Hipoteka</span>
          </button>
          <button 
            onClick={() => navigate('/savings')}
            className={`flex-1 flex flex-col items-center justify-center py-4 rounded-3xl transition-all ${
              location.pathname === '/savings' 
                ? (theme === 'high-contrast'
                    ? 'bg-[#1a1114] border border-[#FF0033] text-[#FF0033] shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                    : 'bg-[#ff0033]/10 border border-[#dc143c]/30 text-[#dc143c]'
                  )
                : (theme === 'high-contrast' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-200')
            }`}
          >
            <PiggyBank size={20} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Oszczędności</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden w-full relative min-h-0 flex flex-col">
          <AnimatePresence mode="wait">
            {(location.pathname === '/' || location.pathname === '/loan') && (
              <motion.div
                key="loan"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full overflow-hidden flex flex-col p-2 sm:p-4"
              >
                <LoanCalculator />
              </motion.div>
            )}
            {location.pathname === '/mortgage' && (
              <motion.div
                key="mortgage"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full overflow-hidden flex flex-col p-2 sm:p-4"
              >
                <MortgageSimulator />
              </motion.div>
            )}
            {location.pathname === '/savings' && (
              <motion.div
                key="savings"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full overflow-hidden flex flex-col p-2 sm:p-4"
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
  const { theme } = useTheme();

  return (
    <main className={`relative h-full w-full flex flex-col items-center transition-colors duration-300 text-center text-white overflow-hidden sm:overflow-auto ${
      theme === 'high-contrast' ? 'bg-[#050505]' : 'bg-[#121215]'
    }`}>
      <Header />
      <AppContent />
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      {showTerms && <Terms onClose={() => setShowTerms(false)} />}
      <Chatbot />
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ThemeProvider>
  );
}
