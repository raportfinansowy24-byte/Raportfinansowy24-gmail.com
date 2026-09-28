/**
 * System poleceń (Referral & Viral Growth Program) dla RaportFinansowy24
 * Umożliwia generowanie unikalnych kodów polecających, naliczanie kredytów
 * na Raporty Premium oraz odblokowywanie statusu VIP Unlimited.
 */

export interface ReferralState {
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
const EVENT_NAME = 'rf24_referral_changed';

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RF24-${result}`;
}

const DEFAULT_STATE: ReferralState = {
  myCode: '',
  referralCount: 0,
  premiumCredits: 1, // 1 darmowy kredyt na start dla każdego
  isVipUnlimited: false,
  unlockedNips: [],
  redeemedCodes: [],
  referredByCode: null,
  lastReferredAt: null,
};

class ReferralService {
  private state: ReferralState;

  constructor() {
    this.state = this.loadState();
    this.checkForUrlReferral();
  }

  private loadState(): ReferralState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.myCode) {
          parsed.myCode = generateRandomCode();
        }
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (e) {
      console.error('Błąd odczytu stanu poleceń:', e);
    }

    const newState: ReferralState = {
      ...DEFAULT_STATE,
      myCode: generateRandomCode(),
    };
    this.saveState(newState);
    return newState;
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
   * Wykrywa parametr ?ref=KOD lub ?polecenie=KOD w adresie URL
   */
  private checkForUrlReferral() {
    if (typeof window === 'undefined') return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref') || urlParams.get('polecenie');

      if (refCode && refCode.trim().length > 0) {
        const cleanCode = refCode.trim().toUpperCase();

        // Jeśli to nie jest własny kod i nie był jeszcze aktywowany
        if (cleanCode !== this.state.myCode && !this.state.referredByCode) {
          this.applyReferralBonus(cleanCode, 'url');
        }
      }
    } catch (err) {
      console.error('Błąd przetwarzania parametru polecenia:', err);
    }
  }

  public getState(): ReferralState {
    return { ...this.state };
  }

  public getReferralLink(): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://raportfinansowy24.pl';
    return `${origin}/?ref=${this.state.myCode}`;
  }

  /**
   * Sprawdza, czy użytkownik ma dostęp do Raportu Premium (dla konkretnego NIP lub nielimitowany)
   */
  public hasPremiumAccess(nip?: string): boolean {
    if (this.state.isVipUnlimited) return true;
    if (nip && this.state.unlockedNips.includes(nip.replace(/\D/g, ''))) return true;
    return false;
  }

  /**
   * Odblokowuje raport premium dla wskazanego NIP za 1 kredyt
   */
  public unlockReportForNip(nip: string): { success: boolean; message: string } {
    const cleanNip = nip.replace(/\D/g, '');

    if (this.state.isVipUnlimited) {
      if (!this.state.unlockedNips.includes(cleanNip)) {
        this.saveState({
          ...this.state,
          unlockedNips: [...this.state.unlockedNips, cleanNip],
        });
      }
      return { success: true, message: 'Posiadasz nielimitowany status VIP! Raport odblokowany.' };
    }

    if (this.state.unlockedNips.includes(cleanNip)) {
      return { success: true, message: 'Ten raport został już wcześniej odblokowany.' };
    }

    if (this.state.premiumCredits <= 0) {
      return {
        success: false,
        message: 'Brak dostępnych kredytów Premium. Poleć serwis znajomemu, aby zyskać kolejne kredyty!',
      };
    }

    const updatedCredits = this.state.premiumCredits - 1;
    const updatedNips = [...this.state.unlockedNips, cleanNip];

    this.saveState({
      ...this.state,
      premiumCredits: updatedCredits,
      unlockedNips: updatedNips,
    });

    return {
      success: true,
      message: 'Pomyślnie odblokowano Raport Premium! Pobierz pełną analizę w PDF.',
    };
  }

  /**
   * Wpisanie kodu od znajomego ręcznie
   */
  public redeemFriendCode(inputCode: string): { success: boolean; message: string } {
    const clean = inputCode.trim().toUpperCase();

    if (!clean) {
      return { success: false, message: 'Podaj kod polecający.' };
    }

    if (clean === this.state.myCode) {
      return { success: false, message: 'Nie możesz użyć własnego kodu polecającego!' };
    }

    if (this.state.redeemedCodes.includes(clean) || this.state.referredByCode === clean) {
      return { success: false, message: 'Ten kod polecający został już przez Ciebie wykorzystany.' };
    }

    return this.applyReferralBonus(clean, 'manual');
  }

  private applyReferralBonus(code: string, source: 'url' | 'manual'): { success: boolean; message: string } {
    const updatedCredits = this.state.premiumCredits + 1; // +1 darmowy raport za dołączenie z polecenia
    const updatedRedeemed = [...this.state.redeemedCodes, code];

    this.saveState({
      ...this.state,
      premiumCredits: updatedCredits,
      referredByCode: code,
      redeemedCodes: updatedRedeemed,
      lastReferredAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Pomyślnie aktywowano kod polecający ${code}! Otrzymujesz +1 Kredyt na Raport Premium.`,
    };
  }

  /**
   * Symulacja lub zarejestrowanie nowego polecenia (np. gdy ktoś udostępni link lub zarejestruje się)
   * Umożliwia użytkownikom zdobywanie kolejnych kredytów i odblokowanie VIP
   */
  public addSuccessfulReferral(sourceLabel?: string): { isVipNow: boolean } {
    const newCount = this.state.referralCount + 1;
    const newCredits = this.state.premiumCredits + 2; // +2 raporty za każde polecenie!
    const isVip = newCount >= 3; // 3 polecenia = nielimitowany dostęp VIP na zawsze!

    this.saveState({
      ...this.state,
      referralCount: newCount,
      premiumCredits: newCredits,
      isVipUnlimited: isVip,
    });

    return { isVipNow: isVip };
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
