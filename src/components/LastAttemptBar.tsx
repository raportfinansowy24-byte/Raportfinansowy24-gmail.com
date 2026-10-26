import React, { useState, useEffect } from 'react';
import { Copy, Check, Trash2, Clock, RotateCcw, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface LastAttemptState {
  time: string; // np. "12:03:36"
  progressPercent: number; // np. 12
  hasErrors: boolean;
  errorsFixed: boolean;
  errorMessages: string[];
  lastUpdated: number;
}

interface LastAttemptBarProps {
  initialTime?: string;
  initialProgress?: number;
  hasErrors?: boolean;
  errorsFixed?: boolean;
  errorMessages?: string[];
  onRetryAttempt?: () => void;
  onClearAttempt?: () => void;
  onCopyAttempt?: () => void;
  className?: string;
  showErrorDetails?: boolean;
}

const STORAGE_KEY = 'rf24_last_attempt_state';

export const LastAttemptBar: React.FC<LastAttemptBarProps> = ({
  initialTime = '12:03:36',
  initialProgress = 12,
  hasErrors = true,
  errorsFixed = false,
  errorMessages = [],
  onRetryAttempt,
  onClearAttempt,
  onCopyAttempt,
  className = '',
  showErrorDetails = true,
}) => {
  // Stan próby ładowany z pamięci lub przekazanych wartości
  const [attemptTime, setAttemptTime] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.time) return parsed.time;
      }
    } catch {}
    return initialTime;
  });

  const [progress, setProgress] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.progressPercent === 'number') return parsed.progressPercent;
      }
    } catch {}
    return initialProgress;
  });

  const [copied, setCopied] = useState(false);
  const [retryToast, setRetryToast] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Synchronizacja zapisu do localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          time: attemptTime,
          progressPercent: progress,
          hasErrors,
          errorsFixed,
          lastUpdated: Date.now(),
        })
      );
    } catch {}
  }, [attemptTime, progress, hasErrors, errorsFixed]);

  // Obsługa kopiowania próby
  const handleCopy = async () => {
    try {
      const text = `Ostatnia próba obliczenia kalkulatora: ${attemptTime} • Postęp: ${progress}% • Status: ${
        errorsFixed ? 'Poprawione' : hasErrors ? 'Wymaga poprawy' : 'Zakończona'
      }`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onCopyAttempt) onCopyAttempt();
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Obsługa czyszczenia / usunięcia próby
  const handleTrash = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setAttemptTime(new Date().toLocaleTimeString('pl-PL'));
      setProgress(0);
      setRetryToast('Wyczyszczono ostatnią próbę.');
      setTimeout(() => setRetryToast(null), 3000);
      if (onClearAttempt) onClearAttempt();
    } catch {}
  };

  // Obsługa ponowienia próby (dostępna WYŁĄCZNIE gdy błędy zostały poprawione)
  const handleRetry = () => {
    if (!errorsFixed || isRetrying) return;

    setIsRetrying(true);
    const newTime = new Date().toLocaleTimeString('pl-PL');
    setAttemptTime(newTime);
    setProgress(100);

    setRetryToast('✓ Pomyślnie ponowiono próbę! Błędy zostały poprawione.');
    setTimeout(() => {
      setRetryToast(null);
      setIsRetrying(false);
    }, 4000);

    if (onRetryAttempt) {
      onRetryAttempt();
    }
  };

  // Czy przycisk ponawiania próby jest aktywny
  const canRetry = errorsFixed && !isRetrying;

  return (
    <div className={`flex flex-col items-end select-none ${className}`}>
      {/* Top Action Row: Icons from screenshot + Retry Button */}
      <div className="flex items-center gap-3 text-zinc-400 text-xs sm:text-sm">
        {/* 1. Copy Button */}
        <button
          onClick={handleCopy}
          className="hover:text-white transition-colors p-1 cursor-pointer rounded hover:bg-white/5 active:scale-90"
          title="Kopiuj dane ostatniej próby"
          aria-label="Kopiuj"
        >
          {copied ? (
            <Check size={16} className="text-emerald-400 stroke-[2.5]" />
          ) : (
            <Copy size={16} className="stroke-[1.8]" />
          )}
        </button>

        {/* 2. Trash Button */}
        <button
          onClick={handleTrash}
          className="hover:text-rose-400 transition-colors p-1 cursor-pointer rounded hover:bg-white/5 active:scale-90"
          title="Wyczyść ostatnią próbę"
          aria-label="Usuń"
        >
          <Trash2 size={16} className="stroke-[1.8]" />
        </button>

        {/* 3. NEW REQUESTED BUTTON: Przycisk ponawiania ostatniej próby */}
        <div className="relative">
          <button
            onClick={handleRetry}
            disabled={!canRetry}
            className={`p-1 rounded-lg transition-all flex items-center gap-1.5 ${
              canRetry
                ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer active:scale-95 animate-pulse'
                : 'text-zinc-600 bg-white/[0.02] border border-white/5 cursor-not-allowed opacity-40'
            }`}
            title={
              canRetry
                ? 'Błędy zostały poprawione! Kliknij, aby ponowić próbę'
                : hasErrors
                ? 'Popraw błędy w kalkulacji, aby odblokować ponowienie próby'
                : 'Brak błędów do poprawy lub brak poprzedniej nieudanej próby'
            }
            aria-label="Ponów ostatnią próbę"
          >
            <RotateCcw
              size={16}
              className={`stroke-[2] ${isRetrying ? 'animate-spin text-emerald-300' : ''}`}
            />
            {canRetry && (
              <span className="text-[10px] font-black uppercase tracking-wider pr-1 hidden sm:inline text-emerald-400">
                Ponów
              </span>
            )}
          </button>
        </div>

        {/* 4. Clock Icon + Timestamp (np. 12:03:36) */}
        <div className="flex items-center gap-1.5 font-mono text-zinc-400 text-xs sm:text-sm pl-0.5">
          <Clock size={16} className="stroke-[1.8] text-zinc-400" />
          <span className="tracking-wider">{attemptTime}</span>
        </div>
      </div>

      {/* Percentage Row: e.g. 12% in neon green */}
      <div className="mt-1.5 text-right w-full">
        <span className="text-emerald-400 font-bold text-sm sm:text-base tracking-tight font-sans">
          {progress}%
        </span>
      </div>

      {/* Progress Bar: matching screenshot */}
      <div className="w-full mt-1 h-2 sm:h-2.5 bg-[#0a0d18] border border-white/10 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Toast and Status Indicator */}
      {showErrorDetails && (
        <div className="w-full mt-1.5 text-[11px]">
          <AnimatePresence>
            {retryToast && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-emerald-300 flex items-center justify-end gap-1 font-semibold text-right"
              >
                <Sparkles size={12} className="text-emerald-400" />
                <span>{retryToast}</span>
              </motion.div>
            )}

            {!retryToast && canRetry && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-emerald-400 flex items-center justify-end gap-1 font-semibold text-right"
              >
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>Błędy poprawione — możesz ponowić próbę</span>
              </motion.div>
            )}

            {!retryToast && hasErrors && !errorsFixed && (
              <div className="text-amber-400/90 flex items-center justify-end gap-1 font-medium text-right text-[10px] sm:text-[11px]">
                <AlertCircle size={12} className="text-amber-400 shrink-0" />
                <span>
                  {errorMessages.length > 0
                    ? errorMessages[0]
                    : 'Wykryto błędy w danych — popraw je, aby odblokować ponowienie'}
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
