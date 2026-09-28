import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, Home, PiggyBank, ShieldAlert, Building2, ArrowRight, Mail, Phone } from 'lucide-react';

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isHomeActive = location.pathname === '/';
  const isCompanyActive = location.pathname === '/firma' || location.pathname === '/spolka' || location.pathname === '/krs' || location.pathname === '/analiza-firmy';
  const isProtocolActive = location.pathname === '/protokol' || location.pathname === '/lejek' || location.pathname === '/funnel' || location.pathname === '/audyt';
  const isLoanActive = location.pathname === '/loan';
  const isMortgageActive = location.pathname === '/mortgage';
  const isSavingsActive = location.pathname === '/savings';

  const navItems = [
    { label: 'Kredyty', path: '/loan', active: isLoanActive, icon: Calculator },
    { label: 'Hipoteka', path: '/mortgage', active: isMortgageActive, icon: Home },
    { label: 'Oszczędności', path: '/savings', active: isSavingsActive, icon: PiggyBank },
    { label: 'Protokół AI', path: '/protokol', active: isProtocolActive, icon: ShieldAlert },
    { label: 'Audyt Firmy (NIP)', path: '/firma', active: isCompanyActive, icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full transition-colors duration-300 border-b border-white/[0.08] bg-[#09090b]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DC143C] to-[#8B0000] flex items-center justify-center font-black text-white text-sm shadow-md shadow-[#DC143C]/20 group-hover:scale-105 transition-transform">
            24
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black text-white tracking-wider font-montserrat uppercase leading-none">
              RaportFinansowy<span className="text-[#DC143C]">24</span>
            </span>
            <span className="text-[9px] text-zinc-400 font-medium tracking-widest uppercase">
              Fintech & AI Analytics
            </span>
          </div>
        </div>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/[0.08]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  item.active
                    ? 'bg-[#DC143C] text-white shadow-sm shadow-[#DC143C]/40'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon size={14} className={item.active ? 'text-white' : 'text-zinc-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate(isCompanyActive ? '/loan' : '/firma')}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.12] transition-all cursor-pointer active:scale-95"
          >
            {isCompanyActive ? (
              <>
                <Calculator size={14} className="text-[#DC143C]" />
                <span className="hidden sm:inline">Kalkulator rat</span>
                <span className="sm:hidden">Kalkulator</span>
              </>
            ) : (
              <>
                <Building2 size={14} className="text-[#DC143C]" />
                <span className="hidden sm:inline">Sprawdź firmę po NIP</span>
                <span className="sm:hidden">Audyt NIP</span>
              </>
            )}
            <ArrowRight size={13} className="text-zinc-400" />
          </button>
        </div>
      </div>
    </header>
  );
};

export const Footer = ({ onPrivacyClick, onTermsClick }: { onPrivacyClick: () => void, onTermsClick: () => void }) => {
  return (
    <footer className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-[#070709] border-t border-white/[0.08] text-zinc-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-zinc-300 font-semibold text-[11px]">System online</span>
          </div>
          <span className="hidden sm:inline text-white/20">•</span>
          <p className="text-[11px] text-zinc-400">
            © {new Date().getFullYear()} RaportFinansowy24.pl – Niezależna analityka finansowa i algorytmy AI. <span className="text-zinc-600 font-mono text-[10px]">v1.0.1</span>
          </p>
        </div>

        {/* Contact info: Email & Phone */}
        <div className="flex items-center gap-4 text-[11px] flex-wrap justify-center">
          <a 
            href="mailto:raportfinansowy24@gmail.com" 
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors"
            title="Napisz do nas"
          >
            <Mail size={13} className="text-[#DC143C]" />
            <span>raportfinansowy24@gmail.com</span>
          </a>

          <span className="text-white/20 hidden sm:inline">•</span>

          <a 
            href="tel:+491778466985" 
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors"
            title="Zadzwoń do nas"
          >
            <Phone size={13} className="text-[#DC143C]" />
            <span>+49 177 8466985</span>
          </a>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <button 
            onClick={onPrivacyClick} 
            className="hover:text-white transition-colors underline cursor-pointer"
          >
            Polityka Prywatności
          </button>
          <span className="text-white/20">|</span>
          <button 
            onClick={onTermsClick} 
            className="hover:text-white transition-colors underline cursor-pointer"
          >
            Regulamin
          </button>
        </div>
      </div>
    </footer>
  );
};

