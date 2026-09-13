import React from 'react';
import { useViewMode } from '../context/ViewModeContext';
import { Smartphone, Monitor, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ViewModeSwitchProps {
  compact?: boolean;
}

export const ViewModeSwitch: React.FC<ViewModeSwitchProps> = ({ compact = false }) => {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div
      className="inline-flex items-center p-1 rounded-full bg-black/40 border border-white/10 shadow-inner backdrop-blur-md relative select-none"
      role="group"
      aria-label="Wybór widoku aplikacji"
    >
      {/* Mobile Mode Button */}
      <button
        type="button"
        onClick={() => setViewMode('mobile')}
        className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-colors duration-200 ${
          viewMode === 'mobile'
            ? 'text-white'
            : 'text-white/50 hover:text-white/80'
        }`}
        title="Widok mobilny (kompaktowy format smartfona)"
      >
        <Smartphone size={13} className={viewMode === 'mobile' ? 'text-[#DC143C]' : ''} />
        <span className={compact ? 'hidden sm:inline' : 'inline'}>Mobilny</span>
        {viewMode === 'mobile' && (
          <motion.div
            layoutId="activeViewIndicator"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-zinc-800 to-zinc-900 border border-white/15 shadow-sm -z-10"
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          />
        )}
      </button>

      {/* Browser / Desktop Mode Button */}
      <button
        type="button"
        onClick={() => setViewMode('browser')}
        className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-colors duration-200 ${
          viewMode === 'browser'
            ? 'text-white'
            : 'text-white/50 hover:text-white/80'
        }`}
        title="Wersja przeglądarkowa (szeroki układ desktopowy z pełną analityką)"
      >
        <Monitor size={13} className={viewMode === 'browser' ? 'text-[#DC143C]' : ''} />
        <span className={compact ? 'hidden sm:inline' : 'inline'}>Przeglądarka</span>
        {viewMode === 'browser' && (
          <motion.div
            layoutId="activeViewIndicator"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[#DC143C]/20 to-zinc-900 border border-[#DC143C]/40 shadow-[0_0_12px_rgba(220,20,60,0.3)] -z-10"
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          />
        )}
      </button>
    </div>
  );
};
