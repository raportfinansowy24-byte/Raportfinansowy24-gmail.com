import { v4 as uuidv4 } from 'uuid';
import { supabase, isSupabaseConfigured, getIsSupabaseAvailable, setSupabaseUnreachable } from '../lib/supabase.js';

export async function trackClick(req: any, offer: any): Promise<string> {
  const clickid = uuidv4();
  
  // Pobieramy IP i User-Agent z requesta
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!getIsSupabaseAvailable()) {
    return clickid;
  }

  try {
    // Zapis do Supabase (tabela clicks)
    const { error } = await supabase
      .from('clicks')
      .insert([
        {
          id: clickid,
          offer_id: offer.id,
          offer_name: offer.name,
          ip_address: ip,
          user_agent: userAgent,
          created_at: new Date().toISOString(),
          status: 'click'
        }
      ]);

    if (error) {
      if (error.message && error.message.includes('fetch failed')) {
        setSupabaseUnreachable();
        console.warn("[Tracker] Pominięto zapis kliknięcia: Błąd połączenia z bazą danych (fetch failed).");
      } else {
        console.error("Błąd zapisu kliknięcia do Supabase:", error.message);
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('fetch failed')) {
      setSupabaseUnreachable();
      console.warn("[Tracker] Pominięto zapis kliknięcia: Błąd połączenia z bazą danych (fetch failed).");
    } else {
      console.error("Wyjątek podczas zapisu do Supabase:", err);
    }
  }

  return clickid;
}

export async function trackConversion(clickid: string, payout: number): Promise<void> {
  if (!getIsSupabaseAvailable()) {
    return;
  }

  try {
    const { error } = await supabase
      .from('clicks')
      .update({ 
        status: 'conversion',
        payout: payout,
        converted_at: new Date().toISOString()
      })
      .eq('id', clickid);

    if (error) {
      if (error.message && error.message.includes('fetch failed')) {
        setSupabaseUnreachable();
        console.warn("[Tracker] Pominięto zapis konwersji: Błąd połączenia z bazą danych (fetch failed).");
      } else {
        console.error("Błąd zapisu konwersji do Supabase:", error.message);
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('fetch failed')) {
      setSupabaseUnreachable();
      console.warn("[Tracker] Pominięto zapis konwersji: Błąd połączenia z bazą danych (fetch failed).");
    } else {
      console.error("Wyjątek podczas zapisu konwersji:", err);
    }
  }
}
