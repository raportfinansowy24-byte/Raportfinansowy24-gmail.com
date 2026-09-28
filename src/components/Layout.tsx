import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Calculator, Home, PiggyBank, ShieldAlert, Building2, CreditCard, 
  ArrowRight, Mail, Phone, Gift, Crown, Sparkles 
} from 'lucide-react';
import { referralService, ReferralState } from '../services/referral.service';
import { NotificationSystem } from './NotificationSystem';

export const Header = ({ onOpenReferral }: { onOpenReferral?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [refState, setRefState] = useState<ReferralState>(referralService.getState());

  useEffect(() => {
    const unsub = referralService.subscribe(setRefState);
    return () => unsub();
  }, []);

  const isHomeActive = location.pathname === '/';
  const isKontaActive = location.pathname === '/konta' || location.pathname === '/banki' || location.pathname === '/konta-bankowe';
  const isProtocolActive = location.pathname === '/protokol' || location.pathname === '/lejek' || location.pathname === '/funnel' || location.pathname === '/audyt';
  const isLoanActive = location.pathname === '/loan';
  const isMortgageActive = location.pathname === '/mortgage';
  const isSavingsActive = location.pathname === '/savings';

  const navItems = [
    { label: 'Kredyty', path: '/loan', active: isLoanActive, icon: Calculator },
    { label: 'Konta Bankowe', path: '/konta', active: isKontaActive, icon: CreditCard },
    { label: 'Hipoteka', path: '/mortgage', active: isMortgageActive, icon: Home },
    { label: 'Oszczędności', path: '/savings', active: isSavingsActive, icon: PiggyBank },
    { label: 'Doradca AI', path: '/protokol', active: isProtocolActive, icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-50 w-full transition-colors duration-300 border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#DC143C] to-[#8B0000] flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-md shadow-[#DC143C]/20 group-hover:scale-105 transition-transform">
            24
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base md:text-lg font-black text-white tracking-wider font-montserrat uppercase leading-none">
              RaportFinansowy<span className="text-[#DC143C]">24</span>
            </span>
            <span className="text-[8px] sm:text-[9px] text-zinc-400 font-medium tracking-widest uppercase">
              Fintech & AI
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

        {/* Right CTA, Referral & Notification */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Notifications in header */}
          <div className="flex items-center">
            <NotificationSystem />
          </div>

          {/* Viral Referral Program Button */}
          <button
            onClick={onOpenReferral}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Program Poleceń - Odbierz Raporty Premium"
          >
            <Gift size={13} className="text-amber-400 animate-bounce" />
            <span className="hidden sm:inline">Poleć</span>
            {refState.isVipUnlimited ? (
              <span className="px-1 py-0.2 text-[8px] sm:text-[9px] bg-gradient-to-r from-amber-400 to-amber-600 text-black font-black rounded uppercase flex items-center gap-0.5">
                <Crown size={8} /> VIP
              </span>
            ) : (
              <span className="px-1.5 py-0.2 text-[8px] sm:text-[9px] bg-[#DC143C] text-white font-black rounded-full shadow-sm">
                +{refState.premiumCredits}
              </span>
            )}
          </button>

          {/* Right Action Button */}
          <button
            onClick={() => navigate('/konta')}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-white bg-gradient-to-r from-[#DC143C]/20 to-[#DC143C]/40 hover:from-[#DC143C]/30 hover:to-[#DC143C]/50 border border-[#DC143C]/40 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <CreditCard size={13} className="text-[#DC143C]" />
            <span className="hidden sm:inline">Konta z premią</span>
            <span className="sm:hidden">Premie</span>
            <ArrowRight size={11} className="text-zinc-300 hidden xs:inline" />
          </button>
        </div>
      </div>
    </header>
  );
};

export const Footer = ({ 
  onPrivacyClick, 
  onTermsClick,
  onOpenReferral
}: { 
  onPrivacyClick: () => void; 
  onTermsClick: () => void;
  onOpenReferral?: () => void;
}) => {
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

        <div className="flex items-center gap-4 text-[11px] flex-wrap justify-center">
          {onOpenReferral && (
            <>
              <button 
                onClick={onOpenReferral} 
                className="text-amber-300 hover:text-amber-200 transition-colors cursor-pointer font-bold flex items-center gap-1"
              >
                <Gift size={12} className="text-amber-400" />
                <span>Program Poleceń (Zyskaj Premium)</span>
              </button>
              <span className="text-white/20">|</span>
            </>
          )}
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

