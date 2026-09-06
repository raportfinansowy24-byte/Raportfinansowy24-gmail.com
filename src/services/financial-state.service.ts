export interface M2MOffer {
  id: string;
  name: string;
  rate: number;
}

export class FinancialStateService {
  loanState = {
    amount: 50000,
    term: 60,
    offers: [] as M2MOffer[]
  };

  savingsState = {
    target: 50000,
    current: 5000,
    years: 5,
    rateOfReturn: 5,
    monthly: 0
  };
}

export const financialStateService = new FinancialStateService();
