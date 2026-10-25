export type CalculationRoute = 
  | '/mortgage' 
  | '/loan' 
  | '/savings' 
  | '/konta' 
  | '/firma' 
  | '/protokol';

export interface CalculationSessionMeta {
  route: CalculationRoute;
  title: string;
  badge: string;
  summary: string;
  updatedAt: number;
}

const STORAGE_KEY_META = 'rf24_last_calc_meta';
const STORAGE_KEY_ROUTE = 'rf24_last_active_route';
const SESSION_REDIRECT_KEY = 'rf24_session_redirected';

export const VALID_CALCULATION_ROUTES: CalculationRoute[] = [
  '/mortgage',
  '/loan',
  '/savings',
  '/konta',
  '/firma',
  '/protokol'
];

/**
 * Zapisuje informację o ostatnio otwartym oknie i obliczeniu użytkownika.
 */
export function recordCalculationVisit(meta: CalculationSessionMeta) {
  try {
    localStorage.setItem(STORAGE_KEY_ROUTE, meta.route);
    localStorage.setItem(STORAGE_KEY_META, JSON.stringify(meta));
  } catch (e) {
    console.warn('Nie udało się zapisać stanu sesji użytkownika:', e);
  }
}

/**
 * Zwraca metadane ostatniego obliczenia powracającego klienta.
 */
export function getLastCalculationMeta(): CalculationSessionMeta | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_META);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.route === 'string' && VALID_CALCULATION_ROUTES.includes(parsed.route as CalculationRoute)) {
      return parsed as CalculationSessionMeta;
    }
  } catch {
    // błąd parsowania - ignorujemy
  }
  return null;
}

/**
 * Sprawdza czy w bieżącej sesji przeglądarki użytkownik został już automatycznie
 * przekierowany do ostatniego obliczenia (zapobiega pętli, gdy użytkownik ręcznie
 * kliknie logo lub link do strony głównej).
 */
export function hasSessionBeenRedirected(): boolean {
  try {
    return sessionStorage.getItem(SESSION_REDIRECT_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Oznacza, że automatyczne przekierowanie startowe w tej sesji zostało wykonane.
 */
export function markSessionRedirected() {
  try {
    sessionStorage.setItem(SESSION_REDIRECT_KEY, 'true');
  } catch {
    // ignorujemy
  }
}

/**
 * Czyści zapisaną historię ostatnich obliczeń.
 */
export function clearLastCalculation() {
  try {
    localStorage.removeItem(STORAGE_KEY_META);
    localStorage.removeItem(STORAGE_KEY_ROUTE);
    localStorage.removeItem('rf24_mortgage_state');
    localStorage.removeItem('rf24_loan_calc_state');
    localStorage.removeItem('rf24_savings_state');
    localStorage.removeItem('rf24_konta_state');
  } catch {
    // ignorujemy
  }
}
