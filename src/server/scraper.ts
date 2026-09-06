import * as cheerio from "cheerio";

const categories = [
  "kredyty-gotowkowe",
  "kredyty-konsolidacyjne",
  "kredyty-hipoteczne",
  "kredyty-samochodowe",
  "chwilowki",
  "pozyczki",
  "pozyczki-bankowe-online",
  "konta-osobiste",
  "karty-kredytowe",
  "konta-oszczednosciowe",
  "lokaty-i-inwestycje",
  "ubezpieczenia-ac-oc",
  "pozostale-ubezpieczenia",
  "konta-dla-firm",
  "kredyty-dla-firm"
];

export interface ScrapedOffer {
  id: string;
  name: string;
  url: string;
  category: string;
  features?: string[];
  params?: Record<string, string>;
  comment?: string;
}

function generateContextualComment(category: string, name: string, features: string[]): string {
  const nameLower = name.toLowerCase();
  const featsAll = features.join(' ').toLowerCase();

  if (category === 'konta-osobiste' || category === 'konta-dla-firm') {
    if (nameLower.includes('student') || nameLower.includes('młod') || featsAll.includes('student')) return "Dla studentów";
    if (featsAll.includes('premi') || featsAll.includes('bonus')) return "Wysoka premia";
    if (featsAll.includes('darm') || featsAll.includes('0 zł')) return "Konto 0 zł";
    if (category === 'konta-dla-firm') return "Dla biznesu";
    return "Top wybór";
  }

  if (category === 'chwilowki' || category === 'pozyczki' || category === 'pozyczki-bankowe-online') {
    if (nameLower.includes('bez') || featsAll.includes('bik') || featsAll.includes('krd') || featsAll.includes('bez zaświadczeń')) return "Lepsza szansa (BIK)";
    if (featsAll.includes('0%') || featsAll.includes('za darmo') || nameLower.includes('darmo')) return "Pierwsza za darmo";
    if (featsAll.includes('minut') || featsAll.includes('szyb') || featsAll.includes('od ręki')) return "Błyskawiczna wypłata";
    return "Minimum formalności";
  }

  if (category.includes('kredyt')) {
    if (category === 'kredyty-hipoteczne') return "Na własne M";
    if (category === 'kredyty-konsolidacyjne') return "Jedna rata";
    if (featsAll.includes('konsolid') || nameLower.includes('konsolid')) return "Jedna rata";
    if (featsAll.includes('online')) return "W 100% online";
    return "Top wybór";
  }

  if (category.includes('oszczednosci') || category.includes('lokat')) {
    return "Pewny zysk";
  }

  return "Sprawdzona oferta";
}

export async function fetchOffersFromPanel(): Promise<ScrapedOffer[]> {
  let allOffers: ScrapedOffer[] = [];
  
  console.log("[Scraper] Rozpoczynam pobieranie ofert z API toomasz-money.oferty-kredytowe.pl...");

  for (const cat of categories) {
    try {
      // Krok 1: Pobierz stronę kategorii, aby znaleźć poprawny klucz API (data-key)
      const pageUrl = `https://toomasz-money.oferty-kredytowe.pl/${cat}`;
      const pageRes = await fetch(pageUrl);
      
      if (!pageRes.ok) {
        console.warn(`[Scraper] Błąd pobierania strony kategorii ${cat}: ${pageRes.status}`);
        continue;
      }
      
      const pageHtml = await pageRes.text();
      const $page = cheerio.load(pageHtml);
      const dataKey = $page('#category-campaigns').attr('data-key');
      
      if (!dataKey) {
        console.warn(`[Scraper] Nie znaleziono data-key dla kategorii ${cat}`);
        continue;
      }

      // Krok 2: Pobierz oferty z endpointu API używając dataKey
      const apiUrl = `https://toomasz-money.oferty-kredytowe.pl/get-category-campaigns/${dataKey}`;
      const apiRes = await fetch(apiUrl);
      
      if (!apiRes.ok) {
        console.warn(`[Scraper] Błąd pobierania API dla ${dataKey}: ${apiRes.status}`);
        continue;
      }
      
      let json;
      try {
        json = await apiRes.json();
      } catch (e) {
        console.warn(`[Scraper] Błąd parsowania JSON dla ${cat}:`, e);
        continue;
      }

      if (!Array.isArray(json)) {
        console.log(`[Scraper] Kategoria ${cat} (${dataKey}) nie zwróciła tablicy JSON.`);
        continue;
      }

      console.log(`[Scraper] Kategoria ${cat} (${dataKey}): otrzymano ${json.length} elementów.`);

      json.forEach((htmlString, i) => {
        const $ = cheerio.load(htmlString);
        
        // Szukamy nazwy w tekście linku lub w atrybucie data-title przycisku
        let name = $('.product__name a').text().trim();
        if (!name) {
          name = $('.product__legal').attr('data-title')?.trim() || '';
        }
        
        const link = $('a[data-href]').first().attr('data-href');

        // Ekstrakcja dodatkowych parametrów
        const features: string[] = [];
        $('.product__features li').each((_, el) => {
          features.push($(el).text().trim());
        });

        // Ekstrakcja RRSO i innych parametrów z tabeli parametrów
        const params: Record<string, string> = {};
        $('.product__params .param').each((_, el) => {
          const label = $(el).find('.param__label').text().trim().toLowerCase();
          const value = $(el).find('.param__value').text().trim();
          if (label && value) params[label] = value;
        });

        if (name && link) {
          const id = `${cat}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`;
          const finalComment = generateContextualComment(cat, name, features);
          
          allOffers.push({
            id,
            name,
            url: link,
            category: cat,
            features: features.length > 0 ? features : undefined,
            params: Object.keys(params).length > 0 ? params : undefined,
            comment: finalComment
          });
        }
      });
    } catch (e) {
      console.error(`[Scraper] Błąd podczas przetwarzania kategorii ${cat}:`, e);
    }
  }
  
  console.log(`[Scraper] Zakończono. Pobrano łącznie ${allOffers.length} ofert.`);
  return allOffers;
}

