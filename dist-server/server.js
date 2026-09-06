// server.ts
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";

// src/server/scraper.js
import * as cheerio from "cheerio";
var categories = [
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
function generateContextualComment(category, name, features) {
  const nameLower = name.toLowerCase();
  const featsAll = features.join(" ").toLowerCase();
  if (category === "konta-osobiste" || category === "konta-dla-firm") {
    if (nameLower.includes("student") || nameLower.includes("m\u0142od") || featsAll.includes("student"))
      return "Dla student\xF3w";
    if (featsAll.includes("premi") || featsAll.includes("bonus"))
      return "Wysoka premia";
    if (featsAll.includes("darm") || featsAll.includes("0 z\u0142"))
      return "Konto 0 z\u0142";
    if (category === "konta-dla-firm")
      return "Dla biznesu";
    return "Top wyb\xF3r";
  }
  if (category === "chwilowki" || category === "pozyczki" || category === "pozyczki-bankowe-online") {
    if (nameLower.includes("bez") || featsAll.includes("bik") || featsAll.includes("krd") || featsAll.includes("bez za\u015Bwiadcze\u0144"))
      return "Lepsza szansa (BIK)";
    if (featsAll.includes("0%") || featsAll.includes("za darmo") || nameLower.includes("darmo"))
      return "Pierwsza za darmo";
    if (featsAll.includes("minut") || featsAll.includes("szyb") || featsAll.includes("od r\u0119ki"))
      return "B\u0142yskawiczna wyp\u0142ata";
    return "Minimum formalno\u015Bci";
  }
  if (category.includes("kredyt")) {
    if (category === "kredyty-hipoteczne")
      return "Na w\u0142asne M";
    if (category === "kredyty-konsolidacyjne")
      return "Jedna rata";
    if (featsAll.includes("konsolid") || nameLower.includes("konsolid"))
      return "Jedna rata";
    if (featsAll.includes("online"))
      return "W 100% online";
    return "Top wyb\xF3r";
  }
  if (category.includes("oszczednosci") || category.includes("lokat")) {
    return "Pewny zysk";
  }
  return "Sprawdzona oferta";
}
async function fetchOffersFromPanel() {
  let allOffers = [];
  console.log("[Scraper] Rozpoczynam pobieranie ofert z API toomasz-money.oferty-kredytowe.pl...");
  for (const cat of categories) {
    try {
      const pageUrl = `https://toomasz-money.oferty-kredytowe.pl/${cat}`;
      const pageRes = await fetch(pageUrl);
      if (!pageRes.ok) {
        console.warn(`[Scraper] B\u0142\u0105d pobierania strony kategorii ${cat}: ${pageRes.status}`);
        continue;
      }
      const pageHtml = await pageRes.text();
      const $page = cheerio.load(pageHtml);
      const dataKey = $page("#category-campaigns").attr("data-key");
      if (!dataKey) {
        console.warn(`[Scraper] Nie znaleziono data-key dla kategorii ${cat}`);
        continue;
      }
      const apiUrl = `https://toomasz-money.oferty-kredytowe.pl/get-category-campaigns/${dataKey}`;
      const apiRes = await fetch(apiUrl);
      if (!apiRes.ok) {
        console.warn(`[Scraper] B\u0142\u0105d pobierania API dla ${dataKey}: ${apiRes.status}`);
        continue;
      }
      let json;
      try {
        json = await apiRes.json();
      } catch (e) {
        console.warn(`[Scraper] B\u0142\u0105d parsowania JSON dla ${cat}:`, e);
        continue;
      }
      if (!Array.isArray(json)) {
        console.log(`[Scraper] Kategoria ${cat} (${dataKey}) nie zwr\xF3ci\u0142a tablicy JSON.`);
        continue;
      }
      console.log(`[Scraper] Kategoria ${cat} (${dataKey}): otrzymano ${json.length} element\xF3w.`);
      json.forEach((htmlString, i) => {
        const $ = cheerio.load(htmlString);
        let name = $(".product__name a").text().trim();
        if (!name) {
          name = $(".product__legal").attr("data-title")?.trim() || "";
        }
        const link = $("a[data-href]").first().attr("data-href");
        const features = [];
        $(".product__features li").each((_, el) => {
          features.push($(el).text().trim());
        });
        const params = {};
        $(".product__params .param").each((_, el) => {
          const label = $(el).find(".param__label").text().trim().toLowerCase();
          const value = $(el).find(".param__value").text().trim();
          if (label && value)
            params[label] = value;
        });
        if (name && link) {
          const id = `${cat}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`;
          const finalComment = generateContextualComment(cat, name, features);
          allOffers.push({
            id,
            name,
            url: link,
            category: cat,
            features: features.length > 0 ? features : void 0,
            params: Object.keys(params).length > 0 ? params : void 0,
            comment: finalComment
          });
        }
      });
    } catch (e) {
      console.error(`[Scraper] B\u0142\u0105d podczas przetwarzania kategorii ${cat}:`, e);
    }
  }
  console.log(`[Scraper] Zako\u0144czono. Pobrano \u0142\u0105cznie ${allOffers.length} ofert.`);
  return allOffers;
}

// src/server/router.js
var cachedOffers = [];
var lastFetchTime = 0;
var CACHE_DURATION_MS = 1e3 * 60 * 60;
async function getLiveOffers() {
  const now = Date.now();
  if (cachedOffers.length > 0 && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedOffers;
  }
  try {
    const scraped = await fetchOffersFromPanel();
    let offers = [];
    if (scraped.length > 0) {
      offers = scraped.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        // Zostawiamy oryginalną kategorię do filtrowania
        url: s.url,
        features: s.features,
        params: s.params,
        comment: s.comment
      }));
    }
    const revolutBase = {
      url: "https://revolut.com/referral/?referral-code=tomasz52u!APR1-26-AR&geo-redirect",
      features: ["Ponad 70 mln u\u017Cytkownik\xF3w", "Karta wielowalutowa", "Bonus na start"]
    };
    offers.push({
      ...revolutBase,
      id: "revolut-referral-account",
      name: "Revolut - Konto Osobiste",
      category: "konta-osobiste",
      comment: "Konto bez op\u0142at"
    });
    offers.push({
      ...revolutBase,
      id: "revolut-referral-savings",
      name: "Revolut - Konto Oszcz\u0119dno\u015Bciowe",
      category: "konta-oszczednosciowe",
      features: ["Wysokie oprocentowanie", "Dost\u0119p do \u015Brodk\xF3w 24/7", "Ponad 70 mln u\u017Cytkownik\xF3w"],
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
    console.error("B\u0142\u0105d pobierania ofert na \u017Cywo:", error);
  }
  return cachedOffers;
}
async function getOffersForProfile(profile) {
  const allOffers = await getLiveOffers();
  if (allOffers.length === 0) {
    return [{
      id: "gotowkowe-default",
      name: "Kredyt got\xF3wkowy",
      category: "Kredyt",
      url: "https://toomasz-money.oferty-kredytowe.pl/kredyty-gotowkowe"
    }];
  }
  let targetCategories = ["kredyty-gotowkowe"];
  if (profile.goal === "business") {
    if (profile.businessType === "loan") {
      targetCategories = ["kredyty-dla-firm"];
      if (profile.businessLoanType === "startup" || profile.businessDuration === "new") {
        targetCategories.push("pozyczki-dla-firm");
      }
    } else if (profile.businessType === "account") {
      targetCategories = ["konta-dla-firm"];
    } else {
      targetCategories = ["kredyty-dla-firm", "konta-dla-firm"];
    }
  } else if (profile.goal === "insurance") {
    if (profile.insuranceType === "acoc") {
      targetCategories = ["ubezpieczenia-ac-oc"];
    } else {
      targetCategories = ["pozostale-ubezpieczenia"];
    }
  } else if (profile.goal === "house") {
    targetCategories = ["kredyty-hipoteczne"];
  } else if (profile.goal === "car") {
    targetCategories = ["kredyty-samochodowe"];
  } else if (profile.goal === "debt") {
    targetCategories = ["kredyty-konsolidacyjne"];
  } else if (profile.goal === "account") {
    targetCategories = ["konta-osobiste", "karty-kredytowe"];
  } else if (profile.goal === "savings") {
    if (profile.savingsType === "account") {
      targetCategories = ["konta-oszczednosciowe"];
    } else if (profile.savingsType === "investments") {
      targetCategories = ["lokaty-i-inwestycje"];
    } else {
      targetCategories = ["konta-oszczednosciowe", "lokaty-i-inwestycje"];
    }
  }
  if (profile.score === "bad") {
    targetCategories = ["chwilowki", "pozyczki", "pozyczki-bankowe-online"];
  }
  let matchedOffers = allOffers.filter((o) => targetCategories.includes(o.category));
  if (profile.goal === "business" && profile.businessLoanType === "startup") {
    matchedOffers.sort((a, b) => {
      const aLower = (a.name + " " + (a.comment || "")).toLowerCase();
      const bLower = (b.name + " " + (b.comment || "")).toLowerCase();
      const aIsStartup = aLower.includes("startup") || aLower.includes("nowych firm") || aLower.includes("nowa firma");
      const bIsStartup = bLower.includes("startup") || bLower.includes("nowych firm") || bLower.includes("nowa firma");
      if (aIsStartup && !bIsStartup)
        return -1;
      if (!aIsStartup && bIsStartup)
        return 1;
      return 0;
    });
  }
  if (profile.income === "expert" || profile.income === "high") {
    matchedOffers.sort((a, b) => {
      const aLower = (a.name + " " + (a.comment || "")).toLowerCase();
      const bLower = (b.name + " " + (b.comment || "")).toLowerCase();
      const aIsPremium = aLower.includes("premium") || aLower.includes("vip") || aLower.includes("prestige") || aLower.includes("gold");
      const bIsPremium = bLower.includes("premium") || bLower.includes("vip") || bLower.includes("prestige") || bLower.includes("gold");
      if (aIsPremium && !bIsPremium)
        return -1;
      if (!aIsPremium && bIsPremium)
        return 1;
      return 0;
    });
  }
  if (profile.employment === "b2b" || profile.employment === "uoo") {
    matchedOffers.sort((a, b) => {
      const aLower = (a.name + " " + (a.comment || "")).toLowerCase();
      const bLower = (b.name + " " + (b.comment || "")).toLowerCase();
      const aIsFlexible = aLower.includes("b2b") || aLower.includes("bez za\u015Bwiadcze\u0144") || aLower.includes("na o\u015Bwiadczenie");
      const bIsFlexible = bLower.includes("b2b") || bLower.includes("bez za\u015Bwiadcze\u0144") || bLower.includes("na o\u015Bwiadczenie");
      if (aIsFlexible && !bIsFlexible)
        return -1;
      if (!aIsFlexible && bIsFlexible)
        return 1;
      return 0;
    });
  }
  if (profile.excludedBank) {
    const excludedList = Array.isArray(profile.excludedBank) ? profile.excludedBank : [profile.excludedBank];
    const excludedNames = excludedList.filter((b) => !b.startsWith("Brak")).map((b) => b.toLowerCase());
    if (excludedNames.length > 0) {
      matchedOffers = matchedOffers.filter((o) => {
        if (!o.name)
          return true;
        const offerNameLower = o.name.toLowerCase();
        return !excludedNames.some((ex) => offerNameLower.includes(ex));
      });
    }
  }
  if (matchedOffers.length === 0) {
    matchedOffers = allOffers.filter((o) => ["kredyty-gotowkowe", "chwilowki"].includes(o.category));
  }
  const getRRSO = (offer) => {
    let rrsoStr = "";
    if (offer.params) {
      for (const key of Object.keys(offer.params)) {
        if (key.includes("rrso") || key.includes("stopa")) {
          rrsoStr = offer.params[key];
          break;
        }
      }
    }
    if (!rrsoStr && offer.features) {
      const rrsoFeature = offer.features.find((f) => f.toLowerCase().includes("rrso"));
      if (rrsoFeature)
        rrsoStr = rrsoFeature;
    }
    if (!rrsoStr)
      return Infinity;
    const match = rrsoStr.replace(",", ".").match(/[\d.]+/);
    if (match) {
      return parseFloat(match[0]);
    }
    return Infinity;
  };
  const getDecisionTimeScore = (offer) => {
    let score = 0;
    const matchText = ((offer.features?.join(" ") || "") + " " + (offer.comment || "") + " " + (offer.name || "")).toLowerCase();
    if (matchText.includes("minut") || matchText.includes("od r\u0119ki") || matchText.includes("natychmiast") || matchText.includes("b\u0142yskawiczna")) {
      score += 10;
    } else if (matchText.includes("szybk") || matchText.includes("online")) {
      score += 5;
    }
    return score;
  };
  const sortedOffers = [...matchedOffers].sort((a, b) => {
    const rrsoA = getRRSO(a);
    const rrsoB = getRRSO(b);
    if (rrsoA !== rrsoB) {
      if (rrsoA === Infinity)
        return 1;
      if (rrsoB === Infinity)
        return -1;
      if (Math.abs(rrsoA - rrsoB) > 0.1) {
        return rrsoA - rrsoB;
      }
    }
    const decisionA = getDecisionTimeScore(a);
    const decisionB = getDecisionTimeScore(b);
    if (decisionA !== decisionB) {
      return decisionB - decisionA;
    }
    return 0;
  });
  return sortedOffers.slice(0, 10).map((o) => ({
    ...o,
    category: o.category.replace(/-/g, " ").toUpperCase()
    // Ładne formatowanie nazwy kategorii dla UI
  }));
}
async function routeOffer(offerId) {
  const allOffers = await getLiveOffers();
  return allOffers.find((o) => o.id === offerId);
}

