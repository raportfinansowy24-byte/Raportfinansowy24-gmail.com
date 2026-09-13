import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { Header, Footer } from './components/Layout';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Terms } from './components/Terms';
import { Chatbot } from './components/Chatbot';
import { Calculator, Home, PiggyBank, ShieldAlert, Building2 } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ViewModeProvider, useViewMode } from './context/ViewModeContext';
import { motion, AnimatePresence } from 'motion/react';

const CompanyAnalysis = lazy(() => import('./components/CompanyAnalysis').then(m => ({ default: m.CompanyAnalysis })));
const FinancialProtocolFunnel = lazy(() => import('./components/FinancialProtocolFunnel').then(m => ({ default: m.FinancialProtocolFunnel })));
const LoanCalculator = lazy(() => import('./components/LoanCalculator').then(m => ({ default: m.LoanCalculator })));
const MortgageSimulator = lazy(() => import('./components/MortgageSimulator').then(m => ({ default: m.MortgageSimulator })));
const SavingsGoal = lazy(() => import('./components/SavingsGoal').then(m => ({ default: m.SavingsGoal })));
const VideoGenerator = lazy(() => import('./components/VideoGenerator').then(m => ({ default: m.VideoGenerator })));
const NotificationSystem = lazy(() => import('./components/NotificationSystem').then(m => ({ default: m.NotificationSystem })));

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isBrowserMode, toggleViewMode } = useViewMode();

  const isCompanyActive = location.pathname === '/firma' || location.pathname === '/spolka' || location.pathname === '/krs' || location.pathname === '/analiza-firmy';
  const isProtocolActive = location.pathname === '/protokol' || location.pathname === '/funnel' || location.pathname === '/lejek' || location.pathname === '/audyt';

  return (
    <div className={`relative z-20 w-full flex-1 flex flex-col mx-auto transition-all duration-300 ${
      isBrowserMode
        ? 'max-w-7xl px-3 sm:px-6 lg:px-8 py-3'
        : `max-w-[480px] sm:border-x sm:my-3 sm:rounded-[36px] sm:shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden ${
            theme === 'high-contrast' ? 'bg-black border-white/10' : 'bg-[#18181b] border-white/10'
          }`
    }`}>
      <Suspense fallback={<div className="flex items-center justify-center h-64 text-white/50">Ładowanie analizatora...</div>}>
        <div className="absolute top-4 right-4 z-50">
          <NotificationSystem />
        </div>

        {/* Mobile-only Navigation Bar (shown when in mobile mode or on small screens) */}
        {!isBrowserMode && (
          <div className={`flex justify-between items-center transition-colors duration-300 border-b p-2 sm:p-4 z-40 rounded-t-3xl sm:rounded-none ${
            theme === 'high-contrast'
              ? 'bg-[#0a0a0a] border-white/5'
              : 'bg-[#1e1e24] border-white/10'
          }`}>
            <button 
              onClick={() => navigate('/firma')}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${
                isCompanyActive
                  ? (theme === 'high-contrast'
                      ? 'bg-[#1a1114] border border-[#FF0033] text-[#FF0033] shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                      : 'bg-[#ff0033]/10 border border-[#dc143c]/30 text-[#dc143c]'
                    )
                  : (theme === 'high-contrast' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-200')
              }`}
            >
              <Building2 size={16} className="mb-0.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Firma</span>
            </button>
            <button 
              onClick={() => navigate('/protokol')}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all mx-1 ${
                isProtocolActive
                  ? (theme === 'high-contrast'
                      ? 'bg-[#1a1114] border border-[#FF0033] text-[#FF0033] shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                      : 'bg-[#ff0033]/10 border border-[#dc143c]/30 text-[#dc143c]'
                    )
                  : (theme === 'high-contrast' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-200')
              }`}
            >
              <ShieldAlert size={16} className="mb-0.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Protokół</span>
            </button>
            <button 
              onClick={() => navigate('/loan')}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all mx-1 ${
                location.pathname === '/loan' || location.pathname === '/' 
                  ? (theme === 'high-contrast'
                      ? 'bg-[#1a1114] border border-[#FF0033] text-[#FF0033] shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                      : 'bg-[#ff0033]/10 border border-[#dc143c]/30 text-[#dc143c]'
                    )
                  : (theme === 'high-contrast' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-200')
              }`}
            >
              <Calculator size={16} className="mb-0.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Kredyty</span>
            </button>
            <button 
              onClick={() => navigate('/mortgage')}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all mx-1 ${
                location.pathname === '/mortgage' 
                  ? (theme === 'high-contrast'
                      ? 'bg-[#1a1114] border border-[#FF0033] text-[#FF0033] shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                      : 'bg-[#ff0033]/10 border border-[#dc143c]/30 text-[#dc143c]'
                    )
                  : (theme === 'high-contrast' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-200')
              }`}
            >
              <Home size={16} className="mb-0.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Hipoteka</span>
            </button>
            <button 
              onClick={() => navigate('/savings')}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${
                location.pathname === '/savings' 
                  ? (theme === 'high-contrast'
                      ? 'bg-[#1a1114] border border-[#FF0033] text-[#FF0033] shadow-[0_0_15px_rgba(255,0,51,0.2)]'
                      : 'bg-[#ff0033]/10 border border-[#dc143c]/30 text-[#dc143c]'
                    )
                  : (theme === 'high-contrast' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-200')
              }`}
            >
              <PiggyBank size={16} className="mb-0.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Oszczędź</span>
            </button>
          </div>
        )}

        {/* Browser Mode Top Sub-header / Quick bar on mobile/tablet if needed */}
        {isBrowserMode && (
          <div className="flex lg:hidden justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-2 mb-4 overflow-x-auto gap-1">
            <button 
              onClick={() => navigate('/firma')}
              className={`flex-1 min-w-[75px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all ${
                isCompanyActive ? 'bg-[#DC143C] text-white' : 'text-white/60'
              }`}
            >
              <Building2 size={14} />
              <span>Firma B2B</span>
            </button>
            <button 
              onClick={() => navigate('/protokol')}
              className={`flex-1 min-w-[75px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all ${
                isProtocolActive ? 'bg-[#DC143C] text-white' : 'text-white/60'
              }`}
            >
              <ShieldAlert size={14} />
              <span>Protokół</span>
            </button>
            <button 
              onClick={() => navigate('/loan')}
              className={`flex-1 min-w-[75px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname === '/loan' || location.pathname === '/' ? 'bg-[#DC143C] text-white' : 'text-white/60'
              }`}
            >
              <Calculator size={14} />
              <span>Kredyty</span>
            </button>
            <button 
              onClick={() => navigate('/mortgage')}
              className={`flex-1 min-w-[75px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname === '/mortgage' ? 'bg-[#DC143C] text-white' : 'text-white/60'
              }`}
            >
              <Home size={14} />
              <span>Hipoteka</span>
            </button>
            <button 
              onClick={() => navigate('/savings')}
              className={`flex-1 min-w-[75px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname === '/savings' ? 'bg-[#DC143C] text-white' : 'text-white/60'
              }`}
            >
              <PiggyBank size={14} />
              <span>Oszczędź</span>
            </button>
          </div>
        )}

        {/* Content Container */}
        <div className={`flex-1 w-full relative min-h-0 flex flex-col ${
          isBrowserMode ? 'overflow-visible' : 'overflow-hidden'
        }`}>
          <AnimatePresence mode="wait">
            {isCompanyActive && (
              <motion.div
                key="company"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={isBrowserMode 
                  ? "w-full flex flex-col"
                  : "absolute inset-0 w-full h-full overflow-y-auto flex flex-col p-2 sm:p-4"
                }
              >
                <CompanyAnalysis />
              </motion.div>
            )}
            {isProtocolActive && (
              <motion.div
                key="protokol"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={isBrowserMode 
                  ? "w-full flex flex-col"
                  : "absolute inset-0 w-full h-full overflow-y-auto flex flex-col p-2 sm:p-4"
                }
              >
                <FinancialProtocolFunnel />
              </motion.div>
            )}
            {(location.pathname === '/' || location.pathname === '/loan') && (
              <motion.div
                key="loan"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={isBrowserMode 
                  ? "w-full flex flex-col"
                  : "absolute inset-0 w-full h-full overflow-hidden flex flex-col p-2 sm:p-4"
                }
              >
                <LoanCalculator />
              </motion.div>
            )}
            {location.pathname === '/mortgage' && (
              <motion.div
                key="mortgage"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={isBrowserMode 
                  ? "w-full flex flex-col"
                  : "absolute inset-0 w-full h-full overflow-hidden flex flex-col p-2 sm:p-4"
                }
              >
                <MortgageSimulator />
              </motion.div>
            )}
            {location.pathname === '/savings' && (
              <motion.div
                key="savings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={isBrowserMode 
                  ? "w-full flex flex-col"
                  : "absolute inset-0 w-full h-full overflow-hidden flex flex-col p-2 sm:p-4"
                }
              >
                <SavingsGoal />
              </motion.div>
            )}
            {(location.pathname === '/video' || location.pathname === '/wideo') && (
              <motion.div
                key="video"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={isBrowserMode 
                  ? "w-full flex flex-col"
                  : "absolute inset-0 w-full h-full overflow-hidden flex flex-col p-2 sm:p-4"
                }
              >
                <VideoGenerator />
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
    <main className={`relative min-h-screen w-full flex flex-col transition-colors duration-300 text-white ${
      theme === 'high-contrast' ? 'bg-[#050505]' : 'bg-[#121215]'
    }`}>
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
