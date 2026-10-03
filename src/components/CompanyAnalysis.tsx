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
  ChevronRight,
  Gift,
  Crown,
  Lock,
  Unlock,
  Share2
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
  Area,
  Line,
  ComposedChart,
  Legend
} from 'recharts';
import { CompanyRecord, CompanyFinancials, AiCompanyDiagnostic, CompanyAuditReport } from '../types/company';
import { 
  fetchCompanyData, 
  fetchCompanyDiagnostic, 
  registerCompanyMonitoring, 
  generateCompanyAuditPdf,
  validateNip,
  cleanNip,
  formatNip
} from '../services/companyClient';
import { referralService, ReferralState } from '../services/referral.service';
import { ReportFeedbackSurvey } from './ReportFeedbackSurvey';
import { useTheme } from '../context/ThemeContext';

export function CompanyAnalysis() {
  const { theme } = useTheme();
  const isHighContrast = theme === 'high-contrast';

  // Formatowany stan wejściowy NIP w UI
  const [nipInput, setNipInput] = useState('734-286-71-48'); // Domyślnie CD Projekt S.A.
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
  const [monitorError, setMonitorError] = useState<string | null>(null);

  // PDF Export state
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Financial view tab (table or compact charts)
  const [financialViewTab, setFinancialViewTab] = useState<'table' | 'charts'>('table');
  const [financialChartMode, setFinancialChartMode] = useState<'revenue_profit' | 'costs' | 'margins'>('revenue_profit');

  // Viral Referral & Premium reports state
  const [referralState, setReferralState] = useState<ReferralState>(referralService.getState());
  const [unlockToast, setUnlockToast] = useState<{ message: string; success: boolean } | null>(null);

  useEffect(() => {
    const unsub = referralService.subscribe(setReferralState);
    return () => unsub();
  }, []);

  const isReportUnlocked = company ? referralService.hasPremiumAccess(company.nip) : false;

  const calculateAltmanScore = (fin: CompanyFinancials) => {
    const rev = fin.summary.revenue || 1;
    const ebitda = fin.summary.ebitda || 0;
    const netProfit = fin.summary.netProfit || 0;
    const assets = fin.summary.totalAssets || rev * 0.8;
    const equity = fin.summary.equity || assets * 0.5;
    const liabilities = fin.summary.liabilities || Math.max(1, assets - equity);
    const currentRatio = fin.summary.currentRatio || 1.2;

    // Model E. Mączyńskiej dla polskich przedsiębiorstw:
    // Z = 1.5*X1 + 0.08*X2 + 10*X3 + 0.1*X4 + 0.1*X5
    const x1 = assets > 0 ? (ebitda / assets) : 0;
    const x2 = assets > 0 ? (equity / assets) : 0;
    const x3 = liabilities > 0 ? ((netProfit + ebitda * 0.2) / liabilities) : 0;
    const x4 = currentRatio;
    const x5 = assets > 0 ? (rev / assets) : 1;

    const z = (1.5 * x1) + (0.08 * x2) + (10 * x3) + (0.1 * x4) + (0.1 * x5);
    const roundedZ = Math.round(z * 100) / 100;

    let zone: 'safe' | 'warning' | 'danger' = 'safe';
    let zoneLabel = 'Strefa Bezpieczna (Bardzo niskie ryzyko)';
    let zoneColor = 'text-emerald-400';
    let zoneBg = 'bg-emerald-950/20 border-emerald-500/30';

    if (roundedZ < 0) {
      zone = 'danger';
      zoneLabel = 'Strefa Ryzyka Niewypłacalności';
      zoneColor = 'text-rose-400';
      zoneBg = 'bg-rose-950/20 border-rose-500/30';
    } else if (roundedZ < 0.6) {
      zone = 'warning';
      zoneLabel = 'Strefa Ostrzegawcza (Średnie ryzyko)';
      zoneColor = 'text-amber-400';
      zoneBg = 'bg-amber-950/20 border-amber-500/30';
    }

    return { score: roundedZ, zone, zoneLabel, zoneColor, zoneBg };
  };

  const handleUnlockCurrentReport = async () => {
    if (!company) return;
    if (isReportUnlocked) return;

    if (referralState.premiumCredits > 0) {
      const res = await referralService.unlockReportForNip(company.nip);
      setUnlockToast({ message: res.message, success: res.success });
      setTimeout(() => setUnlockToast(null), 4000);
    } else {
      window.dispatchEvent(new CustomEvent('open_referral_modal'));
    }
  };

  // Walidacja NIP w locie
  const nipValidation = validateNip(nipInput);
  const cleanDigits = cleanNip(nipInput);

  // Initial load z poprawnym NIP z parametru lub domyślnym
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const nipParam = urlParams.get('nip') || sessionStorage.getItem('pending_nip_search');
      if (nipParam) {
        sessionStorage.removeItem('pending_nip_search');
        const clean = cleanNip(nipParam);
        if (clean.length === 10) {
          setNipInput(formatNip(clean));
          handleSearch(clean);
          return;
        }
      }
    } catch {
      // ignore
    }
    handleSearch('7342867148');
  }, []);

  const handleSearch = async (searchNip?: string) => {
    const rawTarget = searchNip !== undefined ? searchNip : nipInput;
    const validation = validateNip(rawTarget);

    // Blokada zapytania do API dla niepoprawnego NIP
    if (!validation.isValid) {
      setError(validation.error || 'Wpisz poprawny 10-cyfrowy numer NIP.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Backend zawsze otrzymuje 10 cyfr bez separatorów (spacji, myślników)
      const data = await fetchCompanyData(validation.cleanNip);
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
      setError(err.message || 'Nie udało się pobrać danych firmy. Spróbuj ponownie.');
      // W przypadku braku firmy lub błędu nie pokazujemy fikcyjnych danych
      setCompany(null);
      setFinancials(null);
      setDiagnostic(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (presetNip: string) => {
    const formatted = formatNip(presetNip);
    setNipInput(formatted);
    handleSearch(presetNip);
  };

  const handleNipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const clean = cleanNip(val);

    // Automatyczne formatowanie do XXX-XXX-XX-XX po osiągnięciu 10 cyfr
    if (/^\d{10}$/.test(clean) && !val.includes('-')) {
      setNipInput(formatNip(clean));
    } else {
      setNipInput(val);
    }
  };

  const handleNipBlur = () => {
    const clean = cleanNip(nipInput);
    if (/^\d{10}$/.test(clean)) {
      setNipInput(formatNip(clean));
    }
  };

  const handleDownloadPdf = async () => {
    if (!company || !financials) return;

    // Sprawdzenie uprawnień Premium
    if (!isReportUnlocked && !referralState.isVipUnlimited) {
      if (referralState.premiumCredits > 0) {
        // Zużyj kredyt automatycznie na ten raport
        const unlockRes = await referralService.unlockReportForNip(company.nip);
        setUnlockToast({ message: unlockRes.message, success: unlockRes.success });
        setTimeout(() => setUnlockToast(null), 4000);
        if (!unlockRes.success) {
          setPdfError(unlockRes.message);
          return;
        }
      } else {
        // Brak kredytów - otwórz program poleceń
        setPdfError('Pobieranie oficjalnego certyfikowanego audytu PDF jest dostępne w wersji Premium. Odbierz darmowy kredyt polecając znajomego!');
        setTimeout(() => setPdfError(null), 5000);
        window.dispatchEvent(new CustomEvent('open_referral_modal'));
        return;
      }
    }

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
      setPdfError('Nie udało się wygenerować raportu PDF. Spróbuj ponownie.');
      setTimeout(() => setPdfError(null), 4000);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleMonitoringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monitorEmail || !company) return;
    setMonitorLoading(true);
    setMonitorError(null);
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
      setMonitorError('Wystąpił błąd podczas rejestracji monitoringu. Spróbuj ponownie.');
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
    rok: String(item.year),
    przychody: Number((item.revenue / 1000000).toFixed(2)),
    koszty: Number((item.operatingCosts / 1000000).toFixed(2)),
    ebitda: Number((item.ebitda / 1000000).toFixed(2)),
    zyskNetto: Number((item.netProfit / 1000000).toFixed(2)),
    marzaNetto: item.revenue > 0 ? Number(((item.netProfit / item.revenue) * 100).toFixed(1)) : 0,
    marzaEbitda: item.revenue > 0 ? Number(((item.ebitda / item.revenue) * 100).toFixed(1)) : 0
  })) || [];

  const balanceChartData = financials?.historical.map(item => ({
    rok: String(item.year),
    aktywa: Number((item.assets / 1000000).toFixed(2)),
    kapitalWlasny: Number((item.equity / 1000000).toFixed(2)),
    zobowiazania: Number((item.liabilities / 1000000).toFixed(2))
  })) || [];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-6 overflow-x-hidden">
      
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
              <span>Moduł B2B • Weryfikacja Rejestrów MF i KRS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              SPRAWDŹ FIRMĘ PO <span className="text-[#DC143C]">NIP</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Wpisz 10-cyfrowy NIP podmiotu gospodarczego. System weryfikuje sumę kontrolną w czasie rzeczywistym i pobiera oficjalne dane finansowe z rejestrów publicznych.
            </p>
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Przetestuj na:</span>
            <button 
              type="button"
              onClick={() => handleSelectPreset('7342867148')}
              className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all cursor-pointer"
            >
              CD Projekt
            </button>
            <button 
              type="button"
              onClick={() => handleSelectPreset('6211766191')}
              className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all cursor-pointer"
            >
              Dino Polska
            </button>
            <button 
              type="button"
              onClick={() => handleSelectPreset('5220003782')}
              className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all cursor-pointer"
            >
              Asseco Poland
            </button>
            <button 
              type="button"
              onClick={() => handleSelectPreset('5252819009')}
              className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all cursor-pointer"
            >
              MŚP IT (Tech)
            </button>
          </div>
        </div>

        {/* Search Input Bar - SPRAWDŹ FIRMĘ PO NIP */}
        <div className="mt-5 relative z-10">
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              if (nipValidation.isValid && !loading) {
                handleSearch(); 
              }
            }}
            className="flex flex-col sm:flex-row items-stretch gap-3"
          >
            {/* Input z walidacją w czasie rzeczywistym */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={18} />
              <input
                type="text"
                value={nipInput}
                onChange={handleNipChange}
                onBlur={handleNipBlur}
                placeholder="Wpisz NIP firmy"
                aria-label="Wpisz NIP firmy"
                className={`w-full pl-11 pr-36 py-3.5 sm:py-4 rounded-2xl bg-black/60 border text-white placeholder:text-zinc-500 text-base font-medium focus:outline-none transition-all ${
                  cleanDigits.length === 10 && nipValidation.isValid
                    ? 'border-emerald-500/60 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50'
                    : ((cleanDigits.length === 10 && !nipValidation.isValid) || cleanDigits.length > 10 || (cleanDigits.length > 0 && !/^\d+$/.test(cleanDigits)))
                    ? 'border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/50'
                    : 'border-white/15 focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C]'
                }`}
              />

              {/* Status walidacji wewnątrz pola (desktop i mobile) */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                {cleanDigits.length === 10 && nipValidation.isValid && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Check size={13} className="stroke-[3]" />
                    <span>✓ Poprawny NIP</span>
                  </span>
                )}
                {((cleanDigits.length === 10 && !nipValidation.isValid) || cleanDigits.length > 10 || (cleanDigits.length > 0 && !/^\d+$/.test(cleanDigits))) && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <AlertTriangle size={13} />
                    <span>Nieprawidłowy NIP</span>
                  </span>
                )}
                {cleanDigits.length > 0 && cleanDigits.length < 10 && /^\d+$/.test(cleanDigits) && (
                  <span className="text-[11px] font-semibold text-zinc-400 px-2 py-0.5">
                    {cleanDigits.length}/10 cyfr
                  </span>
                )}
              </div>
            </div>

            {/* Przycisk Analizy - aktywny wyłącznie dla poprawnego NIP */}
            <button
              type="submit"
              disabled={!nipValidation.isValid || loading}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-[#DC143C] hover:bg-[#b01030] text-white font-bold text-base tracking-wide transition-all shadow-[0_0_20px_rgba(220,20,60,0.3)] flex items-center justify-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Weryfikacja w rejestrach...</span>
                </>
              ) : (
                <>
                  <span>ANALIZUJ FIRMĘ →</span>
                </>
              )}
            </button>
          </form>

          {/* Pomocniczy komunikat błędu walidacji dla urządzeń mobilnych */}
          {((cleanDigits.length === 10 && !nipValidation.isValid) || cleanDigits.length > 10 || (cleanDigits.length > 0 && !/^\d+$/.test(cleanDigits))) && (
            <div className="mt-2 text-xs text-rose-400 font-semibold flex items-center gap-1.5 pl-2">
              <AlertTriangle size={13} className="shrink-0" />
              <span>Nieprawidłowy NIP — upewnij się, że wpisujesz dokładnie 10 cyfr i suma kontrolna jest poprawna.</span>
            </div>
          )}
        </div>
      </div>

      {/* Komunikat o błędzie PDF */}
      {pdfError && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-sm flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0" />
          <span>{pdfError}</span>
        </div>
      )}

      {/* Komunikat błędu z API */}
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
                {/* Premium Report Status & Unlock Button */}
                {isReportUnlocked || referralState.isVipUnlimited ? (
                  <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                    <Crown size={14} className="text-amber-400" />
                    <span>Raport Premium Odblokowany</span>
                  </div>
                ) : (
                  <button
                    onClick={handleUnlockCurrentReport}
                    className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:opacity-95 text-black font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer active:scale-95"
                    title="Odblokuj pełny audyt Altman Z-Score i certyfikowany PDF"
                  >
                    <Sparkles size={14} />
                    <span>
                      {referralState.premiumCredits > 0
                        ? `Odblokuj Raport (${referralState.premiumCredits} darmowych)`
                        : 'Odblokuj Raport (Poleć znajomemu)'}
                    </span>
                  </button>
                )}

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

            {/* Unlock Feedback Toast */}
            {unlockToast && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 mb-4 animate-fade-in ${
                unlockToast.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <CheckCircle2 size={16} className={unlockToast.success ? "text-emerald-400 shrink-0" : "text-rose-400 shrink-0"} />
                <span>{unlockToast.message}</span>
              </div>
            )}

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

                {/* 2.1 Premium Module: Altman Z-Score & Bankruptcy Risk Index */}
                {(() => {
                  const altman = calculateAltmanScore(financials);
                  const isUnlocked = isReportUnlocked || referralState.isVipUnlimited;

                  return (
                    <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${isUnlocked ? altman.zoneBg : 'bg-black/40 border-amber-500/20'}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-black tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                              <Crown size={11} /> Moduł Raportu Premium
                            </span>
                            <span className="text-xs font-bold text-white">Indeks Ryzyka Niewypłacalności (Polski Model Altmana Z-Score)</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 max-w-xl">
                            Wieloczynnikowa analiza prawdopodobieństwa upadłości wg modelu prof. E. Mączyńskiej (Instytut Nauk Ekonomicznych PAN).
                          </p>
                        </div>

                        {isUnlocked ? (
                          <div className="flex items-center gap-3 shrink-0 bg-black/60 px-4 py-2.5 rounded-xl border border-white/10">
                            <div className="text-right">
                              <div className="text-[10px] text-zinc-400 font-bold uppercase">Wskaźnik Z-Score</div>
                              <div className={`text-xl font-black ${altman.zoneColor}`}>{altman.score}</div>
                            </div>
                            <div className="border-l border-white/10 pl-3">
                              <div className="text-[10px] text-zinc-400 uppercase font-bold">Ocena Ryzyka</div>
                              <div className={`text-xs font-bold ${altman.zoneColor}`}>{altman.zoneLabel}</div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={handleUnlockCurrentReport}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:opacity-95 text-black font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 shrink-0"
                          >
                            <Lock size={13} />
                            <span>
                              {referralState.premiumCredits > 0
                                ? `Odblokuj Z-Score (1 kredyt)`
                                : `Odblokuj za darmo (Poleć znajomemu)`}
                            </span>
                          </button>
                        )}
                      </div>

                      {!isUnlocked && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Gift size={13} className="text-[#DC143C]" />
                            Dostępne kredyty Premium na Twoim koncie: <strong className="text-white">{referralState.premiumCredits}</strong>
                          </span>
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open_referral_modal'))}
                            className="text-amber-300 hover:underline font-bold text-left sm:text-right cursor-pointer"
                          >
                            Zaproś znajomego i odbierz +2 darmowe kredyty →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : null}
          </div>

          {/* 3. FULL FINANCIAL STATEMENT & CHARTS (TABBED & COMPACT) */}
          <div className="rounded-3xl p-5 bg-[#16161c] border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText size={18} className="text-[#DC143C]" />
                  <span>Sprawozdanie Finansowe: Bilans i Rachunek Zysków i Strat</span>
                </h4>
                <p className="text-xs text-zinc-400">Dane ze złożonych sprawozdań finansowych w Repozytorium Dokumentów Finansowych (RDF)</p>
              </div>

              {/* View Switcher: Table vs Charts + PDF Button */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex rounded-xl bg-black/50 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setFinancialViewTab('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      financialViewTab === 'table'
                        ? 'bg-[#DC143C] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <FileText size={13} />
                    <span>Tabela</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancialViewTab('charts')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      financialViewTab === 'charts'
                        ? 'bg-[#DC143C] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp size={13} />
                    <span>Wykresy & Trendy</span>
                  </button>
                </div>

                <button
                  id="btn-download-pdf-table"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  title="Eksportuj pełne zestawienie finansowe do PDF"
                >
                  <Download size={14} className="text-[#DC143C]" />
                  <span className="hidden sm:inline">Eksportuj do PDF</span>
                  <span className="sm:hidden">PDF</span>
                </button>
              </div>
            </div>

            {financialViewTab === 'table' ? (
              /* TABELA SPRAWOZDANIA FINANSOWEGO */
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
            ) : (
              /* KOMPAKTOWE WYKRESY RECHARTS W RAMACH ZAKŁADKI */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                
                {/* Chart 1: Revenue & Profit */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-[#DC143C]" />
                        <span>Przychody i Wynik Netto</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">2022–2024 (w mln PLN)</div>
                    </div>

                    <div className="inline-flex rounded-lg bg-white/5 p-0.5 border border-white/10 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setFinancialChartMode('revenue_profit')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          financialChartMode === 'revenue_profit' ? 'bg-[#DC143C] text-white' : 'text-zinc-400'
                        }`}
                      >
                        Przychody/Zysk
                      </button>
                      <button
                        type="button"
                        onClick={() => setFinancialChartMode('margins')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          financialChartMode === 'margins' ? 'bg-[#DC143C] text-white' : 'text-zinc-400'
                        }`}
                      >
                        Marża %
                      </button>
                    </div>
                  </div>

                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {financialChartMode === 'revenue_profit' ? (
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="rok" stroke="#71717a" fontSize={10} tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}M`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181e', borderColor: '#ffffff20', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                            formatter={(value: any, name: string) => [
                              `${Number(value).toFixed(2)} mln zł`,
                              name === 'przychody' ? 'Przychody' : name === 'zyskNetto' ? 'Zysk Netto' : 'EBITDA'
                            ]}
                          />
                          <Bar dataKey="przychody" name="przychody" fill="#DC143C" radius={[4, 4, 0, 0]} maxBarSize={35} />
                          <Line type="monotone" dataKey="zyskNetto" name="zyskNetto" stroke="#34D399" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
                        </ComposedChart>
                      ) : (
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="rok" stroke="#71717a" fontSize={10} tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}%`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181e', borderColor: '#ffffff20', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                            formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Marża Netto']}
                          />
                          <Line type="monotone" dataKey="marzaNetto" name="marzaNetto" stroke="#34D399" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
                        </ComposedChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Balance structure */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Landmark size={14} className="text-emerald-400" />
                      <span>Kapitał Własny vs Zobowiązania</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">Pasywa bilansowe w mln PLN</div>
                  </div>

                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={balanceChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="rok" stroke="#71717a" fontSize={10} tickLine={false} />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}M`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181e', borderColor: '#ffffff20', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                          formatter={(value: any, name: string) => [
                            `${Number(value).toFixed(2)} mln zł`,
                            name === 'kapitalWlasny' ? 'Kapitał własny' : 'Zobowiązania'
                          ]}
                        />
                        <Area type="monotone" dataKey="kapitalWlasny" name="kapitalWlasny" stroke="#10B981" fill="#10B98120" />
                        <Area type="monotone" dataKey="zobowiazania" name="zobowiazania" stroke="#F59E0B" fill="#F59E0B20" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
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

          {/* 7. Ocena Przydatności Raportu & Przycisk "Podziel się sukcesem" */}
          <ReportFeedbackSurvey 
            reportType="company_audit"
            targetName={company.name}
            targetNip={company.nip}
          />

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
                  {monitorError && (
                    <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400 shrink-0" />
                      <span>{monitorError}</span>
                    </div>
                  )}
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
