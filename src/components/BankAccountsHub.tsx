import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Gift, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Percent, 
  Coins, 
  Clock, 
  Filter, 
  Star, 
  ExternalLink,
  Info,
  HelpCircle,
  PiggyBank
} from 'lucide-react';
import { fetchOffersFromApi } from '../services/apiClient';
import { useViewMode } from '../context/ViewModeContext';

interface BankAccountOffer {
  id: string;
  name: string;
  bankName: string;
  category: 'personal' | 'savings' | 'bonus' | 'student';
  monthlyFee: string;
  cardFee: string;
  cashBonus?: string;
  interestRate?: string;
  highlights: string[];
  requirements: string;
  url: string;
  isPopular?: boolean;
  isBestBonus?: boolean;
}

const CURATED_BANK_OFFERS: BankAccountOffer[] = [
  {
    id: 'revolut-standard',
    name: 'Revolut – Nowoczesne Konto Wielowalutowe',
    bankName: 'Revolut',
    category: 'bonus',
    monthlyFee: '0 zł',
    cardFee: '0 zł',
    cashBonus: 'Do 150 zł premii polecającej',
    interestRate: 'do 5.2% na koncie oszczędnościowym',
    highlights: [
      'Wymiana ponad 30 walut bez spreadu w dni robocze',
      'Darmowe wypłaty z bankomatów na całym świecie',
      'Błyskawiczne przelewy na numer telefonu i split rachunków',
      'Ponad 70 milionów użytkowników'
    ],
    requirements: 'Weryfikacja tożsamości online w 5 minut',
    url: 'https://revolut.com/referral/?referral-code=tomasz52u!APR1-26-AR&geo-redirect',
    isPopular: true,
    isBestBonus: true
  },
  {
    id: 'mbank-ekonto',
    name: 'eKonto do usług – mBank',
    bankName: 'mBank',
    category: 'bonus',
    monthlyFee: '0 zł',
    cardFee: '0 zł (przy min. 350 zł płatności)',
    cashBonus: 'Nawet 550 zł premii gotówkowej',
    interestRate: 'do 7.0% na cele oszczędnościowe',
    highlights: [
      '0 zł za prowadzenie rachunku',
      '0 zł za wypłaty BLIK ze wszystkich bankomatów w Polsce',
      'Jedna z najwyżej ocenianych aplikacji bankowych w PL',
      'Szybkie płatności Apple Pay, Google Pay, Garmin Pay'
    ],
    requirements: 'Otwarcie konta przez selfie lub e-Dowód + min. 5 płatności kartą',
    url: 'https://toomasz-money.oferty-kredytowe.pl/konta-osobiste',
    isPopular: true
  },
  {
    id: 'santander-konto-jakie-chce',
    name: 'Konto Santander z nagrodami',
    bankName: 'Santander Bank Polska',
    category: 'bonus',
    monthlyFee: '0 zł (przy wpływie min. 300 zł)',
    cardFee: '0 zł (przy 1 transakcji)',
    cashBonus: 'Do 600 zł w bonusach i voucherach',
    interestRate: '6.5% na lokacie mobilnej',
    highlights: [
      'Wysoka premia gotówkowa podzielona na proste etapy',
      'Zwrot do 300 zł rocznie za rachunki domowe (prąd, gaz, internet)',
      'Darmowe przelewy natychmiastowe Express Elixir',
      'Korzystne pakiety wielowalutowe'
    ],
    requirements: 'Wpływ min. 1000 zł i min. 3 płatności kartą/BLIK w miesiącu',
    url: 'https://toomasz-money.oferty-kredytowe.pl/konta-osobiste'
  },
  {
    id: 'velobank-konto',
    name: 'VeloKonto – Bankowość z Cashbackiem',
    bankName: 'VeloBank',
    category: 'savings',
    monthlyFee: '0 zł bezwarunkowo',
    cardFee: '0 zł (przy 5 płatnościach)',
    cashBonus: 'Do 650 zł zwrotu (cashback 5%)',
    interestRate: '7.5% na Elastycznym Koncie Oszczędnościowym',
    highlights: [
      'Zdecydowanie najwyższe oprocentowanie oszczędności na rynku',
      'Aż 5% zwrotu za codzienne zakupy kartą lub telefonem',
      'Brak ukrytych opłat za podstawowe operacje',
      'Wypłata odsetek co miesiąc na Twoje konto'
    ],
    requirements: 'Wyrażenie zgód marketingowych i comiesięczne zakupy kartą',
    url: 'https://toomasz-money.oferty-kredytowe.pl/konta-oszczednosciowe',
    isBestBonus: true
  },
  {
    id: 'millennium-360',
    name: 'Millennium 360° – Uniwersalne Konto',
    bankName: 'Bank Millennium',
    category: 'personal',
    monthlyFee: '0 zł bezwarunkowo',
    cardFee: '0 zł (przy min. 5 płatnościach)',
    cashBonus: 'Do 500 zł premii na start',
    interestRate: '6.0% do 100 000 zł',
    highlights: [
      '0 zł za wszystkie bankomaty w Polsce i na świecie (po 5 płatnościach)',
      'Pakiet walutowy bez prowizji za przewalutowanie do 1000 zł/mc',
      'Program zwrotów za zakupy w sklepach partnerskich Goodie',
      'Wygodne zarządzanie subskrypcjami w aplikacji'
    ],
    requirements: 'Aktywacja aplikacji mobilnej i zasilenie konta',
    url: 'https://toomasz-money.oferty-kredytowe.pl/konta-osobiste'
  },
  {
    id: 'ing-direct',
    name: 'Konto z Lwem Direct – ING Bank Śląski',
    bankName: 'ING',
    category: 'personal',
    monthlyFee: '0 zł bezwarunkowo',
    cardFee: '0 zł (przy płatnościach min. 300 zł)',
    cashBonus: 'Do 500 zł premii gotówkowej',
    interestRate: '6.0% na Otwartym Koncie Oszczędnościowym',
    highlights: [
      'Wyjątkowo przejrzysta aplikacja Moje ING z analizatorem wydatków',
      'Autorskie moduły celów oszczędnościowych Smart Saver',
      'Darmowe wpłaty i wypłaty we wpłatomatach ING i Planet Cash',
      'Programy rabatowe i zniżki na zakupy'
    ],
    requirements: 'Zalogowanie do aplikacji i wykonanie transakcji bezgotówkowych',
    url: 'https://toomasz-money.oferty-kredytowe.pl/konta-osobiste'
  }
];

