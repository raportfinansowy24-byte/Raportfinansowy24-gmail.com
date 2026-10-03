import React, { useState } from 'react';
import { 
  Star, Share2, CheckCircle2, Sparkles, MessageSquare, 
  Send, ThumbsUp, Copy, Check, Gift, Heart, ArrowRight, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { referralService } from '../services/referral.service';

interface ReportFeedbackSurveyProps {
  reportType?: 'company_audit' | 'financial_plan' | 'loan_calc';
  targetName?: string; // np. Nazwa spółki lub "Raport Finansowy"
  targetNip?: string;
  className?: string;
}

export const ReportFeedbackSurvey: React.FC<ReportFeedbackSurveyProps> = ({
  reportType = 'company_audit',
  targetName = 'raport finansowy',
  targetNip,
  className = '',
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);

  const referralLink = referralService.getReferralLink();

  const tags = [
    'Błyskawiczny audyt NIP',
    'Precyzyjny scoring ryzyka',
    'Czytelne sprawozdanie finansowe',
    'Profesjonalny PDF do zarządu',
    'Oszczędność czasu i pieniędzy',
    'Wykryto ukryte zadłużenie'
  ];

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (rating === 0) return;

    try {
      // Zapis lokalny opinii (oraz opcjonalnie telemetryczny / custom event)
      const feedbackPayload = {
        rating,
        selectedTags,
        comment,
        reportType,
        targetName,
        targetNip,
        submittedAt: new Date().toISOString(),
      };
      
      const existing = JSON.parse(localStorage.getItem('rf24_report_feedbacks') || '[]');
      existing.push(feedbackPayload);
      localStorage.setItem('rf24_report_feedbacks', JSON.stringify(existing));
    } catch {
      // ignore
    }

    setSubmitted(true);
  };

  // Przygotowanie viralowego wpisu do social media
  const cleanTarget = targetName && targetName.length > 2 ? targetName : 'firmy';
  const postText = `Właśnie przeanalizowałem kondycję finansową (${cleanTarget}) za pomocą @RaportFinansowy24! 📊\n\nBłyskawiczny audyt bilansu, wskaźnik zagrożenia upadłością Altman Z-Score i scoring wiarygodności w 3 sekundy. Moja ocena przydatności: ${rating || 5}/5 ⭐.\n\nSprawdź bezpłatnie kontrahenta lub odbierz certyfikowany raport: ${referralLink}`;

  const handleShareSuccess = async () => {
    // 1. Sprawdź Web Share API (smartfony / laptopy z obsługą)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RaportFinansowy24 – Sukces audytu finansowego',
          text: postText,
          url: referralLink,
        });
        await referralService.addSuccessfulReferral('social_share');
        return;
      } catch (err) {
        // Użytkownik zamknął natywny share lub brak obsługi -> otwórz modal
      }
    }

    setShowShareModal(true);
  };

  const handleCopyPost = async () => {
    try {
      await navigator.clipboard.writeText(postText);
      setCopiedPost(true);
      setTimeout(() => setCopiedPost(false), 2500);
      await referralService.addSuccessfulReferral('copied_post');
    } catch {
      // ignore
    }
  };

  const shareToLinkedIn = async () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, '_blank');
    await referralService.addSuccessfulReferral('linkedin');
  };

  const shareToTwitter = async () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`, '_blank');
    await referralService.addSuccessfulReferral('twitter');
  };

  const shareToWhatsApp = async () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(postText)}`, '_blank');
    await referralService.addSuccessfulReferral('whatsapp');
  };

  const shareToFacebook = async () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
    await referralService.addSuccessfulReferral('facebook');
  };

  return (
    <div className={`w-full rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#181316] via-[#141419] to-[#0f0f13] border border-white/10 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-[#DC143C]/10 rounded-full blur-3xl pointer-events-none" />

      {!submitted ? (
        <div className="space-y-4 relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                  <Sparkles size={11} /> Krótka ankieta
                </span>
                <span className="text-xs text-zinc-400 font-medium">1 kliknięcie</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-1">
                Jak oceniasz przydatność wygenerowanego raportu?
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Twoja ocena pozwala nam udoskonalać algorytmy weryfikacji i modele analityczne AI.
              </p>
            </div>

            {/* Star Rating Selector */}
            <div className="flex items-center gap-1 bg-black/40 p-2 rounded-2xl border border-white/10 shrink-0 self-start sm:self-center">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      if (!submitted && star >= 4) {
                        // Jeśli od razu wysoka ocena, możemy ułatwić
                      }
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    title={`Ocena: ${star} / 5`}
                  >
                    <Star
                      size={22}
                      className={`transition-colors ${
                        isActive 
                          ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-bold text-white px-2 min-w-[28px] text-center">
                {rating > 0 ? `${rating}/5` : '—'}
              </span>
            </div>
          </div>

          {/* Quick Tag Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Co okazało się najbardziej przydatne? (opcjonalnie)
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#DC143C] text-white border border-[#DC143C] shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment & Submit Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Dodatkowa uwaga lub sugestia nowej funkcji (opcjonalnie)..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#DC143C]"
            />

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={rating === 0}
              className="px-5 py-2.5 rounded-xl bg-[#DC143C] hover:bg-[#b01030] disabled:opacity-40 disabled:hover:bg-[#DC143C] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              <Send size={13} />
              <span>Zapisz ocenę</span>
            </button>
          </div>
        </div>
      ) : (
        /* STAN PO ODDANIU OCENY: SUKCES + PRZYCISK "PODZIEL SIĘ SUKCESEM" */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 relative z-10"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Dziękujemy za ocenę {rating}/5!
                  </span>
                  <span className="text-[11px] text-zinc-400">Twoja opinia ma znaczenie</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                  Raport wygenerowany pomyślnie. Chcesz polecić to narzędzie innym?
                </h4>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Udostępnij wynik znajomym przedsiębiorcom lub na LinkedIn – za każde polecenie otrzymasz kolejne <strong className="text-amber-300">+2 Raporty Premium</strong> gratis!
                </p>
              </div>
            </div>

            {/* Główny przycisk: 'Podziel się sukcesem' */}
            <button
              type="button"
              onClick={handleShareSuccess}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:opacity-95 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 shrink-0"
              title="Udostępnij raport w social mediach i zyskaj darmowe raporty premium"
            >
              <Share2 size={16} />
              <span>Podziel się sukcesem</span>
              <Sparkles size={14} className="text-black" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
            <span className="flex items-center gap-1.5">
              <Gift size={13} className="text-amber-400" />
              <span>Twój unikalny link z bonusem zostanie automatycznie dołączony do posta</span>
            </span>
            <button
              onClick={() => setSubmitted(false)}
              className="text-zinc-500 hover:text-zinc-300 underline cursor-pointer text-[10px]"
            >
              Zmień ocenę
            </button>
          </div>
        </motion.div>
      )}

      {/* MODAL / POPUP UDOSTĘPNIANIA W SOCIAL MEDIACH */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121217] border border-white/15 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Podziel się sukcesem w Social Mediach</h3>
                  <p className="text-xs text-zinc-400">Wybierz platformę lub skopiuj gotowy tekst do publikacji</p>
                </div>
              </div>

              {/* Ready Post Preview */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Treść przygotowanego posta:
                </label>
                <div className="bg-black/60 border border-white/10 rounded-2xl p-3.5 text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap select-all">
                  {postText}
                </div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  onClick={shareToLinkedIn}
                  className="py-3 px-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Share2 size={16} />
                  <span>LinkedIn</span>
                </button>

                <button
                  onClick={shareToWhatsApp}
                  className="py-3 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <MessageSquare size={16} />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={shareToTwitter}
                  className="py-3 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Sparkles size={16} className="text-amber-400" />
                  <span>X (Twitter)</span>
                </button>

                <button
                  onClick={shareToFacebook}
                  className="py-3 px-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Heart size={16} />
                  <span>Facebook</span>
                </button>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopyPost}
                className="w-full py-3 rounded-xl bg-[#DC143C] hover:bg-[#b01030] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
              >
                {copiedPost ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                <span>{copiedPost ? 'Skopiowano treść do schowka!' : 'Skopiuj treść posta i link'}</span>
              </button>

              <p className="text-[10px] text-center text-zinc-500">
                Każdy kto zarejestruje się z Twojego posta zapewni Ci darmowe kredyty na Raporty Premium!
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
