export interface AffiliateOffer {
  category: string;
  title: string;
  description: string;
  keywords: string[];
  affiliate_link: string;
  confidence: number;
}

export interface AffiliateConfig {
  ai_calculator: {
    version: string;
    engine: string;
    description: string;
  };
  offers_source: {
    type: string;
    endpoint: string;
    refresh_interval_minutes: number;
  };
  routing_ai: {
    decision_formula: string;
    exploration_probability: number;
    timing_delay_ms: number;
  };
  learning_layer: {
    reinforcement_learning: boolean;
    memory_storage: string;
    reward_update_rules: {
      click_reward: number;
      epc_signal_reward: number;
      ranking_boost_reward: number;
    };
  };
  fraud_protection: {
    enabled: boolean;
    min_query_length: number;
    spam_keywords: string[];
    velocity_click_limit: {
      window_ms: number;
      max_clicks: number;
    };
    fingerprint_hashing: boolean;
  };
  ux_conversion_flow: {
    chatbot_delay_response_ms: number;
    cta_delay_ms: number;
    social_proof_prompt_enabled: boolean;
    second_offer_loop_enabled: boolean;
  };
  monetization_optimizer: {
    target_metric: string;
    epc_optimizer_enabled: boolean;
    self_learning_ranking: boolean;
  };
  affiliate_tracking: {
    endpoint: string;
    track_fields: string[];
  };
  performance_expectation: {
    epc_target_eur: {
      low: number;
      high: number;
    };
    conversion_rate_percent: {
      low: number;
      high: number;
    };
  };
  offers: AffiliateOffer[];
}

