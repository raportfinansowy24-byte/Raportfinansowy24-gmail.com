import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { supabase, getIsSupabaseAvailable } from '../lib/supabase.js';

export interface ClickRecord {
  id: string; // clickid (UUIDv4)
  offer_id: string;
  offer_name: string;
  source: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  status: 'click' | 'conversion';
  payout?: number | null;
  converted_at?: string | null;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const CLICKS_FILE = path.join(DATA_DIR, 'clicks.json');

const clicksStore = new Map<string, ClickRecord>();

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[Tracker] Błąd tworzenia katalogu .data:', err);
  }
}

function loadClicksFromDisk() {
  ensureDir();
  try {
    if (fs.existsSync(CLICKS_FILE)) {
      const data: Record<string, ClickRecord> = JSON.parse(fs.readFileSync(CLICKS_FILE, 'utf-8'));
      for (const [k, v] of Object.entries(data)) {
        clicksStore.set(k, v);
      }
      console.log(`[Tracker] Załadowano ${clicksStore.size} kliknięć afiliacyjnych z pliku.`);
    }
  } catch (err) {
    console.warn('[Tracker] Błąd odczytu clicks.json:', err);
  }
}

function saveClicksToDisk() {
  try {
    ensureDir();
    const obj: Record<string, ClickRecord> = {};
    for (const [k, v] of clicksStore.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(CLICKS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Tracker] Błąd zapisu clicks.json:', err);
  }
}

loadClicksFromDisk();

/**
 * Rejestruje unikalne kliknięcie oferty z zabezpieczeniem przed manipulacją
 */
export async function trackClick(req: any, offer: any, source?: string): Promise<string> {
  const clickid = uuidv4();
  
  // Pobieramy IP i User-Agent z requesta
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const cleanSource = (source || 'raport-finansowy').slice(0, 50);

  const record: ClickRecord = {
    id: clickid,
    offer_id: offer.id,
    offer_name: offer.name,
    source: cleanSource,
    ip_address: typeof ip === 'string' ? ip.split(',')[0].trim() : 'unknown',
    user_agent: typeof userAgent === 'string' ? userAgent.slice(0, 300) : 'unknown',
    created_at: new Date().toISOString(),
    status: 'click',
    payout: null,
    converted_at: null
  };

  // 1. Zapis trwały w pamięci i na dysku
  clicksStore.set(clickid, record);
  saveClicksToDisk();

  // 2. Próba asynchronicznego zapisu w Supabase
  if (getIsSupabaseAvailable()) {
    try {
      const { error } = await supabase
        .from('clicks')
        .insert([{
          id: record.id,
          offer_id: record.offer_id,
          offer_name: record.offer_name,
          source: record.source,
          ip_address: record.ip_address,
          user_agent: record.user_agent,
          created_at: record.created_at,
          status: record.status
        }]);

      if (error && !error.message?.includes('schema cache')) {
        console.warn('[Tracker] Ostrzeżenie zapisu do Supabase clicks:', error.message);
      }
    } catch (err) {
      // Cichy failover do trwałego storage lokalnego
    }
  }

  console.log(`[Tracker] Zarejestrowano kliknięcie: id=${clickid}, oferta=${offer.name} (${offer.id}), źródło=${cleanSource}`);
  return clickid;
}

export interface ConversionResult {
  success: boolean;
  status: number;
  message: string;
  clickid?: string;
  payout?: number;
  offerId?: string;
}

/**
 * Bezpieczna rejestracja konwersji postback z sieci afiliacyjnej
 */
export async function trackConversion(
  clickidRaw: unknown, 
  payoutRaw: unknown, 
  secretProvided?: string
): Promise<ConversionResult> {
  // 1. Weryfikacja tokena bezpieczeństwa (jeśli POSTBACK_SECRET jest ustawiony w środowisku)
  const envSecret = process.env.POSTBACK_SECRET || process.env.AFFILIATE_WEBHOOK_SECRET;
  if (envSecret && envSecret.trim()) {
    if (!secretProvided || secretProvided.trim() !== envSecret.trim()) {
      console.warn(`[Tracker Postback] Odrzucono konwersję: Nieprawidłowy lub brak sekretu autoryzacyjnego postbacku.`);
      return {
        success: false,
        status: 401,
        message: "Odmowa dostępu: Nieprawidłowy token autoryzacyjny webhooka (secret)"
      };
    }
  }

  // 2. Weryfikacja formatu clickid
  if (!clickidRaw || typeof clickidRaw !== 'string' || !clickidRaw.trim()) {
    return {
      success: false,
      status: 400,
      message: "Brak lub nieprawidłowy identyfikator kliknięcia (clickid / epi)"
    };
  }

  const clickid = clickidRaw.trim();
  const existingClick = clicksStore.get(clickid);

  // 3. Weryfikacja istnienia kliknięcia (ochrona przed fałszywymi konwersjami)
  if (!existingClick) {
    console.warn(`[Tracker Postback] Odrzucono próbę konwersji dla nieistniejącego clickid: ${clickid}`);
    return {
      success: false,
      status: 404,
      message: `Nie znaleziono zarejestrowanego kliknięcia dla identyfikatora: ${clickid}`
    };
  }

  // 4. Bezpieczna konwersja wartości payout (obsługa przecinków, zer, walidacja liczbowa)
  let payoutNum = 0;
  if (payoutRaw !== undefined && payoutRaw !== null && payoutRaw !== '') {
    const cleanedPayout = String(payoutRaw).trim().replace(',', '.');
    const parsed = parseFloat(cleanedPayout);
    if (isNaN(parsed) || parsed < 0) {
      return {
        success: false,
        status: 400,
        message: "Nieprawidłowa wartość prowizji (payout musi być dodatnią liczbą)"
      };
    }
    payoutNum = Math.round(parsed * 100) / 100;
  }

  // 5. Aktualizacja rekordu
  const now = new Date().toISOString();
  existingClick.status = 'conversion';
  existingClick.payout = payoutNum;
  existingClick.converted_at = now;

  clicksStore.set(clickid, existingClick);
  saveClicksToDisk();

  // 6. Aktualizacja w Supabase
  if (getIsSupabaseAvailable()) {
    try {
      const { error } = await supabase
        .from('clicks')
        .update({
          status: 'conversion',
          payout: payoutNum,
          converted_at: now
        })
        .eq('id', clickid);

      if (error && !error.message?.includes('schema cache')) {
        console.warn('[Tracker] Ostrzeżenie aktualizacji w Supabase clicks:', error.message);
      }
    } catch (err) {
      // Cichy failover
    }
  }

  console.log(`[Tracker Postback] Potwierdzono konwersję: id=${clickid}, oferta=${existingClick.offer_name}, prowizja=${payoutNum} PLN`);
  return {
    success: true,
    status: 200,
    message: "Konwersja zarejestrowana pomyślnie",
    clickid,
    payout: payoutNum,
    offerId: existingClick.offer_id
  };
}

export function getClicks(): ClickRecord[] {
  return Array.from(clicksStore.values());
}
