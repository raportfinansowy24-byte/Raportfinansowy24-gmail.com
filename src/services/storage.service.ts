
import { M2MOffer } from './m2m.service';

export interface LoanCalculatorState {
  loanAmount: number;
  loanTerm: number;
  interestRate: number;
  loanOffers: M2MOffer[];
}

const STORAGE_KEY = 'loanCalculatorState';

export class StorageService {

  saveState(state: LoanCalculatorState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  }

  loadState(): LoanCalculatorState | null {
    try {
      const stateJson = localStorage.getItem(STORAGE_KEY);
      if (stateJson) {
        return JSON.parse(stateJson) as LoanCalculatorState;
      }
      return null;
    } catch (e) {
      console.error('Error reading state from localStorage', e);
      return null;
    }
  }

  hasSavedState(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }
}

export const storageService = new StorageService();