export class AffiliateService {
  private config: AffiliateConfig = {
    "ai_calculator": {
      "version": "FINAL_PRODUCTION_V1",
      "engine": "SINGULARITY_APOCALYPSE_AFFILIATE_CORE",
      "description": "AI financial chatbot affiliate optimizer"
    },
    "offers_source": {
      "type": "static_json",
      "endpoint": "/api/offers",
      "refresh_interval_minutes": 15
    },
    "routing_ai": {
      "decision_formula": "ConversionConfidence + HistoricalRewardSignal + IntentStrength - FraudRisk",
      "exploration_probability": 0.1,
      "timing_delay_ms": 800
    },
    "learning_layer": {
      "reinforcement_learning": true,
      "memory_storage": "localStorage",
      "reward_update_rules": {
        "click_reward": 1,
        "epc_signal_reward": 0.05,
        "ranking_boost_reward": 2
      }
    },
    "fraud_protection": {
      "enabled": true,
      "min_query_length": 3,
      "spam_keywords": [
        "free",
        "earn",
        "casino",
        "viagra",
        "xxx",
        "http",
        "www"
      ],
      "velocity_click_limit": {
        "window_ms": 60000,
        "max_clicks": 5
      },
      "fingerprint_hashing": true
    },
    "ux_conversion_flow": {
      "chatbot_delay_response_ms": 500,
      "cta_delay_ms": 800,
      "social_proof_prompt_enabled": true,
      "second_offer_loop_enabled": true
    },
    "monetization_optimizer": {
      "target_metric": "revenue_per_session",
      "epc_optimizer_enabled": true,
      "self_learning_ranking": true
    },
    "affiliate_tracking": {
      "endpoint": "/api/track-click",
      "track_fields": [
        "category",
        "link",
        "fingerprint",
        "timestamp"
      ]
    },
    "performance_expectation": {
      "epc_target_eur": {
        "low": 1.0,
        "high": 2.5
      },
      "conversion_rate_percent": {
        "low": 3,
        "high": 8
      }
    },
    "offers": [
      {
        "category": "Konto osobiste",
        "title": "Konta osobiste",
        "description": "Najlepsze rachunki bankowe dla osób prywatnych",
        "keywords": ["konto", "rachunek", "bank", "osobiste", "ROR"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/konta-osobiste",
        "confidence": 0.85
      },
      {
        "category": "Konto firmowe",
        "title": "Wallester - Karty wydatkowe dla firm",
        "description": "Darmowe wirtualne i fizyczne karty biznesowe, konto IBAN oraz platforma do kontroli wydatków pracowniczych w jednym miejscu.",
        "keywords": ["firma", "biznes", "konto firmowe", "działalność", "karty pracownicze", "wydatki"],
        "affiliate_link": "https://lowest-prices.eu/a/kJ64SqzLYu9GmA",
        "confidence": 0.95
      },
      {
        "category": "Konto firmowe",
        "title": "Konta Firmowe",
        "description": "Profesjonalne rozwiązania bankowe dla Twojego biznesu",
        "keywords": ["firma", "biznes", "konto firmowe", "działalność", "przedsiębiorca"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/konta-dla-firm",
        "confidence": 0.88
      },
      {
        "category": "Kredyt dla firm",
        "title": "Kredyty dla firm",
        "description": "Finansowanie rozwoju Twojej działalności gospodarczej",
        "keywords": ["kredyt dla firm", "finansowanie biznesu", "inwestycyjny", "obrotowy"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/kredyty-dla-firm",
        "confidence": 0.92
      },
      {
        "category": "Kredyt gotówkowy",
        "title": "Kredyty Gotówkowe",
        "description": "Szybka gotówka na dowolny cel z niskim oprocentowaniem",
        "keywords": ["kredyt", "gotówkowy", "pożyczka", "gotówka", "online"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/kredyty-gotowkowe",
        "confidence": 0.9
      },
      {
        "category": "Kredyt konsolidacyjny",
        "title": "Kredyty konsolidacyjne",
        "description": "Połącz swoje raty w jedną niższą i odciąż domowy budżet",
        "keywords": ["konsolidacja", "raty", "oddłużenie", "jedna rata"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/kredyty-konsolidacyjne",
        "confidence": 0.87
      },
      {
        "category": "Chwilówki",
        "title": "Chwilówki",
        "description": "Błyskawiczne pożyczki krótkoterminowe online",
        "keywords": ["chwilówka", "szybka pożyczka", "bez bik", "na już", "pożyczka online"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/chwilowki",
        "confidence": 0.78
      },
      {
        "category": "Pożyczki",
        "title": "Pożyczki",
        "description": "Szeroki wybór pożyczek pozabankowych i ratalnych",
        "keywords": ["pożyczka", "ratalna", "pozabankowa", "gotówka"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/pozyczki",
        "confidence": 0.82
      },
      {
        "category": "Pożyczki bankowe Online",
        "title": "Pożyczki bankowe Online",
        "description": "Bezpieczne pożyczki prosto z banku bez wychodzenia z domu",
        "keywords": ["pożyczka bankowa", "online", "bank", "bezpieczna pożyczka"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/pozyczki-bankowe-online",
        "confidence": 0.89
      },
      {
        "category": "Karty kredytowe",
        "title": "Karty kredytowe",
        "description": "Karty z limitem kredytowym i atrakcyjnymi bonusami",
        "keywords": ["karta", "kredytowa", "limit", "visa", "mastercard"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/karty-kredytowe",
        "confidence": 0.84
      },
      {
        "category": "Konta oszczędnościowe",
        "title": "Konta oszczędnościowe",
        "description": "Najlepiej oprocentowane konta do pomnażania oszczędności",
        "keywords": ["oszczędności", "procent", "zysk", "odkładanie", "fundusz"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/konta-oszczednosciowe",
        "confidence": 0.86
      },
      {
        "category": "Lokaty i inwestycje",
        "title": "Lokaty i inwestycje",
        "description": "Bezpieczne lokaty terminowe i produkty inwestycyjne",
        "keywords": ["lokata", "inwestycje", "giełda", "kapitał", "fundusze"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/lokaty-i-inwestycje",
        "confidence": 0.88
      },
      {
        "category": "Ubezpieczenia OC/AC",
        "title": "Ubezpieczenia OC/AC",
        "description": "Najtańsze ubezpieczenia komunikacyjne dla Twojego auta",
        "keywords": ["ubezpieczenie", "samochód", "auto", "OC", "AC", "komunikacyjne"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/ubezpieczenia-ac-oc",
        "confidence": 0.83
      },
      {
        "category": "Pozostałe ubezpieczenia",
        "title": "Pozostałe ubezpieczenia",
        "description": "Ubezpieczenia domu, życia i podróży w najlepszych cenach",
        "keywords": ["ubezpieczenie", "dom", "życie", "podróż", "turystyczne", "nieruchomość"],
        "affiliate_link": "https://toomasz-money.oferty-kredytowe.pl/pozostale-ubezpieczenia",
        "confidence": 0.81
      }
    ]
  };

  private clickHistory: number[] = [];
  private rewards: Record<string, number> = {};

  constructor() {
    this.loadRewards();
  }

  private loadRewards() {
    const stored = localStorage.getItem('affiliate_rewards');
    if (stored) {
      this.rewards = JSON.parse(stored);
    }
  }

  private saveRewards() {
    localStorage.setItem('affiliate_rewards', JSON.stringify(this.rewards));
  }

  isFraud(text: string): boolean {
    if (!this.config.fraud_protection.enabled) return false;
    
    if (text.length < this.config.fraud_protection.min_query_length) return true;
    
    const lowerText = text.toLowerCase();
    if (this.config.fraud_protection.spam_keywords.some(k => lowerText.includes(k))) return true;

    // Velocity check
    const now = Date.now();
    const window = this.config.fraud_protection.velocity_click_limit.window_ms;
    const recentClicks = this.clickHistory.filter(t => now - t < window);
    if (recentClicks.length >= this.config.fraud_protection.velocity_click_limit.max_clicks) return true;

    return false;
  }

  matchOffer(text: string): AffiliateOffer | null {
    if (this.isFraud(text)) return null;

    const lowerText = text.toLowerCase();
    const scoredOffers = this.config.offers.map(offer => {
      let intentStrength = 0;
      offer.keywords.forEach(k => {
        if (lowerText.includes(k.toLowerCase())) intentStrength += 0.2;
      });

      const historicalReward = this.rewards[offer.affiliate_link] || 0;
      
      // Decision Formula: ConversionConfidence + HistoricalRewardSignal + IntentStrength - FraudRisk
      // We simplify FraudRisk to 0 here because we already checked isFraud
      const score = offer.confidence + historicalReward + intentStrength;
      
      return { offer, score };
    });

    // Exploration: sometimes pick a random one
    if (Math.random() < this.config.routing_ai.exploration_probability) {
      return this.config.offers[Math.floor(Math.random() * this.config.offers.length)];
    }

    scoredOffers.sort((a, b) => b.score - a.score);
    const best = scoredOffers[0];
    
    return best && best.score > 0.5 ? best.offer : null;
  }

  trackClick(offer: AffiliateOffer) {
    this.clickHistory.push(Date.now());
    
    // Update rewards (Reinforcement Learning)
    const link = offer.affiliate_link;
    const update = this.config.learning_layer.reward_update_rules.click_reward * 0.1; // Small increment
    this.rewards[link] = (this.rewards[link] || 0) + update;
    this.saveRewards();

    // Real tracking call (mocking the endpoint as per instructions to build real integrations, 
    // but since I don't have a backend yet, I'll just log it or try to fetch if I add a backend later)
    console.log('Tracking click:', {
      category: offer.category,
      link: offer.affiliate_link,
      timestamp: new Date().toISOString()
    });
    
    // Attempt real fetch to the tracking endpoint
    fetch(this.config.affiliate_tracking.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: offer.category,
        link: offer.affiliate_link,
        timestamp: Date.now()
      })
    }).catch(() => {
      // Ignore errors if endpoint doesn't exist yet
    });
  }

  getConfig() {
    return this.config;
  }
}