// src/server/tracker.js
import { v4 as uuidv4 } from "uuid";

// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = "";
var supabaseAnonKey = "placeholder-key";
if (typeof process !== "undefined" && process.env && process.env.VITE_SUPABASE_URL) {
  supabaseUrl = process.env.VITE_SUPABASE_URL;
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";
} else if (typeof import.meta !== "undefined" && import.meta.env) {
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";
}
supabaseUrl = supabaseUrl.replace(/^["']|["']$/g, "");
supabaseAnonKey = supabaseAnonKey.replace(/^["']|["']$/g, "");
try {
  new URL(supabaseUrl);
} catch (e) {
  supabaseUrl = "https://placeholder.supabase.co";
}
var isSupabaseConfigured = supabaseUrl !== "https://placeholder.supabase.co" && supabaseUrl !== "";
var isServiceReachable = true;
var supabaseInstance = null;
var getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};
var setSupabaseUnreachable = () => {
  if (isServiceReachable) {
    console.warn("[Supabase] Wykryto trwa\u0142y b\u0142\u0105d po\u0142\u0105czenia (ENOTFOUND). Prze\u0142\u0105czanie w tryb offline.");
    isServiceReachable = false;
  }
};
var getIsSupabaseAvailable = () => isSupabaseConfigured && isServiceReachable;
var supabase = getSupabase();

// src/server/tracker.js
async function trackClick(req, offer) {
  const clickid = uuidv4();
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";
  if (!getIsSupabaseAvailable()) {
    return clickid;
  }
  try {
    const { error } = await supabase.from("clicks").insert([
      {
        id: clickid,
        offer_id: offer.id,
        offer_name: offer.name,
        ip_address: ip,
        user_agent: userAgent,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        status: "click"
      }
    ]);
    if (error) {
      if (error.message && error.message.includes("fetch failed")) {
        setSupabaseUnreachable();
        console.warn("[Tracker] Pomini\u0119to zapis klikni\u0119cia: B\u0142\u0105d po\u0142\u0105czenia z baz\u0105 danych (fetch failed).");
      } else {
        console.error("B\u0142\u0105d zapisu klikni\u0119cia do Supabase:", error.message);
      }
    }
  } catch (err) {
    if (err.message && err.message.includes("fetch failed")) {
      setSupabaseUnreachable();
      console.warn("[Tracker] Pomini\u0119to zapis klikni\u0119cia: B\u0142\u0105d po\u0142\u0105czenia z baz\u0105 danych (fetch failed).");
    } else {
      console.error("Wyj\u0105tek podczas zapisu do Supabase:", err);
    }
  }
  return clickid;
}
async function trackConversion(clickid, payout) {
  if (!getIsSupabaseAvailable()) {
    return;
  }
  try {
    const { error } = await supabase.from("clicks").update({
      status: "conversion",
      payout,
      converted_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", clickid);
    if (error) {
      if (error.message && error.message.includes("fetch failed")) {
        setSupabaseUnreachable();
        console.warn("[Tracker] Pomini\u0119to zapis konwersji: B\u0142\u0105d po\u0142\u0105czenia z baz\u0105 danych (fetch failed).");
      } else {
        console.error("B\u0142\u0105d zapisu konwersji do Supabase:", error.message);
      }
    }
  } catch (err) {
    if (err.message && err.message.includes("fetch failed")) {
      setSupabaseUnreachable();
      console.warn("[Tracker] Pomini\u0119to zapis konwersji: B\u0142\u0105d po\u0142\u0105czenia z baz\u0105 danych (fetch failed).");
    } else {
      console.error("Wyj\u0105tek podczas zapisu konwersji:", err);
    }
  }
}

// server.ts
async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3e3;
  app.use(cors());
  app.use(express.json());
  app.post("/api/offers", async (req, res) => {
    try {
      const userProfile = req.body;
      const offers = await getOffersForProfile(userProfile);
      if (offers.length === 0) {
        res.json({ url: "https://tmlead.pl/redirect/388900_1090", status: "downsell", name: "Stop Komornik", features: ["Wstrzymanie egzekucji", "Czyszczenie BIK", "Ochrona maj\u0105tku"] });
        return;
      }
      console.log(`[API] Znaleziono ${offers.length} ofert dla profilu:`, userProfile.goal, userProfile.score);
      res.json(offers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "B\u0142\u0105d silnika ofert" });
    }
  });
  app.get("/api/go", async (req, res) => {
    try {
      const offerId = req.query.offerId;
      const offer = await routeOffer(offerId);
      if (!offer) {
        res.status(404).send("Oferta niedost\u0119pna");
        return;
      }
      const clickid = await trackClick(req, offer);
      const redirectUrl = new URL(offer.url);
      redirectUrl.searchParams.append("clickid", clickid);
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error(error);
      res.status(500).send("B\u0142\u0105d przekierowania");
    }
  });
  app.get("/api/postback", async (req, res) => {
    try {
      const { clickid, payout } = req.query;
      if (!clickid) {
        res.status(400).send("Brak clickid");
        return;
      }
      await trackConversion(clickid, Number(payout));
      res.send("ok");
    } catch (error) {
      console.error(error);
      res.status(500).send("B\u0142\u0105d postbacka");
    }
  });
  app.get("/api/news", async (req, res) => {
    try {
      const apiKey = process.env.NEWS_API_KEY;
      if (!apiKey) {
        res.status(400).json({ error: "Brak klucza NEWS_API_KEY w zmiennych \u015Brodowiskowych." });
        return;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5e3);
      const response = await fetch(`https://newsapi.org/v2/top-headlines?country=pl&category=business&apiKey=${apiKey}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data.articles || []);
    } catch (error) {
      console.error("B\u0142\u0105d pobierania wiadomo\u015Bci:", error);
      if (error.name === "AbortError") {
        res.status(504).json({ error: "Przekroczono czas oczekiwania na odpowied\u017A z serwera wiadomo\u015Bci (Timeout)." });
      } else {
        res.status(500).json({ error: "Nie uda\u0142o si\u0119 pobra\u0107 wiadomo\u015Bci finansowych." });
      }
    }
  });
  app.post("/api/leads", async (req, res) => {
    try {
      const { email, timestamp } = req.body;
      if (!email) {
        res.status(400).json({ error: "Brak adresu e-mail" });
        return;
      }
      console.log(`[LEAD] Nowy e-mail z lejka: ${email} (Czas: ${timestamp})`);
      res.json({ success: true, message: "Lead zapisany" });
    } catch (error) {
      console.error("B\u0142\u0105d zapisu leada:", error);
      res.status(500).json({ error: "Nie uda\u0142o si\u0119 zapisa\u0107 leada." });
    }
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const { history, message } = req.body;
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const systemInstruction = `
Jeste\u015B zaawansowanym doradc\u0105 finansowym AI (CashMaker AI). 
Twoim celem jest kompleksowa analiza profilu finansowego u\u017Cytkownika, zadawanie pog\u0142\u0119bionych pyta\u0144 (np. o zarobki, wydatki, cele, histori\u0119 kredytow\u0105, posiadane oszcz\u0119dno\u015Bci) i generowanie spersonalizowanych rekomendacji.
Zadawaj maksymalnie jedno pytanie naraz, aby nie przyt\u0142oczy\u0107 u\u017Cytkownika.
Pami\u0119taj kontekst ca\u0142ej rozmowy. Je\u015Bli u\u017Cytkownik wspomina\u0142 wcze\u015Bniej o d\u0142ugach, we\u017A to pod uwag\u0119 przy proponowaniu oszcz\u0119dno\u015Bci.
B\u0105d\u017A profesjonalny, bezpo\u015Bredni i u\u017Cywaj j\u0119zyka korzy\u015Bci (w stylu CashMaker - agresywny marketing, ale merytoryczny).
Gdy zbierzesz wystarczaj\u0105co du\u017Co informacji (np. po 3-4 pytaniach), zaproponuj konkretne kroki lub produkty finansowe (np. konsolidacja, poduszka finansowa, konto oszcz\u0119dno\u015Bciowe, kredyt hipoteczny).
      `;
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction,
          temperature: 0.7
        },
        history: history.length > 0 ? history : void 0
      });
      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Chat API Error:", error);
      res.json({ text: "Przepraszam, mam obecnie problemy techniczne (b\u0142\u0105d konfiguracji AI). Spr\xF3buj ponownie p\xF3\u017Aniej lub skontaktuj si\u0119 z naszym doradc\u0105 bezpo\u015Brednio." });
    }
  });
  app.post("/api/ai-offers", async (req, res) => {
    try {
      const { quizData, availableOffers } = req.body;
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
    Jeste\u015B niezale\u017Cnym doradc\u0105 finansowym. Twoim zadaniem jest analiza profilu klienta i wyb\xF3r NAJLEPSZEJ oferty.
    
    UWAGA: Musisz by\u0107 obiektywny. Nie faworyzuj \u017Cadnego konkretnego banku. 
    Je\u015Bli kilka ofert jest podobnych, wybierz losowo jedn\u0105 z nich, aby zapewni\u0107 r\xF3\u017Cnorodno\u015B\u0107.
    
    DANE KLIENTA:
    ${JSON.stringify(quizData, null, 2)}
    
    DOST\u0118PNE OFERTY (z prawdziwymi danymi):
    ${JSON.stringify(availableOffers, null, 2)}
    
    ZASADY WYBORU:
    1. Dopasuj ofert\u0119 do celu (business -> firmowe, debt -> konsolidacja, house -> hipoteka, account -> konta osobiste, savings -> oszcz\u0119dno\u015Bci/lokaty, insurance -> ubezpieczenia).
    2. Dopasuj ofert\u0119 do historii kredytowej (pole 'score'):
       - 'good' (Dobra) -> preferuj tradycyjne kredyty bankowe, oferty z najni\u017Cszym RRSO, konta premium.
       - 'mid' (\u015Arednia) -> standardowe oferty bankowe oraz pozabankowe po\u017Cyczki ratalne.
       - 'bad' (S\u0142aba) -> BEZWZGL\u0118DNIE preferuj po\u017Cyczki pozabankowe (chwil\xF3wki), firmy po\u017Cyczkowe. Unikaj tradycyjnych bank\xF3w przy ofertach got\xF3wkowych.
    3. Je\u015Bli celem jest 'account' (Konto bankowe), zwr\xF3\u0107 szczeg\xF3ln\u0105 uwag\u0119 na pole 'accountFilter':
       - 'free' -> szukaj darmowych kont (0 z\u0142 za prowadzenie).
       - 'bonus' -> szukaj kont z premi\u0105 na start.
       - 'moneyback' -> szukaj kont oferuj\u0105cych zwrot za zakupy (moneyback/cashback).
    4. Je\u015Bli celem jest 'insurance' (Ubezpieczenia), zwr\xF3\u0107 uwag\u0119 na pole 'insuranceType':
       - 'acoc' -> szukaj ubezpiecze\u0144 komunikacyjnych (AC/OC).
       - 'other' -> szukaj pozosta\u0142ych ubezpiecze\u0144 (na \u017Cycie, turystyczne, nieruchomo\u015Bci).
    5. Je\u015Bli celem jest 'business' (Firma), zwr\xF3\u0107 uwag\u0119 na pole 'businessType':
       - 'loan' -> szukaj kredyt\xF3w dla firm, linii kredytowych, limit\xF3w w koncie.
       - SPECJALNE DLA 'loan':
         - 'businessLoanType' == 'startup' -> priorytet dla ofert dla NOWYCH FIRM (cz\u0119sto bez sta\u017Cu).
         - 'businessDuration' == 'new' -> szukaj po\u017Cyczek pozabankowych i ofert dla nowych firm.
       - 'account' -> szukaj kont firmowych (0 z\u0142 za przelewy do ZUS/US, premie za otwarcie).
    6. Je\u015Bli celem jest 'savings' (Oszcz\u0119dzanie), zwr\xF3\u0107 uwag\u0119 na pole 'savingsType':
       - 'account' -> szukaj kont oszcz\u0119dno\u015Bciowych (wysokie oprocentowanie, dost\u0119p do \u015Brodk\xF3w).
       - 'investments' -> szukaj lokat terminowych i ofert inwestycyjnych.
    7. Zwr\xF3\u0107 uwag\u0119 na form\u0119 zatrudnienia ('employment') i doch\xF3d ('income'):
       - 'b2b' -> uzasadnienie mo\u017Ce nawi\u0105zywa\u0107 do elastyczno\u015Bci dla przedsi\u0119biorc\xF3w.
       - 'high', 'expert' -> szukaj produkt\xF3w premium, kont VIP lub wy\u017Cszych limit\xF3w.
    8. Wyci\u0105gnij PRAWDZIWE dane z pola 'params' i 'features'.
    
    Zwr\xF3\u0107 odpowied\u017A w formacie JSON:
    {
      "recommendedOfferId": "id_oferty",
      "reasoning": "kr\xF3tkie, unikalne uzasadnienie (max 100 znak\xF3w)",
      "rrso": "prawdziwe RRSO z danych (np. 0% lub 12.5%)",
      "maxAmount": "prawdziwa kwota max (np. 5000 z\u0142)",
      "decisionTime": "czas decyzji (np. 15 min)"
    }
  `;
      const aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedOfferId: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              rrso: { type: Type.STRING },
              maxAmount: { type: Type.STRING },
              decisionTime: { type: Type.STRING }
            },
            required: ["recommendedOfferId", "reasoning", "rrso", "maxAmount", "decisionTime"]
          }
        }
      });
      const result = JSON.parse(aiResponse.text || "{}");
      res.json(result);
    } catch (error) {
      console.error("AI Offer Error:", error);
      const { availableOffers } = req.body;
      if (availableOffers && availableOffers.length > 0) {
        console.log("Using fallback offer due to AI error.");
        const fallbackOffer = availableOffers[0];
        res.json({
          recommendedOfferId: fallbackOffer.id,
          reasoning: "Systemowy dob\xF3r zapasowy (najlepsza dost\u0119pna oferta w Twojej kategorii).",
          rrso: fallbackOffer.rrso || "Zale\u017Cnie od oferty",
          maxAmount: fallbackOffer.maxAmount || "Zale\u017Cnie od zdolno\u015Bci",
          decisionTime: fallbackOffer.decisionTime || "15 min"
        });
      } else {
        res.status(500).json({ error: "B\u0142\u0105d silnika rekomendacji AI" });
      }
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CashMaker running on http://localhost:${PORT}`);
  });
}
startServer();
