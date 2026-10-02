import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, UserCheck, Mail, Phone, Globe, Target, 
  Sparkles, CheckCircle2, ArrowLeft, Building2, Lock, FileText 
} from 'lucide-react';

export const AboutUs: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        <span>Wróć do strony głównej</span>
      </button>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#18181b] to-[#0e0e12] border border-white/[0.08] p-6 sm:p-10 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#DC143C]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DC143C]/10 border border-[#DC143C]/30 text-[#DC143C] text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles size={12} />
            <span>O Portalu & Weryfikacja Własności</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3 font-montserrat">
            O nas – <span className="text-[#DC143C]">RaportFinansowy24</span>
          </h1>
          <p className="text-zinc-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Niezależny portal analityki finansowej, porównywarka produktów bankowych i algorytmów scoringowych. 
            Strona prowadzona z naciskiem na przejrzystość, bezpieczeństwo danych i rzetelność obliczeń.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Ownership Card - Verification for Revolut / Compliance */}
        <div className="md:col-span-3 rounded-2xl bg-[#141418] border border-[#DC143C]/30 p-6 sm:p-8 relative overflow-hidden shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#DC143C]/15 border border-[#DC143C]/40 flex items-center justify-center text-[#DC143C] shrink-0">
                <UserCheck size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#DC143C]">
                  Deklaracja Własności i Zarządzania
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">Tomasz Siwiaszczyk</h2>
                <p className="text-xs text-zinc-400">Właściciel, Wydawca i Operator serwisu RaportFinansowy24.pl</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shrink-0">
              <ShieldCheck size={14} />
              <span>Zweryfikowany Właściciel</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="text-[11px] text-zinc-500 font-medium mb-1 flex items-center gap-1.5">
                <Globe size={13} className="text-[#DC143C]" />
                <span>Domena i Serwis</span>
              </div>
              <p className="text-sm font-bold text-white font-mono">raportfinansowy24.pl</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Własność prywatna / serwis fintech</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="text-[11px] text-zinc-500 font-medium mb-1 flex items-center gap-1.5">
                <Mail size={13} className="text-[#DC143C]" />
                <span>Oficjalny E-mail</span>
              </div>
              <a 
                href="mailto:raportfinansowy24@gmail.com" 
                className="text-sm font-bold text-zinc-200 hover:text-white transition-colors break-all"
              >
                raportfinansowy24@gmail.com
              </a>
              <p className="text-[10px] text-zinc-400 mt-0.5">Bezpośredni kontakt do właściciela</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="text-[11px] text-zinc-500 font-medium mb-1 flex items-center gap-1.5">
                <Phone size={13} className="text-[#DC143C]" />
                <span>Telefon Kontaktowy</span>
              </div>
              <a 
                href="tel:+491778466985" 
                className="text-sm font-bold text-zinc-200 hover:text-white transition-colors font-mono"
              >
                +49 177 8466985
              </a>
              <p className="text-[10px] text-zinc-400 mt-0.5">Infolinia operacyjna serwisu</p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-zinc-300 leading-relaxed">
            <span className="font-semibold text-white">Klauzula weryfikacyjna dla instytucji finansowych i partnerów (Revolut, Banki, Sieci Afiliacyjne):</span>
            <p className="mt-1 text-zinc-400">
              Niniejsza podstrona stanowi oficjalne oświadczenie tożsamości właścicielskiej. 
              Pan <strong className="text-zinc-200">Tomasz Siwiaszczyk</strong> sprawuje pełną kontrolę prawną, merytoryczną i techniczną nad domeną 
              oraz aplikacją internetową <em>RaportFinansowy24</em>, odpowiadając za jej integracje partnerskie, konta rozliczeniowe oraz przestrzeganie standardów prawnych.
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Key Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl bg-[#141418] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#DC143C]/10 border border-[#DC143C]/20 flex items-center justify-center text-[#DC143C] mb-4">
              <Target size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Nasza Misja</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4">
              Misją RaportFinansowy24 jest odczarowanie skomplikowanego języka umów finansowych i dostarczenie użytkownikom
              rzetelnych, obiektywnych narzędzi symulacji kosztów kredytów, kont bankowych oraz produktów oszczędnościowych.
            </p>
            <ul className="space-y-2.5 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Precyzyjne wyliczenia RRSO, prowizji i całkowitego kosztu zadłużenia.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Przejrzysty ranking promocji bankowych i premii gotówkowych.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Algorytmiczne dopasowanie ofert do profilu finansowego klienta.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl bg-[#141418] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Building2 size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Moduł B2B i Bezpieczeństwo</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4">
              Poza narzędziami konsumenckimi (B2C), platforma udostępnia moduł analityki wiarygodności kontrahentów (B2B), 
              integrujący oficjalne rejestry publiczne (Biała Lista Podatników VAT Ministerstwa Finansów, KRS i REGON).
            </p>
            <ul className="space-y-2.5 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <span>Bezpieczne połączenia szyfrowane protokołem TLS 1.3 / HTTPS.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <span>Pełna zgodność przetwarzania danych z wymogami RODO / GDPR.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <span>Brak pobierania opłat od użytkowników za korzystanie z kalkulatorów.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Compliance & Standards Note */}
      <div className="rounded-2xl bg-[#101014] border border-white/[0.06] p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-zinc-400 text-xs mb-2">
          <Lock size={14} className="text-zinc-500" />
          <span className="font-semibold text-zinc-300">Transparentność i Etyka Działania</span>
        </div>
        <p className="text-[11px] text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          RaportFinansowy24 współpracuje z czołowymi instytucjami bankowymi i licencjonowanymi sieciami partnerskimi 
          (m.in. Money2Money, Revolut Referral Partner). Wszystkie prezentowane kalkulacje mają charakter poglądowy i ułatwiają 
          samodzielne podjęcie świadomej decyzji finansowej.
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <button 
            onClick={() => navigate('/loan')}
            className="px-4 py-2 rounded-xl bg-[#DC143C] hover:bg-[#b01030] text-white font-bold transition-colors cursor-pointer"
          >
            Kalkulator Kredytowy
          </button>
          <button 
            onClick={() => navigate('/konta')}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 font-bold transition-colors cursor-pointer"
          >
            Ranking Kont Bankowych
          </button>
        </div>
      </div>
    </div>
  );
};
