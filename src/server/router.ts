import { fetchOffersFromPanel, ScrapedOffer } from './scraper.js';

export interface Offer {
  id: string;
  name: string;
  category: string;
  url: string;
  features?: string[];
  params?: Record<string, string>;
  comment?: string;
}

// Cache dla pobranych ofert, aby nie obciążać serwera przy każdym zapytaniu
let cachedOffers: Offer[] = [];
let lastFetchTime = 0;
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 godzina

async function getLiveOffers(): Promise<Offer[]> {
  const now = Date.now();
  
  // Zwróć z cache jeśli są aktualne
  if (cachedOffers.length > 0 && (now - lastFetchTime) < CACHE_DURATION_MS) {
    return cachedOffers;
  }

  try {
    const scraped = await fetchOffersFromPanel();
    
    let offers: Offer[] = [];
    if (scraped.length > 0) {
      offers = scraped.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category, // Zostawiamy oryginalną kategorię do filtrowania
        url: s.url,
        features: s.features,
        params: s.params,
        comment: s.comment
      }));
    }

    // Dodajemy ofertę Revolut ręcznie (Referral)
    const revolutBase = {
      url: "https://revolut.com/referral/?referral-code=tomasz52u!APR1-26-AR&geo-redirect",
      features: ["Ponad 70 mln użytkowników", "Karta wielowalutowa", "Bonus na start"]
    };

    offers.push({
      ...revolutBase,
      id: "revolut-referral-account",
      name: "Revolut - Konto Osobiste",
      category: "konta-osobiste",
      comment: "Konto bez opłat"
    });

    offers.push({
      ...revolutBase,
      id: "revolut-referral-savings",
      name: "Revolut - Konto Oszczędnościowe",
      category: "konta-oszczednosciowe",
      features: ["Wysokie oprocentowanie", "Dostęp do środków 24/7", "Ponad 70 mln użytkowników"],
      comment: "Codzienny zysk"
    });

    offers.push({
      ...revolutBase,
      id: "revolut-referral-investments",
      name: "Revolut - Inwestycje i Lokaty",
      category: "lokaty-i-inwestycje",
      features: ["Inwestuj od 1 EUR", "Akcje, krypto i towary", "Lokaty terminowe"],
      comment: "Tanie inwestowanie"
    });

    if (offers.length > 0) {
      cachedOffers = offers;
      lastFetchTime = now;
      return cachedOffers;
    }
  } catch (error) {
    console.error("Błąd pobierania ofert na żywo:", error);
  }

  return cachedOffers;
}