export const BankAccountsHub: React.FC = () => {
  const navigate = useNavigate();
  const { isBrowserMode } = useViewMode();
  const [filter, setFilter] = useState<'all' | 'bonus' | 'savings' | 'personal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [estimatedMonthlySpend, setEstimatedMonthlySpend] = useState<number>(1500);

  // Obliczenie szacowanego rocznego zysku na premiach i cashbacku
  const calculateYearlyBenefit = (monthlySpend: number) => {
    // Średnia premia startowa + 2% cashbacku z zakupów
    const welcomeBonus = 500;
    const cashback = Math.min(600, Math.round(monthlySpend * 0.02 * 12));
    const savedFees = 120; // brak opłat za konto i kartę
    return welcomeBonus + cashback + savedFees;
  };

  const handleShowBonusAccounts = () => {
    setFilter('bonus');
    const el = document.getElementById('bank-offers-list');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredOffers = CURATED_BANK_OFFERS.filter(offer => {
    if (filter !== 'all' && offer.category !== filter && !(filter === 'bonus' && offer.cashBonus)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = offer.name.toLowerCase().includes(q) || 
                    offer.bankName.toLowerCase().includes(q) ||
                    offer.highlights.some(h => h.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-2 sm:py-4 px-2 sm:px-4 text-white">
      
      {/* ========================================================
          HERO BANNER — KONTA BANKOWE DLA OSÓB PRYWATNYCH
          ======================================================== */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-[#121217] border border-white/10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Gift size={14} className="animate-bounce" />
            <span>Aktualne promocje bankowe i premie powitalne</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Konta Bankowe i Oszczędności
          </h1>
          <p className="text-base sm:text-xl font-bold text-zinc-300">
            Wybierz bezpłatne konto osobiste i odbierz premie na start.
          </p>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Porównaj aktualne promocje bankowe w Polsce. Wybierz rachunek z darmowym prowadzeniem, kartą 0 zł i sprawdź warunki premii powitalnych.
          </p>

          {/* Szybki kalkulator korzyści dla użytkownika */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-black/50 border border-white/10 p-4 rounded-2xl">
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase text-zinc-400 block mb-1">
                Ile miesięcznie wydajesz kartą lub telefonem?
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="500" 
                  max="5000" 
                  step="250"
                  value={estimatedMonthlySpend}
                  onChange={(e) => setEstimatedMonthlySpend(Number(e.target.value))}
                  className="w-full accent-[#DC143C] cursor-pointer"
                />
                <span className="text-sm font-black text-white shrink-0 min-w-[85px] text-right">
                  {estimatedMonthlySpend.toLocaleString('pl-PL')} zł
                </span>
              </div>
            </div>

            <div className="sm:border-l border-white/10 sm:pl-4 flex flex-col justify-center gap-1.5 min-w-[200px]">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Twój szacowany zysk rocznie:</span>
                <span className="text-lg sm:text-xl font-black text-emerald-400">
                  +{calculateYearlyBenefit(estimatedMonthlySpend).toLocaleString('pl-PL')} zł
                </span>
                <span className="text-[10px] text-zinc-400 block leading-tight">
                  (premia startowa + cashback + 0 zł opłat)
                </span>
              </div>
              <button
                onClick={handleShowBonusAccounts}
                className="mt-1 px-3.5 py-2 rounded-xl bg-[#DC143C] hover:bg-[#b01030] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#DC143C]/30 transition-all cursor-pointer active:scale-95"
              >
                <span>Wybierz konto z premią</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          FILTRY I WYSZUKIWARKA
          ======================================================== */}
      <section id="bank-offers-list" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 scroll-mt-20">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filter === 'all' 
                ? 'bg-[#DC143C] text-white shadow-md shadow-[#DC143C]/20' 
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
            }`}
          >
            Wszystkie oferty ({CURATED_BANK_OFFERS.length})
          </button>

          <button
            onClick={() => setFilter('bonus')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              filter === 'bonus' 
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' 
                : 'bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/20'
            }`}
          >
            <Gift size={13} />
            <span>Z premią gotówkową</span>
          </button>

          <button
            onClick={() => setFilter('savings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              filter === 'savings' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                : 'bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/20'
            }`}
          >
            <Coins size={13} />
            <span>Wysoki procent (Oszczędności)</span>
          </button>

          <button
            onClick={() => setFilter('personal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              filter === 'personal' 
                ? 'bg-white text-black shadow-md' 
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
            }`}
          >
            <CreditCard size={13} />
            <span>Konta 0 zł bez warunków</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative sm:w-64">
          <input
            type="text"
            placeholder="Szukaj banku lub konta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#DC143C]"
          />
        </div>
      </section>

      {/* ========================================================
          LISTA OFERT KONT BANKOWYCH (PROMO CARDS)
          ======================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {filteredOffers.map((offer) => (
          <div 
            key={offer.id}
            className={`relative rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-[#18181d] to-[#111116] border transition-all duration-300 flex flex-col justify-between hover:border-white/20 hover:shadow-xl ${
              offer.isBestBonus ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-white/10'
            }`}
          >
            {/* Top Badges */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
                  {offer.bankName}
                </span>

                {offer.isBestBonus && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-black flex items-center gap-1 shadow-sm">
                    <Sparkles size={11} /> Top Premia
                  </span>
                )}

                {offer.isPopular && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Bestseller
                  </span>
                )}
              </div>

              {offer.cashBonus && (
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Bonus gotówkowy</span>
                  <span className="text-xs sm:text-sm font-black text-amber-400">{offer.cashBonus}</span>
                </div>
              )}
            </div>

            {/* Title & Core Pricing */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                {offer.name}
              </h3>

              {/* Price Metric Grid */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block">Prowadzenie</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-400">{offer.monthlyFee}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block">Karta</span>
                  <span className="text-xs sm:text-sm font-black text-zinc-200">{offer.cardFee}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block">Oszczędności</span>
                  <span className="text-xs sm:text-sm font-black text-amber-300">{offer.interestRate || 'Standard'}</span>
                </div>
              </div>

              {/* Bullet Features */}
              <ul className="space-y-1.5 pt-1">
                {offer.highlights.map((feat, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Requirements Note */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2 text-[11px] text-zinc-400">
                <Info size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                <span><strong>Warunek premii:</strong> {offer.requirements}</span>
              </div>
            </div>

            {/* Bottom CTA Action */}
            <div className="pt-5 mt-4 border-t border-white/5 flex items-center justify-between gap-3">
              <span className="text-[10px] text-zinc-500 font-medium">
                Bezpieczny wniosek online (szyfrowanie SSL)
              </span>

              <a
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#DC143C] hover:bg-[#b01030] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#DC143C]/20 shrink-0 active:scale-95"
              >
                <span>Otwórz z premią</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        ))}
      </section>

      {/* ========================================================
          DORADCA OSOBISTY AI DLA KONT BANKOWYCH
          ======================================================== */}
      <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#1a1215] to-[#121217] border border-[#DC143C]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-amber-300">
            <Sparkles size={14} />
            <span>Nie wiesz, które konto wybrać?</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Automatyczny dobór konta z najwyższą premią
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Zestawiliśmy banki o najwyższej premii gotówkowej na start (do 650 zł), bezpłatnym prowadzeniu rachunku i 0 zł za wypłaty z bankomatów.
          </p>
        </div>

        <button
          onClick={handleShowBonusAccounts}
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:opacity-95 text-white font-black text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#DC143C]/30 active:scale-95 shrink-0 w-full md:w-auto justify-center"
        >
          <Zap size={16} />
          <span>Pokaż najlepsze konta z bonusem</span>
          <ArrowRight size={16} />
        </button>
      </section>

      {/* ========================================================
          SEKCJA EDUKACYJNA (FAQ DLA OSÓB PRYWATNYCH)
          ======================================================== */}
      <section className="space-y-4 pt-4">
        <h2 className="text-lg font-black text-white tracking-tight text-center sm:text-left">
          Najczęściej zadawane pytania o promocje bankowe
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle size={14} className="text-[#DC143C]" />
              <span>Czy premia gotówkowa od banku jest opodatkowana?</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Nie. Zgodnie z polskim prawem premie z promocji bankowych dla osób fizycznych (sprzedaż premiowa) są zwolnione z podatku dochodowego PIT do kwoty 2000 zł. Otrzymujesz 100% gotówki na swoje konto.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle size={14} className="text-[#DC143C]" />
              <span>Kiedy mogę zamknąć konto bez utraty premii?</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Po wypłacie nagrody możesz bez żadnych konsekwencji zachować konto lub je zamknąć. Polskie banki nie nakładają kar za rezygnację z umowy o prowadzenie rachunku.
            </p>
          </div>
        </div>
      </section>

      {/* Informacja prawna / Nota o charakterze informacyjnym */}
      <section className="pt-4 pb-2 border-t border-white/5">
        <p className="text-[11px] text-zinc-500 leading-relaxed text-center sm:text-left">
          * Prezentowane warunki ofert, kwoty premii i oprocentowania mają charakter informacyjny i orientacyjny. Rzeczywiste warunki promocji regulują regulaminy poszczególnych banków i instytucji finansowych. Wszelkie zestawienia nie stanowią oferty w rozumieniu art. 66 Kodeksu Cywilnego.
        </p>
      </section>

    </div>
  );
};
