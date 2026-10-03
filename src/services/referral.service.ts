/**
 * System poleceń (Referral & Viral Growth Program) dla RaportFinansowy24
 * Architektura Server-Authoritative: Wszelkie uprawnienia (kredyty Premium, 
 * odblokowane NIP-y, status VIP) są weryfikowane i autoryzowane przez backend.
 * LocalStorage służy wyłącznie jako pamięć podręczna (cache) dla szybkiego renderowania UI.
 */

export interface ReferralState {
  userId: string;
  myCode: string;
  referralCount: number;
  premiumCredits: number;
  isVipUnlimited: boolean;
  unlockedNips: string[];
  redeemedCodes: string[];
  referredByCode: string | null;
  lastReferredAt: string | null;
}

const STORAGE_KEY = 'rf24_referral_state';
const USER_ID_KEY = 'rf24_user_id';
const EVENT_NAME = 'rf24_referral_changed';

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'server_usr';
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    return `usr_${Date.now()}_temp`;
  }
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RF24-${result}`;
}

const DEFAULT_STATE: ReferralState = {
  userId: '',
  myCode: '',
  referralCount: 0,
  premiumCredits: 1, // Domyślna wartość synchronizowana natychmiast z serwerem
  isVipUnlimited: false,
  unlockedNips: [],
  redeemedCodes: [],
  referredByCode: null,
  lastReferredAt: null,
};

class ReferralService {
  private state: ReferralState;
  private userId: string;
  private isSyncing = false;

  constructor() {
    this.userId = getOrCreateUserId();
    this.state = this.loadLocalCache();
    this.state.userId = this.userId;
    
    // Inicjalna synchronizacja ze źródłem prawdy (backend)
    this.syncWithServer();
    this.checkForUrlReferral();
  }

  private loadLocalCache(): ReferralState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.myCode) {
          parsed.myCode = generateRandomCode();
        }
        return { ...DEFAULT_STATE, ...parsed, userId: this.userId };
      }
    } catch (e) {
      console.error('Błąd odczytu lokalnej pamięci poleceń:', e);
    }

    const initial: ReferralState = {
      ...DEFAULT_STATE,
      userId: this.userId,
      myCode: generateRandomCode(),
    };
    return initial;
  }

  private saveState(state: ReferralState) {
    this.state = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }));
    } catch (e) {
      console.error('Błąd zapisu stanu poleceń:', e);
    }
  }

  /**
   * Synchronizacja ze źródłem prawdy na serwerze (backend)
   * Jeśli użytkownik próbował zmodyfikować localStorage w DevTools,
   * serwer natychmiast przywraca autentyczny stan.
   */
  public async syncWithServer(): Promise<ReferralState> {
    if (this.isSyncing || typeof window === 'undefined') return this.state;
    this.isSyncing = true;

    try {
      const res = await fetch(`/api/referral/status?userId=${encodeURIComponent(this.userId)}&code=${encodeURIComponent(this.state.myCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.record) {
          const rec = data.record;
          const syncedState: ReferralState = {
            userId: rec.userId,
            myCode: rec.myCode || this.state.myCode,
            referralCount: rec.referralCount ?? 0,
            premiumCredits: rec.premiumCredits ?? 0,
            isVipUnlimited: Boolean(rec.isVipUnlimited),
            unlockedNips: Array.isArray(rec.unlockedNips) ? rec.unlockedNips : [],
            redeemedCodes: Array.isArray(rec.redeemedCodes) ? rec.redeemedCodes : [],
            referredByCode: rec.referredByCode || null,
            lastReferredAt: this.state.lastReferredAt,
          };
          this.saveState(syncedState);
          return syncedState;
        }
      }
    } catch (err) {
      console.warn('[ReferralService] Błąd synchronizacji z serwerem, użyto pamięci lokalnej:', err);
    } finally {
      this.isSyncing = false;
    }

    return this.state;
  }

  /**
   * Wykrywa parametr ?ref=KOD w adresie URL i realizuje bonus na serwerze
   */
  private async checkForUrlReferral() {
    if (typeof window === 'undefined') return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref') || urlParams.get('polecenie');

      if (refCode && refCode.trim().length > 0) {
        const cleanCode = refCode.trim().toUpperCase();

        if (cleanCode !== this.state.myCode && !this.state.referredByCode) {
          await this.redeemFriendCode(cleanCode);
        }
      }
    } catch (err) {
      console.error('Błąd przetwarzania parametru polecenia:', err);
    }
  }

  public getState(): ReferralState {
    return { ...this.state };
  }

  public getUserId(): string {
    return this.userId;
  }

  public getReferralLink(): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://raportfinansowy24.pl';
    return `${origin}/?ref=${this.state.myCode}`;
  }

  /**
   * Sprawdza, czy użytkownik ma dostęp do Raportu Premium
   */
  public hasPremiumAccess(nip?: string): boolean {
    if (this.state.isVipUnlimited) return true;
    if (nip) {
      const clean = nip.replace(/\D/g, '');
      if (this.state.unlockedNips.includes(clean)) return true;
    }
    return false;
  }

  /**
   * Odblokowuje raport premium dla wskazanego NIP za 1 kredyt
   * Zabezpieczone serwerowo: Backend sprawdza uprawnienia i kredyty.
   */
  public async unlockReportForNip(nip: string): Promise<{ success: boolean; message: string }> {
    const cleanNip = nip.replace(/\D/g, '');

    try {
      const res = await fetch('/api/referral/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId, nip: cleanNip })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        // Jeśli serwer odrzucił (np. brak kredytów na serwerze pomimo manipulacji w DevTools),
        // zsynchronizuj stan z rzeczywistością serwerową
        if (data.record) {
          const rec = data.record;
          this.saveState({
            ...this.state,
            premiumCredits: rec.premiumCredits,
            isVipUnlimited: rec.isVipUnlimited,
            unlockedNips: rec.unlockedNips
          });
        } else {
          await this.syncWithServer();
        }
        return {
          success: false,
          message: data.message || 'Brak dostępnych kredytów Premium na serwerze. Poleć serwis znajomemu!',
        };
      }

      // Sukces z serwera: aktualizacja stanu
      const rec = data.record;
      this.saveState({
        ...this.state,
        premiumCredits: rec.premiumCredits,
        isVipUnlimited: rec.isVipUnlimited,
        unlockedNips: rec.unlockedNips
      });

      return {
        success: true,
        message: data.message || 'Pomyślnie odblokowano Raport Premium! Pobierz pełną analizę w PDF.',
      };
    } catch (err: any) {
      console.error('[ReferralService] Błąd autoryzacji serwera:', err);
      return {
        success: false,
        message: 'Błąd połączenia z serwerem weryfikacji. Spróbuj ponownie za chwilę.',
      };
    }
  }

  /**
   * Wpisanie kodu od znajomego (walidowane po stronie serwera)
   */
  public async redeemFriendCode(inputCode: string): Promise<{ success: boolean; message: string }> {
    const clean = inputCode.trim().toUpperCase();

    if (!clean) {
      return { success: false, message: 'Podaj kod polecający.' };
    }

    if (clean === this.state.myCode) {
      return { success: false, message: 'Nie możesz użyć własnego kodu polecającego!' };
    }

    try {
      const res = await fetch('/api/referral/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId, friendCode: clean })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Nie udało się aktywować kodu polecającego.',
        };
      }

      // Aktualizacja stanu z serwera
      const rec = data.record;
      this.saveState({
        ...this.state,
        premiumCredits: rec.premiumCredits,
        isVipUnlimited: rec.isVipUnlimited,
        redeemedCodes: rec.redeemedCodes,
        referredByCode: rec.referredByCode,
        lastReferredAt: new Date().toISOString()
      });

      return {
        success: true,
        message: data.message || `Pomyślnie aktywowano kod polecający ${clean}! Otrzymujesz +1 Kredyt na Raport Premium.`,
      };
    } catch (err) {
      console.error('[ReferralService] Błąd realizacji kodu:', err);
      return {
        success: false,
        message: 'Błąd połączenia z serwerem. Spróbuj ponownie.',
      };
    }
  }

  /**
   * Zarejestrowanie nowego polecenia po stronie serwera
   */
  public async addSuccessfulReferral(sourceLabel?: string): Promise<{ isVipNow: boolean }> {
    try {
      const res = await fetch('/api/referral/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId, source: sourceLabel })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.record) {
          const rec = data.record;
          this.saveState({
            ...this.state,
            referralCount: rec.referralCount,
            premiumCredits: rec.premiumCredits,
            isVipUnlimited: rec.isVipUnlimited
          });
          return { isVipNow: Boolean(rec.isVipUnlimited) };
        }
      }
    } catch (err) {
      console.warn('[ReferralService] Błąd rejestracji polecenia na serwerze:', err);
    }

    return { isVipNow: this.state.isVipUnlimited };
  }

  /**
   * Subskrypcja na zmiany stanu poleceń (dla komponentów React)
   */
  public subscribe(callback: (state: ReferralState) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ReferralState>;
      callback(customEvent.detail || this.state);
    };

    window.addEventListener(EVENT_NAME, handler);
    // Wywołaj od razu przy rejestracji
    callback(this.state);

    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  }
}

export const referralService = new ReferralService();