export async function getOffersForProfile(profile: any): Promise<Offer[]> {
  const allOffers = await getLiveOffers();

  if (allOffers.length === 0) {
    // Fallback awaryjny
    return [{
      id: "gotowkowe-default",
      name: "Kredyt gotówkowy",
      category: "Kredyt",
      url: "https://toomasz-money.oferty-kredytowe.pl/kredyty-gotowkowe"
    }];
  }

  // 1. Ustalamy docelowe kategorie na podstawie celu
  let targetCategories = ['kredyty-gotowkowe'];

  if (profile.goal === 'business') {
    if (profile.businessType === 'loan') {
      targetCategories = ['kredyty-dla-firm'];
      // Jeśli startup, możemy dodać też pożyczki pozabankowe dla firm jako alternatywę
      if (profile.businessLoanType === 'startup' || profile.businessDuration === 'new') {
        targetCategories.push('pozyczki-dla-firm');
      }
    } else if (profile.businessType === 'account') {
      targetCategories = ['konta-dla-firm'];
    } else {
      targetCategories = ['kredyty-dla-firm', 'konta-dla-firm'];
    }
  } else if (profile.goal === 'insurance') {
    if (profile.insuranceType === 'acoc') {
      targetCategories = ['ubezpieczenia-ac-oc'];
    } else {
      targetCategories = ['pozostale-ubezpieczenia'];
    }
  } else if (profile.goal === 'house') {
    targetCategories = ['kredyty-hipoteczne'];
  } else if (profile.goal === 'car') {
    targetCategories = ['kredyty-samochodowe'];
  } else if (profile.goal === 'debt') {
    targetCategories = ['kredyty-konsolidacyjne'];
  } else if (profile.goal === 'account') {
    targetCategories = ['konta-osobiste', 'karty-kredytowe'];
  } else if (profile.goal === 'savings') {
    if (profile.savingsType === 'account') {
      targetCategories = ['konta-oszczednosciowe'];
    } else if (profile.savingsType === 'investments') {
      targetCategories = ['lokaty-i-inwestycje'];
    } else {
      targetCategories = ['konta-oszczednosciowe', 'lokaty-i-inwestycje'];
    }
  }

  // 2. Nadpisujemy kategorie, jeśli klient ma zły BIK
  if (profile.score === 'bad') {
    targetCategories = ['chwilowki', 'pozyczki', 'pozyczki-bankowe-online'];
  }

  // 3. Filtrujemy konkretne oferty z pobranej puli
  let matchedOffers = allOffers.filter(o => targetCategories.includes(o.category));

  // Priorytetyzacja dla firm (Startup)
  if (profile.goal === 'business' && profile.businessLoanType === 'startup') {
    matchedOffers.sort((a, b) => {
      const aLower = (a.name + " " + (a.comment || "")).toLowerCase();
      const bLower = (b.name + " " + (b.comment || "")).toLowerCase();
      const aIsStartup = aLower.includes('startup') || aLower.includes('nowych firm') || aLower.includes('nowa firma');
      const bIsStartup = bLower.includes('startup') || bLower.includes('nowych firm') || bLower.includes('nowa firma');
      
      if (aIsStartup && !bIsStartup) return -1;
      if (!aIsStartup && bIsStartup) return 1;
      return 0;
    });
  }

  // Priorytetyzacja VIP dla high/expert income
  if (profile.income === 'expert' || profile.income === 'high') {
    matchedOffers.sort((a, b) => {
      const aLower = (a.name + " " + (a.comment || "")).toLowerCase();
      const bLower = (b.name + " " + (b.comment || "")).toLowerCase();
      const aIsPremium = aLower.includes('premium') || aLower.includes('vip') || aLower.includes('prestige') || aLower.includes('gold');
      const bIsPremium = bLower.includes('premium') || bLower.includes('vip') || bLower.includes('prestige') || bLower.includes('gold');
      
      if (aIsPremium && !bIsPremium) return -1;
      if (!aIsPremium && bIsPremium) return 1;
      return 0;
    });
  }

  // Priorytetyzacja dla umów cywilnoprawnych i b2b (poszukiwanie ofert dla firm lub elastycznych)
  if (profile.employment === 'b2b' || profile.employment === 'uoo') {
    matchedOffers.sort((a, b) => {
      const aLower = (a.name + " " + (a.comment || "")).toLowerCase();
      const bLower = (b.name + " " + (b.comment || "")).toLowerCase();
      const aIsFlexible = aLower.includes('b2b') || aLower.includes('bez zaświadczeń') || aLower.includes('na oświadczenie');
      const bIsFlexible = bLower.includes('b2b') || bLower.includes('bez zaświadczeń') || bLower.includes('na oświadczenie');
      
      if (aIsFlexible && !bIsFlexible) return -1;
      if (!aIsFlexible && bIsFlexible) return 1;
      return 0;
    });
  }

  if (profile.excludedBank) {
    const excludedList = Array.isArray(profile.excludedBank) ? profile.excludedBank : [profile.excludedBank];
    const excludedNames = excludedList.filter(b => !b.startsWith('Brak')).map(b => b.toLowerCase());
    if (excludedNames.length > 0) {
      matchedOffers = matchedOffers.filter(o => {
        if (!o.name) return true;
        const offerNameLower = o.name.toLowerCase();
        return !excludedNames.some(ex => offerNameLower.includes(ex));
      });
    }
  }

  // Jeśli brak dopasowania, dajemy cokolwiek zbliżonego
  if (matchedOffers.length === 0) {
    matchedOffers = allOffers.filter(o => ['kredyty-gotowkowe', 'chwilowki'].includes(o.category));
  }

  // Funkcje pomocnicze do sortowania
  const getRRSO = (offer: Offer): number => {
    let rrsoStr = '';
    if (offer.params) {
      for (const key of Object.keys(offer.params)) {
        if (key.includes('rrso') || key.includes('stopa')) {
          rrsoStr = offer.params[key];
          break;
        }
      }
    }
    if (!rrsoStr && offer.features) {
      const rrsoFeature = offer.features.find(f => f.toLowerCase().includes('rrso'));
      if (rrsoFeature) rrsoStr = rrsoFeature;
    }
    if (!rrsoStr) return Infinity;
    
    const match = rrsoStr.replace(',', '.').match(/[\d.]+/);
    if (match) {
      return parseFloat(match[0]);
    }
    return Infinity;
  };

  const getDecisionTimeScore = (offer: Offer): number => {
    let score = 0;
    const matchText = ((offer.features?.join(' ') || '') + ' ' + (offer.comment || '') + ' ' + (offer.name || '')).toLowerCase();
    
    if (matchText.includes('minut') || matchText.includes('od ręki') || matchText.includes('natychmiast') || matchText.includes('błyskawiczna')) {
      score += 10;
    } else if (matchText.includes('szybk') || matchText.includes('online')) {
      score += 5;
    }
    return score;
  };

  // 4. Sortujemy oferty, priorytetyzując tańsze RRSO oraz szybszy czas decyzji
  const sortedOffers = [...matchedOffers].sort((a, b) => {
    const rrsoA = getRRSO(a);
    const rrsoB = getRRSO(b);
    
    if (rrsoA !== rrsoB) {
      if (rrsoA === Infinity) return 1; // Brak RRSO na koniec
      if (rrsoB === Infinity) return -1; // Brak RRSO na koniec
      
      // Różnica w RRSO ponad 0.1% decyduje
      if (Math.abs(rrsoA - rrsoB) > 0.1) {
        return rrsoA - rrsoB;
      }
    }
    
    const decisionA = getDecisionTimeScore(a);
    const decisionB = getDecisionTimeScore(b);
    
    if (decisionA !== decisionB) {
      return decisionB - decisionA; // Wyższy wynik decyzji = szybciej -> idzie wyżej
    }
    
    return 0;
  });

  // 5. Zwracamy top 10 najlepiej dopasowane konkretne oferty
  return sortedOffers.slice(0, 10).map(o => ({
    ...o,
    category: o.category.replace(/-/g, ' ').toUpperCase() // Ładne formatowanie nazwy kategorii dla UI
  }));
}

export async function routeOffer(offerId: string): Promise<Offer | undefined> {
  const allOffers = await getLiveOffers();
  return allOffers.find(o => o.id === offerId);
}
