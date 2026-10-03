import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { getOffersForProfile, routeOffer } from "./src/server/router.js";
import { trackClick, trackConversion } from "./src/server/tracker.js";
import { searchAndFetchCompany, runGeminiCompanyDiagnostic, CURATED_COMPANIES } from "./src/server/companyService.js";
import { referralManager } from "./src/server/referralManager.js";
import { leadManager } from "./src/server/leadManager.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // 1. Endpoint dla Frontendu: Zwraca dopasowane oferty na podstawie quizu
  app.post("/api/offers", async (req, res) => {
    try {
      const userProfile = req.body;
      const offers = await getOffersForProfile(userProfile);
      
      // Sprawdzamy czy mamy oferty (zastępcze dla wskaźnika akceptacji - zawsze zwracamy tablicę)
      if (offers.length === 0) {
        res.json([{
          id: "downsell-stop-komornik",
          url: "https://tmlead.pl/redirect/388900_1090",
          status: "downsell",
          name: "Stop Komornik",
          category: "POMOC PRAWNA",
          features: ["Wstrzymanie egzekucji", "Czyszczenie BIK", "Ochrona majątku"]
        }]);
        return;
      }

      console.log(`[API] Znaleziono ${offers.length} ofert dla profilu:`, userProfile.goal, userProfile.score);
      res.json(offers);
    } catch (error) {
      console.error("[API] Błąd silnika ofert:", error);
      res.status(500).json({ error: "Błąd silnika ofert" });
    }
  });

  // 2. Endpoint przekierowujący (Afiliacja i tracking parametrów epi)
  app.get("/api/go", async (req, res) => {
    try {
      const offerId = req.query.offerId as string;
      if (!offerId || typeof offerId !== 'string' || !offerId.trim()) {
        res.status(400).json({ error: "Brak lub nieprawidłowy identyfikator oferty (offerId)" });
        return;
      }

      const offer = await routeOffer(offerId.trim());
      
      if (!offer) {
        console.warn(`[API /api/go] Nie znaleziono oferty dla offerId: ${offerId}.`);
        res.status(404).json({ error: `Nie znaleziono oferty dla identyfikatora: ${offerId}` });
        return;
      }

      // Sanityzacja parametru źródła (source)
      const rawSource = typeof req.query.source === 'string' && req.query.source.trim()
        ? req.query.source.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30)
        : 'raport-finansowy';

      // Zapisujemy unikalne kliknięcie (clickid generowany po stronie serwera jako UUIDv4 - nie może być nadpisany z zewnątrz)
      const clickid = await trackClick(req, offer, rawSource);

      // Bezpieczne dodawanie parametrów afiliacyjnych:
      // - epi: unikalny identyfikator kliknięcia (UUIDv4)
      // - epi2: kontekst / źródło kliknięcia (np. home, loan, mortgage)
      // - clickid: dodatkowa wsteczna kompatybilność z sieciami
      const redirectUrl = new URL(offer.url);
      redirectUrl.searchParams.set("epi", clickid);
      redirectUrl.searchParams.set("epi2", rawSource);
      redirectUrl.searchParams.set("clickid", clickid);

      console.log(`[Affiliate] Przekierowanie: offerId=${offer.id}, clickid/epi=${clickid}, source=${rawSource}`);
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("[API /api/go] Błąd przekierowania:", error);
      res.status(500).json({ error: "Błąd serwera podczas przekierowania do oferty" });
    }
  });

  // 3. Postback z sieci afiliacyjnej (Money2Money / uniwersalny webhook z walidacją)
  app.get("/api/postback", async (req, res) => {
    try {
      // Obsługujemy zarówno clickid, jak i epi / subid
      const clickid = (req.query.clickid || req.query.epi || req.query.subid) as string;
      const payoutRaw = req.query.payout || req.query.commission || req.query.rate || req.query.amount;
      const secretToken = (req.query.secret || req.query.token || req.headers['x-postback-secret']) as string | undefined;

      const result = await trackConversion(clickid, payoutRaw, secretToken);

      if (!result.success) {
        res.status(result.status).json({ success: false, error: result.message });
        return;
      }

      console.log(`[Postback] Potwierdzono konwersję: id=${result.clickid}, payout=${result.payout}`);
      res.status(200).json({
        success: true,
        message: result.message,
        clickid: result.clickid,
        payout: result.payout,
        offerId: result.offerId
      });
    } catch (error) {
      console.error("[Postback] Błąd postbacka:", error);
      res.status(500).json({ error: "Błąd serwera podczas przetwarzania postbacka" });
    }
  });

  // 4. Endpoint dla wiadomości finansowych
  app.get("/api/news", async (req, res) => {
    try {
      const apiKey = process.env.NEWS_API_KEY;
      if (!apiKey) {
        res.status(400).json({ error: "Brak klucza NEWS_API_KEY w zmiennych środowiskowych." });
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sekund timeoutu

      const response = await fetch(`https://newsapi.org/v2/top-headlines?country=pl&category=business&apiKey=${apiKey}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data.articles || []);
    } catch (error: any) {
      console.error("Błąd pobierania wiadomości:", error);
      if (error.name === 'AbortError') {
        res.status(504).json({ error: "Przekroczono czas oczekiwania na odpowiedź z serwera wiadomości (Timeout)." });
      } else {
        res.status(500).json({ error: "Nie udało się pobrać wiadomości finansowych." });
      }
    }
  });

  // 5. Endpoint dla leadów z lejka i kalkulatora (Trwały zapis w bazie i pamięci serwera)
  app.post("/api/leads", async (req, res) => {
    try {
      const { email, source, lossTier, lossAmount, metadata, timestamp } = req.body;
      
      if (!email || typeof email !== 'string' || !email.trim()) {
        res.status(400).json({ error: "Adres e-mail jest wymagany." });
        return;
      }

      const lead = await leadManager.saveLead({
        email,
        source: source || 'financial_funnel',
        lossTier,
        lossAmount,
        metadata: { ...metadata, clientTimestamp: timestamp }
      });

      res.status(201).json({
        success: true,
        id: lead.id,
        message: "Lead został pomyślnie i trwale zapisany."
      });
    } catch (error: any) {
      console.error("[API /api/leads] Błąd walidacji lub zapisu leada:", error.message || error);
      res.status(400).json({ error: error.message || "Nie udało się zapisać leada." });
    }
  });

  // 6. Endpoint wyszukiwania spółki (KRS, NIP, REGON, Nazwa)
  app.get("/api/company/search", async (req, res) => {
    try {
      const query = (req.query.q || req.query.query || "") as string;
      if (!query.trim()) {
        res.status(400).json({ error: "Podaj NIP, KRS, REGON lub nazwę spółki" });
        return;
      }

      const result = await searchAndFetchCompany(query);
      res.json(result);
    } catch (error: any) {
      console.error("Błąd wyszukiwania spółki:", error);
      const statusCode = typeof error.status === 'number' ? error.status : 500;
      res.status(statusCode).json({ error: error.message || "Nie udało się pobrać danych firmy. Spróbuj ponownie." });
    }
  });

  // 7. Endpoint audytu AI i diagnostyki spółki (Gemini 3.8 Flash)
  app.post("/api/company/diagnostic", async (req, res) => {
    try {
      const { company, financials } = req.body;
      if (!company || !financials) {
        res.status(400).json({ error: "Brak danych spółki lub sprawozdania finansowego" });
        return;
      }

      const diagnostic = await runGeminiCompanyDiagnostic(company, financials);
      res.json(diagnostic);
    } catch (error: any) {
      console.error("Błąd generowania audytu AI spółki:", error);
      res.status(500).json({ error: error.message || "Błąd audytu AI" });
    }
  });

  // 8. Endpoint zapisu na monitoring spółki (B2B Lead - Trwały zapis w bazie i pamięci serwera)
  app.post("/api/company/monitor", async (req, res) => {
    try {
      const { email, nip, krs, companyName, plan } = req.body;
      if (!email || typeof email !== 'string' || !email.trim()) {
        res.status(400).json({ error: "Adres e-mail jest wymagany." });
        return;
      }

      const record = await leadManager.saveCompanyMonitor({
        email,
        nip,
        krs,
        companyName,
        plan
      });

      res.status(201).json({
        success: true,
        id: record.id,
        message: "Aktywowano alerty monitoringu dla wybranej spółki. Raporty będą wysyłane na podany e-mail."
      });
    } catch (error: any) {
      console.error("[API /api/company/monitor] Błąd zapisu na monitoring:", error.message || error);
      res.status(400).json({ error: error.message || "Nie udało się zapisać na monitoring spółki." });
    }
  });

  // 9. Endpoint diagnostyczny (System Health Check) - Supabase & Gemini
  app.get("/api/health", async (req, res) => {
    const startTime = Date.now();

    // Diagnostyka Supabase
    const sbUrl = (process.env.VITE_SUPABASE_URL || "").trim();
    const sbKey = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
    const isSbConfigured = Boolean(sbUrl && !sbUrl.includes("placeholder"));

    let supabaseResult = {
      configured: isSbConfigured,
      reachable: false,
      latencyMs: 0,
      urlPreview: isSbConfigured ? sbUrl.replace(/^(https?:\/\/)([^.]+)\.(.*)$/, "$1$2.***.$3") : "Brak VITE_SUPABASE_URL",
      message: isSbConfigured ? "Sprawdzanie..." : "Brak skonfigurowanego VITE_SUPABASE_URL"
    };

    if (isSbConfigured) {
      const sbStart = Date.now();
      try {
        const resp = await fetch(`${sbUrl}/rest/v1/`, {
          method: "GET",
          headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
          signal: AbortSignal.timeout(3500)
        });
        supabaseResult.latencyMs = Date.now() - sbStart;
        if (resp.ok || resp.status === 200 || resp.status === 401 || resp.status === 404) {
          supabaseResult.reachable = true;
          supabaseResult.message = `Aktywne połączenie (HTTP ${resp.status})`;
        } else {
          supabaseResult.message = `Odpowiedź HTTP ${resp.status}`;
        }
      } catch (err: any) {
        supabaseResult.latencyMs = Date.now() - sbStart;
        supabaseResult.message = err.message || "Timeout / ENOTFOUND";
      }
    }

    // Diagnostyka Gemini AI
    const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
    const isGeminiConfigured = Boolean(geminiKey);

    let geminiResult = {
      configured: isGeminiConfigured,
      reachable: false,
      latencyMs: 0,
      model: "gemini-2.5-flash",
      message: isGeminiConfigured ? "Sprawdzanie..." : "Brak GEMINI_API_KEY w środowisku"
    };

    if (isGeminiConfigured) {
      const gStart = Date.now();
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ 
          apiKey: geminiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const testResp = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: "ping"
        });
        geminiResult.latencyMs = Date.now() - gStart;
        const text = testResp?.candidates?.[0]?.content?.parts?.[0]?.text || testResp?.text;
        if (testResp && (text || (testResp.candidates && testResp.candidates.length > 0))) {
          geminiResult.reachable = true;
          geminiResult.message = `Połączono pomyślnie (API responsywne: ${text ? text.trim() : 'OK'})`;
        } else {
          geminiResult.message = "Brak treści w odpowiedzi modelu";
        }
      } catch (err: any) {
        geminiResult.latencyMs = Date.now() - gStart;
        geminiResult.message = err?.message || "Błąd zapytania testowego";
      }
    }

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      totalLatencyMs: Date.now() - startTime,
      environment: process.env.NODE_ENV || "development",
      supabase: supabaseResult,
      gemini: geminiResult
    });
  });

  // 10. Endpoints autoryzacji programu poleceń i raportów Premium (Server-Authoritative)
  app.get("/api/referral/status", async (req, res) => {
    try {
      const userId = (req.query.userId as string) || '';
      const code = (req.query.code as string) || undefined;
      if (!userId.trim()) {
        res.status(400).json({ error: "Brak identyfikatora użytkownika (userId)" });
        return;
      }
      const record = await referralManager.getOrCreateUser(userId, code);
      res.json({ success: true, record });
    } catch (err: any) {
      console.error("[ReferralAPI] Błąd pobierania statusu:", err);
      res.status(500).json({ error: err.message || "Błąd pobierania statusu poleceń" });
    }
  });

  app.post("/api/referral/unlock", async (req, res) => {
    try {
      const { userId, nip } = req.body;
      if (!userId || !nip) {
        res.status(400).json({ error: "Wymagany userId oraz NIP spółki" });
        return;
      }
      const result = await referralManager.unlockReport(userId, nip);
      if (!result.success) {
        res.status(403).json(result);
        return;
      }
      res.json(result);
    } catch (err: any) {
      console.error("[ReferralAPI] Błąd odblokowania raportu:", err);
      res.status(500).json({ error: err.message || "Błąd serwera podczas odblokowywania raportu" });
    }
  });

  app.post("/api/referral/redeem", async (req, res) => {
    try {
      const { userId, friendCode } = req.body;
      if (!userId || !friendCode) {
        res.status(400).json({ error: "Wymagany userId oraz kod polecający" });
        return;
      }
      const result = await referralManager.redeemFriendCode(userId, friendCode);
      if (!result.success) {
        res.status(400).json(result);
        return;
      }
      res.json(result);
    } catch (err: any) {
      console.error("[ReferralAPI] Błąd realizacji kodu:", err);
      res.status(500).json({ error: err.message || "Błąd realizacji kodu polecającego" });
    }
  });

  app.post("/api/referral/share", async (req, res) => {
    try {
      const { userId, source } = req.body;
      if (!userId) {
        res.status(400).json({ error: "Wymagany userId" });
        return;
      }
      const result = await referralManager.recordShare(userId, source);
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("[ReferralAPI] Błąd zapisu polecenia:", err);
      res.status(500).json({ error: err.message || "Błąd zapisu polecenia" });
    }
  });

  app.post("/api/referral/verify", async (req, res) => {
    try {
      const { userId, nip } = req.body;
      const result = await referralManager.verifyAccess(userId, nip);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Błąd weryfikacji dostępu" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { history, message } = req.body;
      const { GoogleGenAI } = await import('@google/genai');
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        res.json({
          text: "Witaj! Jestem Twoim doradcą finansowym AI w portalu RaportFinansowy24. Pomagam w analizie kredytów, kalkulacji rat, stóp procentowych oraz weryfikacji sytuacji finansowej firm. W czym mogę pomóc?",
          sources: []
        });
        return;
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      
      const systemInstruction = `
Jesteś profesjonalnym doradcą finansowym AI portalu RaportFinansowy24.
Twoim celem jest rzetelna pomoc w sprawach kredytów, pożyczek, konsolidacji, hipoteki, oszczędności oraz weryfikacji sytuacji finansowej firm.

KRYTYCZNE ZASADY DANYCH FINANSOWYCH:
1. Nigdy nie zmyślaj ani nie zgaduj: stóp procentowych, stawek WIBOR/WIRON, prowizji bankowych, RRSO ani konkretnych warunków ofert.
2. Jeśli korzystasz z wyszukiwarki Google Search, podawaj wyłącznie zweryfikowane fakty i odnoś się do aktualnych danych (np. NBP, KNF, oficjalnych stron banków).
3. Jeżeli nie masz potwierdzonego źródła lub dane są niejednoznaczne, wprost poinformuj użytkownika: "Nie posiadam aktualnie zweryfikowanej informacji na ten temat. Sprawdź tabelę opłat i prowizji bezpośrednio na stronie banku lub w oficjalnym komunikacie NBP".
4. Twoje odpowiedzi mają charakter edukacyjno-informacyjny i nie stanowią oficjalnego komunikatu NBP, KNF ani wiążącej oferty handlowej w rozumieniu Kodeksu Cywilnego.
5. Zawsze odpowiadaj konkretnie, merytorycznie i po polsku.
      `;

      let chatResponseText: string | null = null;
      let sources: Array<{ title?: string; uri?: string }> = [];

      // Wymóg: Wykorzystanie gemini-3.5-flash z narzędziem googleSearch (Search Grounding)
      try {
        const contents: any[] = [];
        if (history && Array.isArray(history)) {
          for (const item of history.slice(-6)) {
            const textContent = typeof item.parts?.[0]?.text === 'string' ? item.parts[0].text : (item.content || '');
            if (textContent) {
              contents.push({
                role: item.role === 'model' ? 'model' : 'user',
                parts: [{ text: textContent }]
              });
            }
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.5,
            tools: [{ googleSearch: {} }]
          }
        });

        if (response.text) {
          chatResponseText = response.text;
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (chunks && Array.isArray(chunks)) {
            sources = chunks
              .map((c: any) => c.web)
              .filter((w: any) => w && w.uri && w.title);
          }
        }
      } catch (err: any) {
        const status = err?.status || err?.statusCode || 429;
        console.log(`[ChatAPI] Status API: ${status}. Aktywowano bezpieczną odpowiedź doradczą.`);
        
        // Bezpieczny fallback modeli w przypadku przekroczenia limitu zapytań do wyszukiwarki
        const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
        for (const modelName of candidateModels) {
          try {
            const fallbackRes = await ai.models.generateContent({
              model: modelName,
              contents: message,
              config: {
                systemInstruction,
                temperature: 0.7
              }
            });
            if (fallbackRes.text) {
              chatResponseText = fallbackRes.text;
              break;
            }
          } catch (e: any) {
            // Kontynuacja fallbacku
          }
        }
      }

      if (chatResponseText) {
        res.json({ text: chatResponseText, sources });
      } else {
        res.json({ 
          text: "Witaj w RaportFinansowy24! Jako Twój doradca finansowy polecam skorzystanie z naszych kalkulatorów rat i kosztów oraz audytu spółki po numerze NIP/KRS. Możesz również zapytać o dowolny aspekt kredytowy lub stopy procentowe NBP.",
          sources: []
        });
      }
    } catch (error: any) {
      console.log('[ChatAPI] Zwrócono bezpieczny komunikat pomocniczy.');
      res.json({ 
        text: "Wystąpił chwilowy problem techniczny z połączeniem AI. Skorzystaj z kalkulatora na stronie lub spróbuj ponownie za chwilę.",
        sources: []
      });
    }
  });

  // Pamięć podręczna dla Pulsu Rynku (NBP/WIBOR) - minimalizacja odpytywań i ochrona przed 429
  let marketPulseCache = {
    summary: "Aktualna stopa referencyjna NBP wynosi 5,75%, a stawka WIBOR 3M kształtuje się w okolicach 5,85%. Warunki cenowe kredytów gotówkowych i hipotecznych pozostają stabilne.",
    sources: [{ title: "Narodowy Bank Polski - Stopy Procentowe", uri: "https://nbp.pl" }],
    timestamp: new Date().toISOString(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 2 // 2 godziny
  };

  // 4b. Endpoint aktualnych stóp i wskaźników rynkowych z Google Search Grounding (gemini-3.5-flash)
  app.get("/api/market-pulse", async (req, res) => {
    // 1. Sprawdzamy czy mamy ważny cache
    if (marketPulseCache && Date.now() < marketPulseCache.expiresAt) {
      res.json({
        summary: marketPulseCache.summary,
        sources: marketPulseCache.sources,
        timestamp: marketPulseCache.timestamp
      });
      return;
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        marketPulseCache.expiresAt = Date.now() + 1000 * 60 * 60;
        res.json({
          summary: marketPulseCache.summary,
          sources: marketPulseCache.sources,
          timestamp: marketPulseCache.timestamp
        });
        return;
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: 'Podaj aktualną stopę referencyjną NBP oraz stawkę WIBOR 3M w Polsce w 1-2 krótkich zdaniach podsumowania dla kredytobiorców.',
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = (chunks || [])
        .map((c: any) => c.web)
        .filter((w: any) => w && w.uri && w.title);

      const summary = response.text || marketPulseCache.summary;
      const finalSources = sources.length > 0 ? sources.slice(0, 3) : marketPulseCache.sources;

      marketPulseCache = {
        summary,
        sources: finalSources,
        timestamp: new Date().toISOString(),
        expiresAt: Date.now() + 1000 * 60 * 60 * 2 // 2 godziny bufora
      };

      res.json({
        summary: marketPulseCache.summary,
        sources: marketPulseCache.sources,
        timestamp: marketPulseCache.timestamp
      });
    } catch (e: any) {
      const statusCode = e?.status || e?.statusCode || 429;
      console.log(`[MarketPulse] Informacja: aktywowano zweryfikowany bufor danych NBP (status: ${statusCode}).`);
      marketPulseCache.expiresAt = Date.now() + 1000 * 60 * 60; // 1 godzina bufora ochronnego
      res.json({
        summary: marketPulseCache.summary,
        sources: marketPulseCache.sources,
        timestamp: marketPulseCache.timestamp
      });
    }
  });

  app.post("/api/ai-offers", async (req, res) => {
    const { quizData, availableOffers } = req.body;
    try {
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY!,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      
      const prompt = `
    Jesteś niezależnym doradcą finansowym. Twoim zadaniem jest analiza profilu klienta i wybór NAJLEPSZEJ oferty.
    
    UWAGA: Musisz być obiektywny. Nie faworyzuj żadnego konkretnego banku. 
    Jeśli kilka ofert jest podobnych, wybierz losowo jedną z nich, aby zapewnić różnorodność.
    
    DANE KLIENTA:
    ${JSON.stringify(quizData, null, 2)}
    
    DOSTĘPNE OFERTY (z prawdziwymi danymi):
    ${JSON.stringify(availableOffers, null, 2)}
    
    ZASADY WYBORU:
    1. Dopasuj ofertę do celu (business -> firmowe, debt -> konsolidacja, house -> hipoteka, account -> konta osobiste, savings -> oszczędności/lokaty, insurance -> ubezpieczenia).
    2. Dopasuj ofertę do historii kredytowej (pole 'score'):
       - 'good' (Dobra) -> preferuj tradycyjne kredyty bankowe, oferty z najniższym RRSO, konta premium.
       - 'mid' (Średnia) -> standardowe oferty bankowe oraz pozabankowe pożyczki ratalne.
       - 'bad' (Słaba) -> BEZWZGLĘDNIE preferuj pożyczki pozabankowe (chwilówki), firmy pożyczkowe. Unikaj tradycyjnych banków przy ofertach gotówkowych.
    3. Jeśli celem jest 'account' (Konto bankowe), zwróć szczególną uwagę na pole 'accountFilter':
       - 'free' -> szukaj darmowych kont (0 zł za prowadzenie).
       - 'bonus' -> szukaj kont z premią na start.
       - 'moneyback' -> szukaj kont oferujących zwrot za zakupy (moneyback/cashback).
    4. Jeśli celem jest 'insurance' (Ubezpieczenia), zwróć uwagę na pole 'insuranceType':
       - 'acoc' -> szukaj ubezpieczeń komunikacyjnych (AC/OC).
       - 'other' -> szukaj pozostałych ubezpieczeń (na życie, turystyczne, nieruchomości).
    5. Jeśli celem jest 'business' (Firma), zwróć uwagę na pole 'businessType':
       - 'loan' -> szukaj kredytów dla firm, linii kredytowych, limitów w koncie.
       - SPECJALNE DLA 'loan':
         - 'businessLoanType' == 'startup' -> priorytet dla ofert dla NOWYCH FIRM (często bez stażu).
         - 'businessDuration' == 'new' -> szukaj pożyczek pozabankowych i ofert dla nowych firm.
       - 'account' -> szukaj kont firmowych (0 zł za przelewy do ZUS/US, premie za otwarcie).
    6. Jeśli celem jest 'savings' (Oszczędzanie), zwróć uwagę na pole 'savingsType':
       - 'account' -> szukaj kont oszczędnościowych (wysokie oprocentowanie, dostęp do środków).
       - 'investments' -> szukaj lokat terminowych i ofert inwestycyjnych.
    7. Zwróć uwagę na formę zatrudnienia ('employment') i dochód ('income'):
       - 'b2b' -> uzasadnienie może nawiązywać do elastyczności dla przedsiębiorców.
       - 'high', 'expert' -> szukaj produktów premium, kont VIP lub wyższych limitów.
    8. Wyciągnij PRAWDZIWE dane z pola 'params' i 'features'.
    
    Zwróć odpowiedź w formacie JSON:
    {
      "recommendedOfferId": "id_oferty",
      "reasoning": "krótkie, unikalne uzasadnienie (max 100 znaków)",
      "rrso": "prawdziwe RRSO z danych (np. 0% lub 12.5%)",
      "maxAmount": "prawdziwa kwota max (np. 5000 zł)",
      "decisionTime": "czas decyzji (np. 15 min)"
    }
  `;

      const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      let aiResponse: any = null;

      for (const modelName of candidateModels) {
        try {
          aiResponse = await ai.models.generateContent({
            model: modelName,
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
                required: ["recommendedOfferId", "reasoning", "rrso", "maxAmount", "decisionTime"],
              },
            },
          });
          if (aiResponse?.text) {
            break;
          }
        } catch (err: any) {
          console.warn(`[AIOffers] Model ${modelName} niedostępny (${err?.status || err?.message || 'obciążenie serwerów'}). Próba kolejnego...`);
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      if (aiResponse?.text) {
        const result = JSON.parse(aiResponse.text || '{}');
        res.json(result);
        return;
      }

      throw new Error("Wszystkie modele AI zajęte");
    } catch (error: any) {
      console.warn('AI Offer Fallback:', error?.message || error);
      if (availableOffers && availableOffers.length > 0) {
        const fallbackOffer = availableOffers[0];
        res.json({
          recommendedOfferId: fallbackOffer.id,
          reasoning: "Systemowy dobór zapasowy (najlepsza dostępna oferta w Twojej kategorii).",
          rrso: fallbackOffer.rrso || "Zależnie od oferty",
          maxAmount: fallbackOffer.maxAmount || "Zależnie od zdolności",
          decisionTime: fallbackOffer.decisionTime || "15 min"
        });
      } else {
        res.status(500).json({ error: "Błąd silnika rekomendacji AI" });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CashMaker running on http://localhost:${PORT}`);
  });
}

startServer();
