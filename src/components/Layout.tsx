import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useViewMode } from '../context/ViewModeContext';
import { ViewModeSwitch } from './ViewModeSwitch';
import { Eye, Calculator, Home, PiggyBank, ShieldAlert, Building2 } from 'lucide-react';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { isBrowserMode } = useViewMode();
  const location = useLocation();
  const navigate = useNavigate();

  const isCompanyActive = location.pathname === '/firma' || location.pathname === '/spolka' || location.pathname === '/krs' || location.pathname === '/analiza-firmy';
  const isProtocolActive = location.pathname === '/protokol' || location.pathname === '/lejek' || location.pathname === '/funnel' || location.pathname === '/audyt';
  const isLoanActive = location.pathname === '/' || location.pathname === '/loan';
  const isMortgageActive = location.pathname === '/mortgage';
  const isSavingsActive = location.pathname === '/savings';

  return (
    <header className={`w-full transition-colors duration-300 border-b z-50 ${
      theme === 'high-contrast' 
        ? 'bg-black/95 border-white/10' 
        : 'bg-[#121214]/95 border-white/5'
    } backdrop-blur-md`}>
      <div className={`mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 ${
        isBrowserMode ? 'max-w-7xl' : 'max-w-[480px]'
      }`}>
        {/* Logo */}
        <div 
          onClick={() => navigate('/firma')}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <div className="text-xl sm:text-2xl font-black text-white tracking-widest font-montserrat uppercase">
            RaportFinansowy<span className={theme === 'high-contrast' ? 'text-[#FF0033] drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]' : 'text-[#DC143C]'}>24</span>
          </div>
          {isBrowserMode && (
            <span className="hidden md:inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-white/50 group-hover:text-white/80 transition-colors">
              B2B & Finanse
            </span>
          )}
        </div>

        {/* Center Desktop Navigation when in Browser Mode */}
        {isBrowserMode && (
          <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            <button
              onClick={() => navigate('/firma')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                isCompanyActive
                  ? 'bg-[#DC143C] text-white shadow-[0_0_12px_rgba(220,20,60,0.4)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 size={14} className={isCompanyActive ? 'text-white' : 'text-[#FF0033]'} />
              <span>Analiza Spółek</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-black uppercase">KRS / B2B</span>
            </button>
            <button
              onClick={() => navigate('/protokol')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                isProtocolActive
                  ? 'bg-[#DC143C] text-white shadow-[0_0_12px_rgba(220,20,60,0.4)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldAlert size={14} className={isProtocolActive ? 'animate-pulse' : 'text-[#FF0033]'} />
              <span>Protokół AI</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-red-500/20 text-red-300 rounded font-black uppercase">Audyt</span>
            </button>
            <button
              onClick={() => navigate('/loan')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                isLoanActive
                  ? 'bg-[#DC143C] text-white shadow-[0_0_12px_rgba(220,20,60,0.4)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calculator size={14} />
              <span>Kredyty i Pożyczki</span>
            </button>
            <button
              onClick={() => navigate('/mortgage')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                isMortgageActive
                  ? 'bg-[#DC143C] text-white shadow-[0_0_12px_rgba(220,20,60,0.4)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home size={14} />
              <span>Hipoteka</span>
            </button>
            <button
              onClick={() => navigate('/savings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                isSavingsActive
                  ? 'bg-[#DC143C] text-white shadow-[0_0_12px_rgba(220,20,60,0.4)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <PiggyBank size={14} />
              <span>Oszczędności</span>
            </button>
          </nav>
        )}

        {/* Right side controls: View Mode Switch & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ViewModeSwitch compact={!isBrowserMode} />

          <button
            onClick={toggleTheme}
            title={theme === 'high-contrast' ? 'Przełącz na łagodny ciemny' : 'Przełącz na wysoki kontrast'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${
              theme === 'high-contrast'
                ? 'bg-[#1a1114] border-[#FF0033] text-[#FF0033] shadow-[0_0_10px_rgba(255,0,51,0.2)]'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Eye size={12} className={theme === 'high-contrast' ? 'animate-pulse' : ''} />
            <span className="hidden sm:inline text-[9px] sm:text-[10px]">
              {theme === 'high-contrast' ? 'Kontrast' : 'Łagodny'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const Footer = ({ onPrivacyClick, onTermsClick }: { onPrivacyClick: () => void, onTermsClick: () => void }) => {
  const { isBrowserMode, toggleViewMode } = useViewMode();

  return (
    <footer className="w-full py-6 px-6 bg-black/40 border-t border-white/5 text-white/40 text-xs mt-auto">
      <div className={`mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isBrowserMode ? 'max-w-7xl' : 'max-w-[480px]'
      }`}>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <p className="text-[11px] text-white/50">
            © {new Date().getFullYear()} RaportFinansowy24.pl – Niezależna analityka finansowa i algorytmy AI.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onPrivacyClick} className="hover:text-white transition-colors text-[11px] underline">Polityka Prywatności</button>
            <span className="text-white/20">|</span>
            <button onClick={onTermsClick} className="hover:text-white transition-colors text-[11px] underline">Regulamin</button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-white/30 hidden sm:inline">Tryb widoku:</span>
          <button
            onClick={toggleViewMode}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
          >
            {isBrowserMode ? '📱 Przełącz na widok mobilny' : '💻 Przełącz na wersję przeglądarkową'}
          </button>
        </div>
      </div>
    </footer>
  );
};
