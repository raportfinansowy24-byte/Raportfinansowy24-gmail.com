import React, { useState, useEffect } from 'react';
import { 
  X, Copy, Check, Gift, Sparkles, Crown, Share2, Users, 
  ArrowRight, ShieldCheck, Flame, MessageSquare, Mail, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { referralService, ReferralState } from '../services/referral.service';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'share' | 'redeem';
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'share',
}) => {
  const [state, setState] = useState<ReferralState>(referralService.getState());
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [redeemFeedback, setRedeemFeedback] = useState<{ success?: boolean; message?: string } | null>(null);
  const [tab, setTab] = useState<'share' | 'redeem'>(defaultTab);

  useEffect(() => {
    const unsubscribe = referralService.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setRedeemFeedback(null);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const referralLink = referralService.getReferralLink();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.myCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const shareText = `Sprawdź bezpłatnie kondycję finansową dowolnej polskiej spółki lub skalkuluj kredyt w RaportFinansowy24! Z moim linkiem zyskujesz bezpłatny Raport Premium z certyfikatem wiarygodności: ${referralLink}`;

  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleShareMail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent('Darmowy Raport Finansowy Premium w RaportFinansowy24')}&body=${encodeURIComponent(shareText)}`;
  };

  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) return;

    const result = referralService.redeemFriendCode(friendCodeInput);
    setRedeemFeedback(result);
    if (result.success) {
      setFriendCodeInput('');
    }
  };

  const handleSimulateReferral = () => {
    const res = referralService.addSuccessfulReferral();
    if (res.isVipNow) {
      setRedeemFeedback({
        success: true,
        message: '🎉 Niesamowite! Zdobyto 3 polecenia — Odblokowano dożywotni status VIP Unlimited!',
      });
    } else {
      setRedeemFeedback({
        success: true,
        message: '✅ Zarejestrowano nowe polecenie! Dodano +2 Kredyty Raportów Premium.',
      });
    }
  };

  const progressPercent = Math.min(100, Math.round((state.referralCount / 3) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#0e0e12] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Top Header Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-[#1a0f12] via-[#121217] to-[#0a0a0d] border-b border-white/10 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#DC143C]/10 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#DC143C] to-[#8B0000] flex items-center justify-center text-white shadow-lg shadow-[#DC143C]/30">
              <Gift size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4D6D] bg-[#DC143C]/20 px-2.5 py-0.5 rounded-full border border-[#DC143C]/30 flex items-center gap-1">
                  <Sparkles size={10} /> Program Poleceń & Viral VIP
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                Polecaj i Odbieraj Raporty Premium
              </h2>
            </div>
          </div>

          <p className="text-xs text-zinc-400 max-w-md mt-1">
            Zaproś znajomych przedsiębiorców lub inwestorów. Za każde polecenie otrzymujesz <strong className="text-white">+2 darmowe Raporty Premium</strong>, a po 3 poleceniach odblokowujesz <strong className="text-amber-400">status VIP bez limitu</strong>!
          </p>

          {/* Quick Counter Badges */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-black/40 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Twoje Raporty Premium</div>
                <div className="text-lg font-black text-white flex items-center gap-1.5">
                  {state.isVipUnlimited ? (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Crown size={18} /> Nielimitowane (VIP)
                    </span>
                  ) : (
                    <>
                      <span className="text-emerald-400">{state.premiumCredits}</span>
                      <span className="text-xs font-normal text-zinc-400">dostępnych</span>
                    </>
                  )}
                </div>
              </div>
              <Award className={state.isVipUnlimited ? 'text-amber-400' : 'text-zinc-600'} size={24} />
            </div>

            <div className="bg-black/40 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Poleceni znajomi</div>
                <div className="text-lg font-black text-white flex items-center gap-1.5">
                  <span className="text-[#DC143C]">{state.referralCount}</span>
                  <span className="text-xs font-normal text-zinc-400">/ 3 do VIP</span>
                </div>
              </div>
              <Users className="text-zinc-500" size={24} />
            </div>
          </div>

          {/* Progress bar towards VIP */}
          <div className="mt-3">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
              <span>Postęp do dożywotniego statusu VIP Unlimited</span>
              <span className="font-bold text-white">{state.referralCount} z 3 osób</span>
            </div>
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-[#DC143C] via-amber-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/20">
          <button
            onClick={() => setTab('share')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              tab === 'share'
                ? 'border-[#DC143C] text-white bg-white/[0.03]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Twój unikalny link i kod
          </button>
          <button
            onClick={() => setTab('redeem')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              tab === 'redeem'
                ? 'border-[#DC143C] text-white bg-white/[0.03]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Wpisz kod od znajomego
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar text-zinc-300 text-xs leading-relaxed">
          {redeemFeedback && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
                redeemFeedback.success
                  ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-950/30 text-rose-300 border-rose-500/30'
              }`}
            >
              <span>{redeemFeedback.message}</span>
              <button onClick={() => setRedeemFeedback(null)} className="text-zinc-400 hover:text-white ml-2">
                <X size={14} />
              </button>
            </div>
          )}

          {tab === 'share' ? (
            <div className="space-y-4">
              {/* Unique Code Box */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Twój unikalny kod polecający
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-3 font-mono font-black text-white text-base tracking-widest flex items-center justify-between">
                    <span>{state.myCode}</span>
                    <span className="text-[10px] text-emerald-400 font-sans font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                      Aktywny
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="px-4 py-3 bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
                    title="Skopiuj kod"
                  >
                    {copiedCode ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                    <span className="hidden sm:inline">{copiedCode ? 'Skopiowano!' : 'Kopiuj'}</span>
                  </button>
                </div>
              </div>

              {/* Referral Link Box */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Bezpośredni link z automatycznym bonusem
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-zinc-300 text-xs font-mono truncate select-all">
                    {referralLink}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                    title="Skopiuj link"
                  >
                    {copiedLink ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
                    <span className="hidden sm:inline">{copiedLink ? 'Skopiowano link!' : 'Kopiuj link'}</span>
                  </button>
                </div>
              </div>

              {/* Instant Social Share Buttons */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Udostępnij jednym kliknięciem
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="py-2.5 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={handleShareLinkedIn}
                    className="py-2.5 px-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span>LinkedIn</span>
                  </button>

                  <button
                    onClick={handleShareTwitter}
                    className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Flame size={14} className="text-amber-400" />
                    <span>X (Twitter)</span>
                  </button>

                  <button
                    onClick={handleShareMail}
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Mail size={14} className="text-[#DC143C]" />
                    <span>E-mail</span>
                  </button>
                </div>
              </div>

              {/* What is in a Premium Report */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-[#DC143C]" />
                  <span>Co zawiera Raport Premium (B2B & Finanse):</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-zinc-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span><strong>Pełny audyt predykcyjny AI Gemini 3.8:</strong> Scoring wiarygodności 0-100, ocena ryzyka upadłości.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span><strong>Rekomendacja limitu kredytu kupieckiego B2B:</strong> Bezpieczna kwota odroczenia płatności.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span><strong>Certyfikowany eksport PDF (A4):</strong> Gotowy dokument do zarządu lub banku.</span>
                  </li>
                </ul>
              </div>

              {/* Interactive Demo Test Button */}
              <div className="pt-1 flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-[11px] text-amber-200">
                  <span className="font-bold">Test programu:</span> Sprawdź działanie viralowego pętli poleceń
                </div>
                <button
                  onClick={handleSimulateReferral}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  + Symuluj polecenie
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Otrzymałeś kod polecający od wspólnika lub znajomego? Wpisz go poniżej, aby natychmiast otrzymać <strong>+1 darmowy kredyt na Raport Finansowy Premium</strong>.
              </p>

              <form onSubmit={handleRedeemCode} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Wprowadź kod polecający (np. RF24-ABC123)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={friendCodeInput}
                      onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
                      placeholder="RF24-XXXXXX"
                      maxLength={12}
                      className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-3 font-mono font-bold text-white text-sm focus:outline-none focus:border-[#DC143C]"
                    />
                    <button
                      type="submit"
                      disabled={!friendCodeInput.trim()}
                      className="px-5 py-3 bg-[#DC143C] hover:bg-[#b01030] disabled:opacity-40 text-white font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <span>Aktywuj</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </form>

              {state.referredByCode && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 text-zinc-300">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>
                    Twój profil został już połączony z kodem polecającym: <strong className="font-mono text-white">{state.referredByCode}</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Bezpieczny program rekomendacji RaportFinansowy24</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </motion.div>
    </div>
  );
};
