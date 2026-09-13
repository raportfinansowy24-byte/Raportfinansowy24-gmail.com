export interface CompanyRecord {
  name: string;
  krs: string;
  nip: string;
  regon: string;
  legalForm: string;
  registrationDate: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  shareCapital: number | string;
  vatStatus: 'Czynny podatnik VAT' | 'Zwolniony z VAT' | 'Niezarejestrowany';
  isVatWhiteListed?: boolean;
  bankAccountsCount?: number;
  courtName?: string;
  boardMembers: Array<{
    role: string;
    name: string;
    appointmentDate?: string;
  }>;
  supervisoryBoard?: Array<{
    role: string;
    name: string;
  }>;
  pkdCodes: Array<{
    code: string;
    description: string;
    isMain?: boolean;
  }>;
  lastFiledReports: Array<{
    period: string;
    filingDate: string;
    documentType: string;
  }>;
  arrears: {
    taxArrears: boolean;
    customsArrears: boolean;
    zusArrears: boolean;
    hasBankruptcyNotice?: boolean;
    details?: string;
  };
}

export interface FinancialYearData {
  year: string;
  revenue: number; // Przychody netto
  operatingCosts: number; // Koszty operacyjne
  ebitda: number; // EBITDA
  operatingProfit: number; // Zysk z działalności operacyjnej
  netProfit: number; // Zysk netto
  assets: number; // Aktywa razem
  equity: number; // Kapitał własny
  liabilities: number; // Zobowiązania ogółem
  currentAssets?: number; // Aktywa obrotowe
  shortTermLiabilities?: number; // Zobowiązania krótkoterminowe
}

export interface CompanyFinancials {
  years: string[];
  historical: FinancialYearData[];
  summary: {
    revenue: number;
    operatingCosts: number;
    netProfit: number;
    ebitda: number;
    totalAssets: number;
    equity: number;
    liabilities: number;
    netMarginPercent: number;
    currentRatio: number; // Płynność bieżąca
    debtToEquityRatio: number; // Wskaźnik zadłużenia
    yoyRevenueGrowth: number; // Dynamika przychodów r/r %
  };
}

export interface AiCompanyDiagnostic {
  overallScore: number; // 1-100
  financialStability: 'Wysoka' | 'Umiarkowana' | 'Podwyższone ryzyko' | 'Krytyczna';
  verdictSummary: string; // "Co naprawdę dzieje się z tą firmą?"
  keyStrengths: string[];
  keyRisks: string[];
  liquidityAssessment: string;
  debtSustainability: string;
  b2bRecommendation: {
    tradeCreditAllowed: boolean;
    recommendedCreditLimit: string;
    paymentTermsDays: number;
    monitoringAdvice: string;
  };
  suggestedFinancialProducts: Array<{
    title: string;
    type: 'factoring' | 'credit' | 'leasing' | 'debt_collection';
    description: string;
  }>;
}

export interface CompanyAuditReport {
  company: CompanyRecord;
  financials: CompanyFinancials;
  aiDiagnostic: AiCompanyDiagnostic;
  reportId: string;
  generatedAt: string;
}
