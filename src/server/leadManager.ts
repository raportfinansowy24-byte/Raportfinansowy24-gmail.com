import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { supabase, getIsSupabaseAvailable } from '../lib/supabase.js';

export interface LeadRecord {
  id: string;
  email: string;
  source: string;
  loss_tier?: string;
  loss_amount?: string;
  metadata?: Record<string, any>;
  status: string;
  created_at: string;
}

export interface CompanyMonitorRecord {
  id: string;
  email: string;
  nip: string;
  krs?: string;
  company_name: string;
  plan: string;
  status: string;
  created_at: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const MONITORS_FILE = path.join(DATA_DIR, 'company_monitors.json');

const leadsStore = new Map<string, LeadRecord>();
const monitorsStore = new Map<string, CompanyMonitorRecord>();

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[LeadManager] Błąd tworzenia katalogu .data:', err);
  }
}

function loadAllFromDisk() {
  ensureDir();
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data: Record<string, LeadRecord> = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
      for (const [k, v] of Object.entries(data)) {
        leadsStore.set(k, v);
      }
      console.log(`[LeadManager] Załadowano ${leadsStore.size} leadów z pliku.`);
    }
  } catch (err) {
    console.warn('[LeadManager] Błąd odczytu leads.json:', err);
  }

  try {
    if (fs.existsSync(MONITORS_FILE)) {
      const data: Record<string, CompanyMonitorRecord> = JSON.parse(fs.readFileSync(MONITORS_FILE, 'utf-8'));
      for (const [k, v] of Object.entries(data)) {
        monitorsStore.set(k, v);
      }
      console.log(`[LeadManager] Załadowano ${monitorsStore.size} subskrypcji monitoringu z pliku.`);
    }
  } catch (err) {
    console.warn('[LeadManager] Błąd odczytu company_monitors.json:', err);
  }
}

function saveLeadsToDisk() {
  try {
    ensureDir();
    const obj: Record<string, LeadRecord> = {};
    for (const [k, v] of leadsStore.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(LEADS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[LeadManager] Błąd zapisu leads.json:', err);
  }
}

function saveMonitorsToDisk() {
  try {
    ensureDir();
    const obj: Record<string, CompanyMonitorRecord> = {};
    for (const [k, v] of monitorsStore.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(MONITORS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[LeadManager] Błąd zapisu company_monitors.json:', err);
  }
}

// Inicjalizacja z dysku
loadAllFromDisk();

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmail(email: unknown): string {
  if (typeof email !== 'string') {
    throw new Error('Adres e-mail musi być tekstem');
  }
  const clean = email.trim().toLowerCase();
  if (!clean || clean.length > 254) {
    throw new Error('Nieprawidłowa długość adresu e-mail');
  }
  if (!EMAIL_REGEX.test(clean)) {
    throw new Error('Niepoprawny format adresu e-mail (np. uzytkownik@domena.pl)');
  }
  return clean;
}

export class LeadManager {
  /**
   * Zapis leada z walidacją i trwałym utrwaleniem (Supabase + plik lokalny)
   */
  public async saveLead(payload: {
    email: unknown;
    source?: string;
    lossTier?: string;
    lossAmount?: string;
    metadata?: Record<string, any>;
  }): Promise<LeadRecord> {
    const validatedEmail = validateEmail(payload.email);
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const record: LeadRecord = {
      id,
      email: validatedEmail,
      source: (payload.source || 'financial_funnel').slice(0, 50),
      loss_tier: payload.lossTier ? String(payload.lossTier).slice(0, 50) : undefined,
      loss_amount: payload.lossAmount ? String(payload.lossAmount).slice(0, 50) : undefined,
      metadata: payload.metadata || {},
      status: 'new',
      created_at: createdAt
    };

    // 1. Zapis do pamięci podręcznej i trwałego pliku
    leadsStore.set(id, record);
    saveLeadsToDisk();

    // 2. Próba zapisu do Supabase (tabela leads)
    if (getIsSupabaseAvailable()) {
      try {
        const { error } = await supabase
          .from('leads')
          .insert([{
            id: record.id,
            email: record.email,
            source: record.source,
            loss_tier: record.loss_tier,
            loss_amount: record.loss_amount,
            metadata: record.metadata,
            status: record.status,
            created_at: record.created_at
          }]);

        if (error && !error.message?.includes('schema cache')) {
          console.warn('[LeadManager] Ostrzeżenie zapisu do Supabase leads:', error.message);
        }
      } catch (sbErr) {
        // Cichy failover - plik lokalny jest trwale zapisany
      }
    }

    console.log(`[LeadManager] Zapisano trwale leada ${record.id} (${record.email}, źródło: ${record.source})`);
    return record;
  }

  /**
   * Zapis subskrypcji monitoringu spółki z walidacją NIP i email
   */
  public async saveCompanyMonitor(payload: {
    email: unknown;
    nip?: unknown;
    krs?: unknown;
    companyName?: unknown;
    plan?: unknown;
  }): Promise<CompanyMonitorRecord> {
    const validatedEmail = validateEmail(payload.email);
    
    // Walidacja NIP / Nazwy
    const rawNip = typeof payload.nip === 'string' ? payload.nip.replace(/\D/g, '') : '';
    const rawKrs = typeof payload.krs === 'string' ? payload.krs.replace(/\D/g, '') : '';
    const companyName = typeof payload.companyName === 'string' ? payload.companyName.trim().slice(0, 200) : '';

    if (!rawNip && !companyName && !rawKrs) {
      throw new Error('Wymagane jest podanie NIP, KRS lub nazwy spółki');
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const plan = typeof payload.plan === 'string' ? payload.plan.trim().slice(0, 50) : 'Standard B2B';

    const record: CompanyMonitorRecord = {
      id,
      email: validatedEmail,
      nip: rawNip,
      krs: rawKrs || undefined,
      company_name: companyName || (rawNip ? `NIP: ${rawNip}` : 'Spółka z rejestru'),
      plan,
      status: 'active',
      created_at: createdAt
    };

    // 1. Zapis do pamięci podręcznej i trwałego pliku
    monitorsStore.set(id, record);
    saveMonitorsToDisk();

    // 2. Próba zapisu do Supabase (tabela company_monitors)
    if (getIsSupabaseAvailable()) {
      try {
        const { error } = await supabase
          .from('company_monitors')
          .insert([{
            id: record.id,
            email: record.email,
            nip: record.nip,
            krs: record.krs,
            company_name: record.company_name,
            plan: record.plan,
            status: record.status,
            created_at: record.created_at
          }]);

        if (error && !error.message?.includes('schema cache')) {
          console.warn('[LeadManager] Ostrzeżenie zapisu do Supabase company_monitors:', error.message);
        }
      } catch (sbErr) {
        // Cichy failover do trwałego storage
      }
    }

    console.log(`[LeadManager] Zapisano trwale monitoring spółki ${record.id} (Firma: ${record.company_name}, NIP: ${record.nip}, E-mail: ${record.email})`);
    return record;
  }

  public getLeads(): LeadRecord[] {
    return Array.from(leadsStore.values());
  }

  public getCompanyMonitors(): CompanyMonitorRecord[] {
    return Array.from(monitorsStore.values());
  }
}

export const leadManager = new LeadManager();
