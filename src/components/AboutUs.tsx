import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, UserCheck, Mail, Phone, Globe, Target, 
  Sparkles, CheckCircle2, ArrowLeft, Building2, Lock, 
  Linkedin, ExternalLink, Briefcase, Award, BadgeCheck
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
            Niezależny portal analityki finansowej, symulator kosztów produktów bankowych oraz silnik dopasowania ofert. 
            Strona prowadzona z naciskiem na najwyższe standardy etyczne, transparentność algorytmów oraz bezpieczeństwo danych użytkowników.
          </p>
        </div>
      </div>

      {/* WŁAŚCICIEL STRONY - GŁÓWNA SEKCJA WERYFIKACYJNA DLA REVOLUT / KYC */}
      <div className="rounded-3xl bg-gradient-to-b from-[#16161c] to-[#101014] border-2 border-[#DC143C]/40 p-6 sm:p-9 mb-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#DC143C]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/[0.08]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DC143C]/15 border border-[#DC143C]/40 text-[#DC143C] text-xs font-black uppercase tracking-wider">
            <UserCheck size={14} />
            <span>Właściciel Strony & Założyciel</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300 text-xs font-medium">
            <ShieldCheck size={14} className="text-[#DC143C]" />
            <span>Deklaracja tożsamości właścicielskiej</span>
          </div>
        </div>

        {/* Identity & Bio Details */}
        <div className="mt-6 flex flex-col md:flex-row items-start gap-6">
          {/* Avatar / Monogram */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#DC143C] to-[#800020] border-2 border-white/20 flex flex-col items-center justify-center text-white shrink-0 shadow-xl shadow-[#DC143C]/20">
            <span className="text-2xl sm:text-3xl font-black font-montserrat tracking-wider">TS</span>
            <span className="text-[9px] uppercase tracking-widest font-semibold opacity-90 mt-0.5">Owner</span>
          </div>

          {/* Profile Name & Roles */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Tomasz Siwiaszczyk
                </h2>
                <p className="text-xs sm:text-sm text-[#DC143C] font-semibold flex items-center gap-1.5 mt-0.5">
                  <Briefcase size={14} />
                  <span>Właściciel, Wydawca i Operator serwisu RaportFinansowy24.pl</span>
                </p>
              </div>

              {/* LinkedIn Button */}
              <a
                href="https://www.linkedin.com/in/tomasz-siwiaszczyk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-bold transition-all shadow-md shadow-[#0A66C2]/20 hover:scale-[1.02] active:scale-[0.98] shrink-0"
                title="Zobacz oficjalny profil LinkedIn Tomasza Siwiaszczyka"
              >
                <Linkedin size={15} className="fill-white" />
                <span>Profil LinkedIn</span>
                <ExternalLink size={12} className="opacity-80" />
              </a>
            </div>

            {/* Professional Bio */}
            <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-2">
              <p>
                <strong className="text-white">Bio zawodowe:</strong> Przedsiębiorca internetowy, wydawca niezależnych serwisów finansowo-technologicznych oraz analityk produktów bankowych i konsumenckich w Polsce.
              </p>
              <p className="text-zinc-400 text-xs">
                Odpowiada za architekturę merytoryczną portalu <strong>RaportFinansowy24.pl</strong>, transparentność wyliczeń RRSO oraz bezpośrednie integracje partnerskie z instytucjami finansowymi i licencjonowanymi sieciami afiliacyjnymi (m.in. Totalmoney / Money2Money, programy partnerskie banków).
              </p>
            </div>
          </div>
        </div>

        {/* Verification Contact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
            <div className="text-[11px] text-zinc-500 font-medium mb-1 flex items-center gap-1.5">
              <Globe size={13} className="text-[#DC143C]" />
              <span>Adres domeny serwisu</span>
            </div>
            <p className="text-sm font-bold text-white font-mono truncate">raport-finansowy24.pl</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Wyłączna własność: Tomasz Siwiaszczyk</p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
            <div className="text-[11px] text-zinc-500 font-medium mb-1 flex items-center gap-1.5">
              <Building2 size={13} className="text-[#DC143C]" />
              <span>Adres korespondencyjny</span>
            </div>
            <p className="text-xs font-bold text-white">ul. Reymonta 88B/2</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">46-100 Namysłów, woj. opolskie</p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
            <div className="text-[11px] text-zinc-500 font-medium mb-1 flex items-center gap-1.5">
              <Phone size={13} className="text-[#DC143C]" />
              <span>Telefon kontaktowy</span>
            </div>
            <a 
              href="tel:+491778466985" 
              className="text-sm font-bold text-zinc-200 hover:text-white transition-colors font-mono"
            >
              +49 177 8466985
            </a>
            <p className="text-[10px] text-zinc-400 mt-0.5">Kontakt PL: +48 794 557 967</p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
            <div className="text-[11px] text-zinc-500 font-medium mb-1 flex items-center gap-1.5">
              <Mail size={13} className="text-[#DC143C]" />
              <span>E-mail kontaktowy</span>
            </div>
            <a 
              href="mailto:raportfinansowy24@gmail.com" 
              className="text-xs font-bold text-zinc-200 hover:text-white transition-colors break-all"
            >
              raportfinansowy24@gmail.com
            </a>
            <p className="text-[10px] text-zinc-400 mt-0.5">lipetomasz00@gmail.com</p>
          </div>
        </div>

        {/* Official Declaration of Website Ownership */}
        <div className="mt-6 p-4 rounded-2xl bg-black/60 border border-[#DC143C]/25 text-xs text-zinc-300 leading-relaxed">
          <div className="flex items-center gap-2 text-white font-bold mb-1.5">
            <ShieldCheck size={16} className="text-[#DC143C]" />
            <span>Oświadczenie o strukturze własnościowej (Website Ownership Declaration):</span>
          </div>
          <p className="text-zinc-400 text-[11px] sm:text-xs">
            Niniejsza podstrona stanowi oficjalną deklarację tożsamości właścicielskiej dla instytucji płatniczych i bankowych 
            (w tym <strong>Revolut Ltd / Revolut Bank UAB</strong>, banków współpracujących oraz sieci afiliacyjnych). 
            Potwierdza się, że pan <strong className="text-white">Tomasz Siwiaszczyk</strong> (zam. ul. Reymonta 88B/2, 46-100 Namysłów, tel. +49 177 8466985 / +48 794 557 967) jest wyłącznym właścicielem, dysponentem i administratorem 
            portalu internetowego oraz domeny <em>raport-finansowy24.pl</em>, zarządza wszystkimi kontami rozliczeniowymi i ponosi pełną odpowiedzialność 
            za działalność serwisu.
          </p>
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
                <span>Brak pobierania jakichkolwiek opłat od konsumentów za kalkulacje.</span>
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
          RaportFinansowy24 współpracuje z licencjonowanymi podmiotami i sieciami partnerskimi 
          (m.in. Money2Money / Totalmoney). Wszystkie prezentowane symulacje mają charakter poglądowy i ułatwiają 
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
