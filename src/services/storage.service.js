const STORAGE_KEY = 'loanCalculatorState';
export class StorageService {
    saveState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
        catch (e) {
            console.error('Error saving state to localStorage', e);
        }
    }
    loadState() {
        try {
            const stateJson = localStorage.getItem(STORAGE_KEY);
            if (stateJson) {
                return JSON.parse(stateJson);
            }
            return null;
        }
        catch (e) {
            console.error('Error reading state from localStorage', e);
            return null;
        }
    }
    hasSavedState() {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }
}
export const storageService = new StorageService();
