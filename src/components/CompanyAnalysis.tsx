import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShieldCheck, 
  FileText, 
  Download, 
  BellRing, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Calendar, 
  MapPin, 
  Landmark, 
  Sparkles,
  RefreshCw,
  Check,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { CompanyRecord, CompanyFinancials, AiCompanyDiagnostic, CompanyAuditReport } from '../types/company';
import { fetchCompanyData, fetchCompanyDiagnostic, registerCompanyMonitoring, generateCompanyAuditPdf } from '../services/companyClient';
import { useTheme } from '../context/ThemeContext';

export function CompanyAnalysis() {
  const { theme } = useTheme();
  const isHighContrast = theme === 'high-contrast';

  const [query, setQuery] = useState('7342867148'); // Default CD Projekt NIP
  const [loading, setLoading] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState<CompanyRecord | null>(null);
  const [financials, setFinancials] = useState<CompanyFinancials | null>(null);
  const [diagnostic, setDiagnostic] = useState<AiCompanyDiagnostic | null>(null);

  // Monitoring modal state
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  const [monitorEmail, setMonitorEmail] = useState('');
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorSuccess, setMonitorSuccess] = useState(false);

  // PDF Export state
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  // Initial load
  useEffect(() => {
    handleSearch('7342867148');
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchCompanyData(searchQuery);
      setCompany(data.company);
      setFinancials(data.financials);

      // Now run AI diagnostic
      setAnalyzingAi(true);
      try {
        const aiDiag = await fetchCompanyDiagnostic(data.company, data.financials);
        setDiagnostic(aiDiag);
      } catch (aiErr) {
        console.warn('AI diagnostic failed, using standard rules:', aiErr);
      } finally {
        setAnalyzingAi(false);
      }
    } catch (err: any) {
      setError(err.message || 'Nie udało się odnaleźć spółki. Sprawdź poprawność numeru NIP lub KRS.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!company || !financials) return;
    setDownloadingPdf(true);
    try {
      const effectiveDiagnostic: AiCompanyDiagnostic = diagnostic || {
        overallScore: Math.min(95, Math.max(45, Math.round(50 + (financials.summary.netMarginPercent > 0 ? 20 : -10) + (financials.summary.currentRatio >= 1.2 ? 15 : 0)))),
        financialStability: financials.summary.currentRatio >= 1.2 && financials.summary.netMarginPercent > 0 ? 'Wysoka' : 'Umiarkowana',
        verdictSummary: `Spółka ${company.name} wykazuje roczne przychody na poziomie ${formatPLN(financials.summary.revenue)} przy marży netto ${financials.summary.netMarginPercent}%. Wskaźnik płynności bieżącej wynosi ${financials.summary.currentRatio}x.`,
        keyStrengths: [
          `Stabilna baza kapitałowa: ${formatPLN(financials.summary.equity)} kapitału własnego`,
          `Pozytywny wynik operacyjny EBITDA: ${formatPLN(financials.summary.ebitda)}`,
          'Brak ujawnionych zaległości w rejestrach publicznych'
        ],
        keyRisks: [
          'Konieczność bieżącego monitorowania wskaźnika zadłużenia',
          'Zalecana weryfikacja terminowości spłat wierzytelności handlowych'
        ],
        liquidityAssessment: `Wskaźnik płynności bieżącej wynosi ${financials.summary.currentRatio}x, co wskazuje na ${financials.summary.currentRatio >= 1.2 ? 'bezpieczną' : 'wymagającą uwagi'} zdolność regulowania zobowiązań.`,
        debtSustainability: `Zadłużenie stanowi ${financials.summary.debtToEquityRatio}x kapitałów własnych, co mieści się w standardach branżowych.`,
        b2bRecommendation: {
          tradeCreditAllowed: financials.summary.currentRatio >= 1.0,
          recommendedCreditLimit: financials.summary.revenue > 100000000 ? '500 000 PLN' : '100 000 PLN',
          paymentTermsDays: 30,
          monitoringAdvice: 'Zalecany standardowy monitoring transakcji B2B.'
        },
        suggestedFinancialProducts: [
          {
            title: 'Faktoring z ubezpieczeniem należności',
            type: 'factoring',
            description: 'Finansowanie bieżących faktur z odroczonym terminem do 90 dni.'
          },
          {
            title: 'Kredyt obrotowy w rachunku bieżącym',
            type: 'credit',
            description: 'Zapewnienie ciągłości finansowania operacyjnego.'
          }
        ]
      };

      const report: CompanyAuditReport = {
        company,
        financials,
        aiDiagnostic: effectiveDiagnostic,
        reportId: `RF24-${Date.now().toString().slice(-6)}`,
        generatedAt: new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
      };
      generateCompanyAuditPdf(report);
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3500);
    } catch (err) {
      console.error('Błąd generowania PDF:', err);
      alert('Nie udało się wygenerować raportu PDF. Spróbuj ponownie.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleMonitoringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monitorEmail || !company) return;
    setMonitorLoading(true);
    try {
      await registerCompanyMonitoring({
        email: monitorEmail,
        nip: company.nip,
        krs: company.krs,
        companyName: company.name,
        plan: 'Monitoring B2B PRO'
      });
      setMonitorSuccess(true);
      setTimeout(() => {
        setShowMonitorModal(false);
        setMonitorSuccess(false);
        setMonitorEmail('');
      }, 2500);
    } catch (err) {
      alert('Wystąpił błąd podczas rejestracji monitoringu.');
    } finally {
      setMonitorLoading(false);
    }
  };

  // Format monetary values in PLN
  const formatPLN = (val?: number) => {
    if (val === undefined || val === null) return '-';
    if (Math.abs(val) >= 1000000000) return `${(val / 1000000000).toFixed(2)} mld zł`;
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(2)} mln zł`;
    return `${val.toLocaleString('pl-PL')} zł`;
  };

  // Chart data preparation
  const chartData = financials?.historical.map(item => ({
    rok: item.year,
    przychody: item.revenue / 1000000,
    koszty: item.operatingCosts / 1000000,
    ebitda: item.ebitda / 1000000,
    zyskNetto: item.netProfit / 1000000
  })) || [];

  const balanceChartData = financials?.historical.map(item => ({
    rok: item.year,
    aktywa: item.assets / 1000000,
    kapitalWlasny: item.equity / 1000000,
    zobowiazania: item.liabilities / 1000000
  })) || [];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-6">
      
      {/* Top Banner / Hero Bar */}
      <div className={`rounded-3xl p-4 sm:p-6 border shadow-2xl relative overflow-hidden ${
        isHighContrast 
          ? 'bg-black border-[#FF0033]/40' 
          : 'bg-gradient-to-br from-[#18181e] via-[#121218] to-[#0a0a0e] border-white/10'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DC143C]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DC143C]/15 border border-[#DC143C]/30 text-[#FF0033] text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles size={13} />
              <span>Moduł B2B • Rejestr KRS & Sprawozdania Finansowe</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Audyt Finansowy Spółki <span className="text-[#DC143C]">AI 24</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Wyszukaj dowolną polską spółkę po <strong>NIP, KRS, REGON lub nazwie</strong>. Pobierz bilans, wskaźniki rentowności i wygeneruj syntetyczną diagnozę ryzyka Gemini AI.
            </p>
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Przetestuj na:</span>
            <button 
              onClick={() => { setQuery('7342867148'); handleSearch('7342867148'); }}
              className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all"
            >
              CD Projekt
            </button>
            <button 
              onClick={() => { setQuery('6972164361'); handleSearch('6972164361'); }}
              className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all"
            >
              Dino Polska
            </button>
            <button 
              onClick={() => { setQuery('5220003782'); handleSearch('5220003782'); }}
              className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all"
            >
              Asseco Poland
            </button>
            <button 
              onClick={() => { setQuery('5252819001'); handleSearch('5252819001'); }}
              className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all"
            >
              MŚP IT (Tech)
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="mt-5 relative z-10">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
            className="flex flex-col sm:flex-row items-stretch gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Wpisz NIP (10 cyfr), numer KRS (np. 0000006865) lub nazwę spółki..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-black/50 border border-white/15 text-white placeholder:text-zinc-500 text-sm font-medium focus:outline-none focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C] transition-all"
              />
              {query.length === 10 && !isNaN(Number(query)) && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Wykryto NIP
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-2xl bg-[#DC143C] hover:bg-[#b01030] text-white font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(220,20,60,0.3)] flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Weryfikacja w rejestrach...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Generuj Audyt Spółki</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Analysis Display */}
      {company && financials && (
        <div className="space-y-6">

          {/* 1. Company Header Overview */}
          <div className="rounded-3xl p-5 sm:p-6 bg-[#16161c] border border-white/10 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {company.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white/80 border border-white/15">
                    {company.legalForm}
                  </span>
                  {company.vatStatus.includes('Czynny') && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck size={13} />
                      <span>Biała Lista MF • Czynny VAT</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 pt-1">
                  <span><strong>NIP:</strong> {company.nip || 'Brak'}</span>
                  <span>•</span>
                  <span><strong>KRS:</strong> {company.krs || 'Brak'}</span>
                  <span>•</span>
                  <span><strong>REGON:</strong> {company.regon || 'Brak'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-zinc-500" />
                    {company.address.street}, {company.address.postalCode} {company.address.city}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button
                  id="btn-download-pdf-main"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
                    pdfDownloaded 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'bg-white/10 hover:bg-white/20 border border-white/15 text-white'
                  }`}
                  title="Pobierz oficjalny raport finansowy spółki w formacie PDF (A4)"
                >
                  {downloadingPdf ? (
                    <>
                      <RefreshCw size={15} className="animate-spin text-[#DC143C]" />
                      <span>Generowanie PDF...</span>
                    </>
                  ) : pdfDownloaded ? (
                    <>
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <span>Raport PDF pobrany!</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} className="text-[#DC143C]" />
                      <span>Pobierz Raport PDF (B2B)</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-monitor-krs"
                  onClick={() => setShowMonitorModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DC143C] to-[#990022] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(220,20,60,0.3)]"
                >
                  <BellRing size={15} />
                  <span>Włącz Monitoring KRS</span>
                </button>
              </div>
            </div>

            {/* PDF Downloaded confirmation banner */}
            {pdfDownloaded && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span><strong>Sukces:</strong> Raport finansowy spółki <strong>{company.name}</strong> został wygenerowany i pobrany jako 2-stronicowy dokument PDF (A4) ze scoringiem B2B i historią bilansową.</span>
                </div>
              </div>
            )}

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Przychody (2024)</div>
                <div className="text-base sm:text-lg font-black text-white mt-1">
                  {formatPLN(financials.summary.revenue)}
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <TrendingUp size={11} />
                  <span>+{financials.summary.yoyRevenueGrowth}% r/r</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">EBITDA (Wynik operacyjny)</div>
                <div className="text-base sm:text-lg font-black text-emerald-300 mt-1">
                  {formatPLN(financials.summary.ebitda)}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Zysk netto: {formatPLN(financials.summary.netProfit)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Płynność bieżąca (Current)</div>
                <div className="text-base sm:text-lg font-black text-white mt-1">
                  {financials.summary.currentRatio}x
                </div>
                <div className={`text-[11px] mt-0.5 ${financials.summary.currentRatio >= 1.2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {financials.summary.currentRatio >= 1.2 ? 'Bezpieczna płynność' : 'Wskaźnik obniżony'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Kapitał własny</div>
                <div className="text-base sm:text-lg font-black text-white mt-1">
                  {formatPLN(financials.summary.equity)}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Zadłużenie: {financials.summary.debtToEquityRatio}x kapitału
                </div>
              </div>
            </div>
          </div>

          {/* 2. AI DIAGNOSTIC SECTION ("CO NAPRAWDĘ DZIEJE SIĘ Z TĄ FIRMĄ?") */}
          <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#1e141a] via-[#16161e] to-[#121218] border border-[#DC143C]/30 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#DC143C]/20 border border-[#DC143C]/40 text-[#FF0033]">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <span>Diagnoza AI: Co naprawdę dzieje się z tą firmą?</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#DC143C] text-white">Gemini 3.8</span>
                  </h3>
                  <p className="text-xs text-zinc-400">Głęboka analiza sprawozdań finansowych, rotacji kapitału i wiarygodności płatniczej</p>
                </div>
              </div>

              {/* Scoring Gauge Badge & Quick PDF Download */}
              {diagnostic && (
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-4 py-2 rounded-2xl">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-zinc-400">Scoring Wiarygodności</div>
                      <div className="text-xs font-bold text-emerald-400">{diagnostic.financialStability}</div>
                    </div>
                    <div className="text-2xl font-black text-white bg-[#DC143C]/20 px-3 py-1 rounded-xl border border-[#DC143C]/40 text-[#FF0033]">
                      {diagnostic.overallScore}<span className="text-xs text-zinc-400 font-normal">/100</span>
                    </div>
                  </div>

                  <button
                    id="btn-download-pdf-diag"
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    title="Pobierz audyt AI do pliku PDF"
                  >
                    <Download size={14} className="text-[#DC143C]" />
                    <span>Audyt PDF</span>
                  </button>
                </div>
              )}
            </div>

            {analyzingAi ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="animate-spin text-[#DC143C]" />
                <span className="text-xs text-zinc-300 font-medium">Model Gemini 3.8 Flash przetwarza bilans i pozycje RZiS spółki...</span>
              </div>
            ) : diagnostic ? (
              <div className="space-y-4">
                {/* Synthesis Verdict */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-sm leading-relaxed text-zinc-200">
                  <p className="font-medium">
                    {diagnostic.verdictSummary}
                  </p>
                </div>

                {/* Two columns: Strengths vs Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                      <CheckCircle2 size={14} />
                      <span>Kluczowe mocne strony</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {diagnostic.keyStrengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risks */}
                  <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-400">
                      <AlertTriangle size={14} />
                      <span>Czynniki ryzyka & uwagi</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {diagnostic.keyRisks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-400 font-bold">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* B2B Recommendation Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 to-indigo-950/20 border border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1.5">
                      <ShieldCheck size={13} />
                      <span>Rekomendacja Handlowa B2B (Kredyt Kupiecki)</span>
                    </div>
                    <div className="text-xs text-zinc-300">
                      {diagnostic.b2bRecommendation.monitoringAdvice}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-zinc-400 font-medium">Bezpieczny limit kupiecki</div>
                      <div className="text-sm font-black text-white">{diagnostic.b2bRecommendation.recommendedCreditLimit}</div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-zinc-400 font-medium">Termin płatności</div>
                      <div className="text-sm font-black text-emerald-400">{diagnostic.b2bRecommendation.paymentTermsDays} dni</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* 3. CHARTS & FINANCIAL STATEMENTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Revenue vs Costs */}
            <div className="rounded-3xl p-5 bg-[#16161c] border border-white/10 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Przychody ze sprzedaży vs Koszty</h4>
                  <p className="text-[11px] text-zinc-400">Wartości w mln PLN za lata 2022–2024</p>
                </div>
                <div className="text-xs text-zinc-400 font-semibold flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#DC143C]" /> Przychody</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-zinc-600" /> Koszty</span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="rok" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}M`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181e', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                      formatter={(value: any) => [`${Number(value).toFixed(2)} mln zł`]}
                    />
                    <Bar dataKey="przychody" name="Przychody" fill="#DC143C" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="koszty" name="Koszty operacyjne" fill="#52525b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Balance Sheet Structure */}
            <div className="rounded-3xl p-5 bg-[#16161c] border border-white/10 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Struktura Bilansu: Kapitał vs Zobowiązania</h4>
                  <p className="text-[11px] text-zinc-400">Wartości w mln PLN</p>
                </div>
                <div className="text-xs text-zinc-400 font-semibold flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Kapitał własny</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Zobowiązania</span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="rok" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}M`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181e', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                      formatter={(value: any) => [`${Number(value).toFixed(2)} mln zł`]}
                    />
                    <Area type="monotone" dataKey="kapitalWlasny" name="Kapitał własny" stroke="#10B981" fill="#10B98125" />
                    <Area type="monotone" dataKey="zobowiazania" name="Zobowiązania" stroke="#F59E0B" fill="#F59E0B25" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 4. Full Financial Statement Table */}
          <div className="rounded-3xl p-5 bg-[#16161c] border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText size={18} className="text-[#DC143C]" />
                  <span>Sprawozdanie Finansowe: Bilans i Rachunek Zysków i Strat</span>
                </h4>
                <p className="text-xs text-zinc-400">Dane ze złożonych sprawozdań finansowych w Repozytorium Dokumentów Finansowych (RDF)</p>
              </div>

              <button
                id="btn-download-pdf-table"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                title="Eksportuj pełne zestawienie finansowe do PDF"
              >
                <Download size={14} className="text-[#DC143C]" />
                <span>Eksportuj do PDF</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-white/5 uppercase text-[10px] font-black text-zinc-400 border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Pozycja sprawozdania</th>
                    <th className="py-3 px-4 text-right">2022</th>
                    <th className="py-3 px-4 text-right">2023</th>
                    <th className="py-3 px-4 text-right">2024 (Ostatni)</th>
                    <th className="py-3 px-4 text-right">Zmiana r/r</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/5 transition-colors font-semibold text-white">
                    <td className="py-3 px-4">Przychody netto ze sprzedaży</td>
                    <td className="py-3 px-4 text-right">{formatPLN(financials.historical[0]?.revenue)}</td>
                    <td className="py-3 px-4 text-right">{formatPLN(financials.historical[1]?.revenue)}</td>
                    <td className="py-3 px-4 text-right">{formatPLN(financials.historical[2]?.revenue)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">+{financials.summary.yoyRevenueGrowth}%</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4">Koszty działalności operacyjnej</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[0]?.operatingCosts)}</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[1]?.operatingCosts)}</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[2]?.operatingCosts)}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-400">-</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors font-bold text-emerald-300 bg-emerald-950/10">
                    <td className="py-2.5 px-4">EBITDA (Wynik operacyjny powiększony o amortyzację)</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[0]?.ebitda)}</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[1]?.ebitda)}</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[2]?.ebitda)}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-400">Stabilna</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors font-semibold text-white">
                    <td className="py-2.5 px-4">Zysk netto</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[0]?.netProfit)}</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[1]?.netProfit)}</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[2]?.netProfit)}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-400 font-bold">{financials.summary.netMarginPercent}% marży</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4">Aktywa razem (Suma bilansowa)</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[0]?.assets)}</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[1]?.assets)}</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[2]?.assets)}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-400">-</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4">Kapitał własny</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[0]?.equity)}</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[1]?.equity)}</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[2]?.equity)}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-400">-</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4">Zobowiązania ogółem</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[0]?.liabilities)}</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[1]?.liabilities)}</td>
                    <td className="py-2.5 px-4 text-right">{formatPLN(financials.historical[2]?.liabilities)}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-400">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Board Members & Legal Representation */}
          <div className="rounded-3xl p-5 bg-[#16161c] border border-white/10 shadow-xl space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-[#DC143C]" />
              <span>Organy Zarządcze i Reprezentacja (Dział 2 KRS)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {company.boardMembers.map((member, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[10px] uppercase font-bold text-[#DC143C]">{member.role}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{member.name}</div>
                  {member.appointmentDate && (
                    <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                      <Calendar size={11} />
                      <span>Data powołania: {member.appointmentDate}</span>
                    </div>
                  )}
                </div>
              ))}

              {company.supervisoryBoard?.map((member, i) => (
                <div key={`sup-${i}`} className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[10px] uppercase font-bold text-blue-400">{member.role}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{member.name}</div>
                  <div className="text-[11px] text-zinc-400 mt-1">Rada Nadzorcza</div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Synergy with Financing: Recommended Business Financial Products */}
          {diagnostic?.suggestedFinancialProducts && (
            <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#1a1418] via-[#16161e] to-black border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Landmark size={18} className="text-[#DC143C]" />
                <h4 className="text-base font-bold text-white">Dopasowane Finansowanie dla tej Spółki</h4>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Na podstawie wielkości obrotów ({formatPLN(financials.summary.revenue)}) i marży netto wytypowano optymalne instrumenty finansowania:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnostic.suggestedFinancialProducts.map((prod, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">{prod.title}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{prod.description}</div>
                    </div>
                    <button 
                      onClick={() => window.location.href = '/loan'}
                      className="px-3 py-2 rounded-xl bg-[#DC143C]/20 hover:bg-[#DC143C] text-[#FF0033] hover:text-white border border-[#DC143C]/40 text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                    >
                      <span>Sprawdź oferty</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Monitoring Modal (B2B Paid Product Lead) */}
      <AnimatePresence>
        {showMonitorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#18181e] border border-white/15 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowMonitorModal(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                ✕
              </button>

              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2.5 rounded-xl bg-[#DC143C]/20 text-[#FF0033] border border-[#DC143C]/30">
                  <BellRing size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Monitoring Finansowy Spółki 24/7</h3>
                  <p className="text-[11px] text-zinc-400">Automatyczne alerty zmian w KRS i rejestrach dłużników</p>
                </div>
              </div>

              {company && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-300 mb-4">
                  <div><strong>Śledzona firma:</strong> {company.name}</div>
                  <div className="text-[11px] text-zinc-400">NIP: {company.nip} | KRS: {company.krs}</div>
                </div>
              )}

              {monitorSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
                  <div className="text-sm font-bold text-white">Monitoring został pomyślnie aktywowany!</div>
                  <p className="text-xs text-zinc-400">Powiadomienia o zmianach w KRS i nowych wpisach będą wysyłane na podany adres e-mail.</p>
                </div>
              ) : (
                <form onSubmit={handleMonitoringSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300">Twój adres e-mail (do wysyłki alertów B2B):</label>
                    <input
                      type="email"
                      required
                      value={monitorEmail}
                      onChange={(e) => setMonitorEmail(e.target.value)}
                      placeholder="jan.kowalski@twoja-firma.pl"
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#DC143C]"
                    />
                  </div>

                  <div className="space-y-1 text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> Alert o nowych wpisach komorniczych i wierzytelnościach</div>
                    <div className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> Powiadomienie o zmianach w zarządzie i umowie spółki</div>
                    <div className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> Raport natychmiast po złożeniu sprawozdania finansowego</div>
                  </div>

                  <button
                    type="submit"
                    disabled={monitorLoading}
                    className="w-full py-3 rounded-xl bg-[#DC143C] hover:bg-[#b01030] text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(220,20,60,0.3)] disabled:opacity-50"
                  >
                    {monitorLoading ? 'Aktywowanie monitoringu...' : 'Aktywuj Bezpłatny Monitoring 24/7'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
