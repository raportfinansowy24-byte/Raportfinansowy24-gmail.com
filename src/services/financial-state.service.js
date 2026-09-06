export class FinancialStateService {
    constructor() {
        this.loanState = {
            amount: 50000,
            term: 60,
            offers: []
        };
        this.savingsState = {
            target: 50000,
            current: 5000,
            years: 5,
            rateOfReturn: 5,
            monthly: 0
        };
    }
}
export const financialStateService = new FinancialStateService();
