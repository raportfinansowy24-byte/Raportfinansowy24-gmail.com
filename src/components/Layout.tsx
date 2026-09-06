import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Eye } from 'lucide-react';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={`w-full py-4 px-6 border-b transition-colors duration-300 flex justify-between items-center ${
      theme === 'high-contrast' 
        ? 'bg-black border-white/10' 
        : 'bg-[#121214] border-white/5'
    }`}>
      {/* Spacer to align logo */}
      <div className="w-8 sm:w-12"></div>

      <div className="text-2xl font-black text-white tracking-widest font-montserrat uppercase scale-[0.9] sm:scale-100 select-none">
        RaportFinansowy<span className={theme === 'high-contrast' ? 'text-[#FF0033] drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]' : 'text-[#DC143C]'}>24</span>
      </div>

      <button
        onClick={toggleTheme}
        title={theme === 'high-contrast' ? 'Przełącz na łagodny ciemny' : 'Przełącz na wysoki kontrast'}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${
          theme === 'high-contrast'
            ? 'bg-[#1a1114] border-[#FF0033] text-[#FF0033] shadow-[0_0_10px_rgba(255,0,51,0.2)]'
            : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
        }`}
      >
        <Eye size={12} className={theme === 'high-contrast' ? 'animate-pulse' : ''} />
        <span className="text-[9px] sm:text-[10px]">
          {theme === 'high-contrast' ? 'Kontrast' : 'Łagodny'}
        </span>
      </button>
    </header>
  );
};

export const Footer = ({ onPrivacyClick, onTermsClick }: { onPrivacyClick: () => void, onTermsClick: () => void }) => (
  <footer className="w-full py-6 px-6 bg-zinc-950 border-t border-zinc-800 text-zinc-500 text-xs">
    <div className="flex justify-center gap-4">
      <button onClick={onPrivacyClick} className="hover:text-white transition-colors">Polityka Prywatności</button>
      <span className="text-zinc-700">|</span>
      <button onClick={onTermsClick} className="hover:text-white transition-colors">Regulamin</button>
    </div>
  </footer>
);
