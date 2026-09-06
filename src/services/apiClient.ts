export interface Offer {
  id: string;
  name: string;
  category: string;
  url: string;
  features?: string[];
  params?: Record<string, string>;
  comment?: string;
}

const cache = new Map<string, { timestamp: number, data: any }>();
const CACHE_DURATION_MS = 1000 * 60 * 5; // 5 minut cache'u po stronie klienta

export async function fetchOffersFromApi(filterData: Record<string, any> = {}): Promise<any[]> {
  const cacheKey = JSON.stringify(filterData);
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (cached && (now - cached.timestamp < CACHE_DURATION_MS)) {
    console.log('[Cache] Zwracam oferty z cache:', cacheKey);
    return cached.data;
  }

  try {
    const response = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filterData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Zapisz do cache
    cache.set(cacheKey, { timestamp: now, data });
    
    return data;
  } catch (error) {
    console.error("Błąd pobierania ofert z API:", error);
    // Próba zwrócenia nieaktualnego cache jako fallback
    if (cached) {
      console.warn('[Cache] API błąd. Zwracam przestarzały cache jako fallback:', cacheKey);
      return cached.data;
    }
    return [];
  }
}
