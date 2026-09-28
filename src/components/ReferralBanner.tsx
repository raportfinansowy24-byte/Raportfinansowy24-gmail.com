import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Crown, ArrowRight, X } from 'lucide-react';
import { referralService, ReferralState } from '../services/referral.service';

interface ReferralBannerProps {
  onOpenModal: () => void;
}

export const ReferralBanner: React.FC<ReferralBannerProps> = ({ onOpenModal }) => {
  const [state, setState] = useState<ReferralState>(referralService.getState());
  const [dismissed, setDismissed] = useState(false);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);

  useEffect(() => {
    const unsubscribe = referralService.subscribe((newState) => {
      setState(newState);
    });

    // Sprawdź czy użytkownik wszedł z linku polecającego
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('ref') || params.get('polecenie')) {
        setShowWelcomeBonus(true);
      }
    }

    return () => unsubscribe();
  }, []);

  if (dismissed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-[#DC143C]/20 via-[#16161c] to-[#DC143C]/20 border-b border-[#DC143C]/30 text-white px-3 sm:px-6 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-6 h-6 rounded-lg bg-[#DC143C] flex items-center justify-center text-white shrink-0 shadow-sm shadow-[#DC143C]/40">
            <Gift size={13} />
          </div>

          {showWelcomeBonus ? (
            <p className="truncate text-zinc-200">
              <strong className="text-white font-bold">Bonus z polecenia!</strong> Otrzymujesz bezpłatny Raport Finansowy Premium.
            </p>
          ) : state.isVipUnlimited ? (
            <p className="truncate text-zinc-200">
              <strong className="text-amber-400 font-bold flex-inline items-center gap-1">
                <Crown size={12} className="inline mr-1" />
                Status VIP Nielimitowany aktywny
              </strong> – Ciesz się pełnym audytem każdej spółki bez ograniczeń!
            </p>
          ) : (
            <p className="truncate text-zinc-200">
              <strong className="text-white font-bold">Program Poleceń:</strong> Zaproś znajomego i odbierz{' '}
              <span className="text-emerald-400 font-bold">+2 Raporty Premium gratis</span>!
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenModal}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#DC143C] hover:bg-[#b01030] text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <span>{state.isVipUnlimited ? 'Mój profil VIP' : 'Odbierz bonus'}</span>
            <ArrowRight size={12} />
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Zamknij powiadomienie"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
