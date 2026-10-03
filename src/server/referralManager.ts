import fs from 'fs';
import path from 'path';
import { supabase, getIsSupabaseAvailable } from '../lib/supabase.js';

export interface UserReferralRecord {
  userId: string;
  myCode: string;
  referralCount: number;
  premiumCredits: number;
  isVipUnlimited: boolean;
  unlockedNips: string[];
  redeemedCodes: string[];
  referredByCode: string | null;
  createdAt: string;
  updatedAt: string;
}

// In-memory store + local file fallback for server-authoritative persistence
const memoryStore = new Map<string, UserReferralRecord>();

// File storage path
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'user_referrals.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[ReferralManager] Nie można utworzyć katalogu .data:', err);
  }
}

function loadFromFile() {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: Record<string, UserReferralRecord> = JSON.parse(content);
      for (const [key, val] of Object.entries(parsed)) {
        memoryStore.set(key, val);
      }
      console.log(`[ReferralManager] Załadowano ${memoryStore.size} rekordów referrali z pliku.`);
    }
  } catch (err) {
    console.warn('[ReferralManager] Błąd odczytu z pliku .data/user_referrals.json:', err);
  }
}

function saveToFile() {
  try {
    ensureDataDir();
    const obj: Record<string, UserReferralRecord> = {};
    for (const [k, v] of memoryStore.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[ReferralManager] Błąd zapisu do pliku .data/user_referrals.json:', err);
  }
}

// Initialize from disk
loadFromFile();

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RF24-${result}`;
}

// Async sync to Supabase if configured and table exists
async function syncToSupabase(record: UserReferralRecord): Promise<void> {
  if (!getIsSupabaseAvailable()) return;

  try {
    const { error } = await supabase
      .from('user_referrals')
      .upsert({
        user_id: record.userId,
        my_code: record.myCode,
        referral_count: record.referralCount,
        premium_credits: record.premiumCredits,
        is_vip_unlimited: record.isVipUnlimited,
        unlocked_nips: record.unlockedNips,
        redeemed_codes: record.redeemedCodes,
        referred_by_code: record.referredByCode,
        updated_at: record.updatedAt
      }, { onConflict: 'user_id' });

    if (error && !error.message?.includes('schema cache')) {
      console.warn('[ReferralManager] Ostrzeżenie Supabase sync:', error.message);
    }
  } catch (err) {
    // Silent failover - memoryStore & file remain authoritative
  }
}

export class ReferralManager {
  /**
   * Pobiera istniejący rekord użytkownika lub tworzy nowy z 1 darmowym kredytem
   */
  public async getOrCreateUser(userId: string, requestedCode?: string): Promise<UserReferralRecord> {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('Nieprawidłowy identyfikator użytkownika (userId)');
    }

    const cleanId = userId.trim();
    let record = memoryStore.get(cleanId);

    if (record) {
      return record;
    }

    // Sprawdź czy kod nie jest zajęty przez innego użytkownika
    let myCode = requestedCode && requestedCode.startsWith('RF24-') ? requestedCode : generateRandomCode();
    for (const other of memoryStore.values()) {
      if (other.myCode === myCode && other.userId !== cleanId) {
        myCode = generateRandomCode();
        break;
      }
    }

    const now = new Date().toISOString();
    record = {
      userId: cleanId,
      myCode,
      referralCount: 0,
      premiumCredits: 1, // 1 darmowy kredyt na start (bezpiecznie kontrolowany przez serwer)
      isVipUnlimited: false,
      unlockedNips: [],
      redeemedCodes: [],
      referredByCode: null,
      createdAt: now,
      updatedAt: now
    };

    memoryStore.set(cleanId, record);
    saveToFile();
    syncToSupabase(record);

    console.log(`[ReferralManager] Nowy użytkownik ${cleanId} zarejestrowany na serwerze z kodem ${myCode}. Kredyty: 1.`);
    return record;
  }

  /**
   * Weryfikuje i bezpiecznie odblokowuje NIP po stronie serwera
   */
  public async unlockReport(userId: string, nip: string): Promise<{ success: boolean; message: string; record: UserReferralRecord }> {
    const record = await this.getOrCreateUser(userId);
    const cleanNip = nip ? nip.replace(/\D/g, '') : '';

    if (!cleanNip || cleanNip.length !== 10) {
      return { success: false, message: 'Podano nieprawidłowy numer NIP spółki.', record };
    }

    // 1. Jeśli użytkownik ma status VIP Unlimited
    if (record.isVipUnlimited) {
      if (!record.unlockedNips.includes(cleanNip)) {
        record.unlockedNips.push(cleanNip);
        record.updatedAt = new Date().toISOString();
        saveToFile();
        syncToSupabase(record);
      }
      return { 
        success: true, 
        message: 'Status VIP aktywny. Raport spółki został zweryfikowany i odblokowany na serwerze.', 
        record 
      };
    }

    // 2. Jeśli NIP był już wcześniej odblokowany dla tego użytkownika
    if (record.unlockedNips.includes(cleanNip)) {
      return { 
        success: true, 
        message: 'Ten raport został już wcześniej odblokowany dla Twojego konta.', 
        record 
      };
    }

    // 3. Sprawdzenie kredytów po stronie serwera (odporne na manipulację DevTools)
    if (record.premiumCredits <= 0) {
      console.warn(`[ReferralManager] Odmowa odblokowania dla ${userId}: Brak kredytów na serwerze (dostępne: ${record.premiumCredits}).`);
      return {
        success: false,
        message: 'Brak dostępnych kredytów Premium na serwerze. Poleć serwis znajomemu, aby zdobyć kolejne kredyty!',
        record
      };
    }

    // 4. Pobierz 1 kredyt i odblokuj NIP
    record.premiumCredits -= 1;
    record.unlockedNips.push(cleanNip);
    record.updatedAt = new Date().toISOString();

    memoryStore.set(userId, record);
    saveToFile();
    syncToSupabase(record);

    console.log(`[ReferralManager] Odblokowano NIP ${cleanNip} dla użytkownika ${userId}. Pozostałe kredyty serwerowe: ${record.premiumCredits}.`);
    return {
      success: true,
      message: 'Pomyślnie odblokowano Raport Premium (autoryzacja serwera potwierdzona).',
      record
    };
  }

  /**
   * Realizacja kodu od znajomego (Redeem)
   */
  public async redeemFriendCode(userId: string, inputCode: string): Promise<{ success: boolean; message: string; record: UserReferralRecord }> {
    const record = await this.getOrCreateUser(userId);
    const cleanCode = (inputCode || '').trim().toUpperCase();

    if (!cleanCode) {
      return { success: false, message: 'Wprowadź kod polecający.', record };
    }

    if (cleanCode === record.myCode) {
      return { success: false, message: 'Nie możesz wykorzystać własnego kodu polecającego!', record };
    }

    if (record.redeemedCodes.includes(cleanCode) || record.referredByCode === cleanCode) {
      return { success: false, message: 'Ten kod został już wcześniej przez Ciebie wykorzystany.', record };
    }

    // Przyznaj użytkownikowi +1 kredyt za dołączenie z polecenia
    record.premiumCredits += 1;
    record.referredByCode = cleanCode;
    record.redeemedCodes.push(cleanCode);
    record.updatedAt = new Date().toISOString();

    // Wyszukaj znajomego, którego kod został użyty, i przyznaj mu nagrodę polecającego (+2 kredyty)
    let friendRecord: UserReferralRecord | null = null;
    for (const user of memoryStore.values()) {
      if (user.myCode === cleanCode) {
        friendRecord = user;
        break;
      }
    }

    if (friendRecord) {
      friendRecord.referralCount += 1;
      friendRecord.premiumCredits += 2;
      if (friendRecord.referralCount >= 3) {
        friendRecord.isVipUnlimited = true;
      }
      friendRecord.updatedAt = new Date().toISOString();
      saveToFile();
      syncToSupabase(friendRecord);
      console.log(`[ReferralManager] Przyznano nagrodę polecającemu ${friendRecord.userId}: +2 kredyty (łącznie poleceń: ${friendRecord.referralCount}).`);
    }

    memoryStore.set(userId, record);
    saveToFile();
    syncToSupabase(record);

    return {
      success: true,
      message: `Pomyślnie aktywowano kod polecający ${cleanCode}! Otrzymujesz +1 Kredyt na Raport Premium.`,
      record
    };
  }

  /**
   * Zarejestrowanie udostępnienia / skutecznego polecenia
   */
  public async recordShare(userId: string, source?: string): Promise<{ isVipNow: boolean; record: UserReferralRecord }> {
    const record = await this.getOrCreateUser(userId);

    record.referralCount += 1;
    record.premiumCredits += 2;
    if (record.referralCount >= 3) {
      record.isVipUnlimited = true;
    }
    record.updatedAt = new Date().toISOString();

    memoryStore.set(userId, record);
    saveToFile();
    syncToSupabase(record);

    console.log(`[ReferralManager] Zarejestrowano polecenie (${source || 'share'}) dla ${userId}. Poleceń: ${record.referralCount}, Kredytów: ${record.premiumCredits}, VIP: ${record.isVipUnlimited}.`);
    return { isVipNow: record.isVipUnlimited, record };
  }

  /**
   * Weryfikacja czy użytkownik ma prawo do wglądu w raport dla danego NIP
   */
  public async verifyAccess(userId: string, nip?: string): Promise<{ hasAccess: boolean; isVip: boolean; unlocked: boolean }> {
    if (!userId) return { hasAccess: false, isVip: false, unlocked: false };
    const record = memoryStore.get(userId.trim());
    if (!record) return { hasAccess: false, isVip: false, unlocked: false };

    if (record.isVipUnlimited) {
      return { hasAccess: true, isVip: true, unlocked: true };
    }

    if (nip) {
      const cleanNip = nip.replace(/\D/g, '');
      const isUnlocked = record.unlockedNips.includes(cleanNip);
      return { hasAccess: isUnlocked, isVip: false, unlocked: isUnlocked };
    }

    return { hasAccess: false, isVip: false, unlocked: false };
  }
}

export const referralManager = new ReferralManager();
