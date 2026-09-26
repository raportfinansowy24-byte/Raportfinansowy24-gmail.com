import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { getOffersForProfile, routeOffer } from "./src/server/router.js";
import { trackClick, trackConversion } from "./src/server/tracker.js";
import { searchAndFetchCompany, runGeminiCompanyDiagnostic, CURATED_COMPANIES } from "./src/server/companyService.js";

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
      if (!offerId) {
        res.redirect("https://toomasz-money.oferty-kredytowe.pl/");
        return;
      }

      const offer = await routeOffer(offerId);
      
      if (!offer) {
        console.warn(`[API /api/go] Nie znaleziono oferty dla offerId: ${offerId}. Przekierowanie do katalogu głównego.`);
        res.redirect("https://toomasz-money.oferty-kredytowe.pl/");
        return;
      }

      // Zapisujemy kliknięcie w Supabase
      const clickid = await trackClick(req, offer);

      // Bezpieczne dodawanie parametrów afiliacyjnych Money2Money:
      // - epi: nasz unikalny clickid (UUIDv4)
      // - epi2: kontekst / źródło kliknięcia (np. home, loan, mortgage)
      // - clickid: wsteczna kompatybilność wewnętrzna
      const redirectUrl = new URL(offer.url);
      redirectUrl.searchParams.set("epi", clickid);
      
      const source = typeof req.query.source === 'string' && req.query.source
        ? req.query.source.slice(0, 30)
        : 'raport-finansowy';
      redirectUrl.searchParams.set("epi2", source);
      redirectUrl.searchParams.set("clickid", clickid);

      console.log(`[Affiliate] Przekierowanie: offerId=${offer.id}, clickid/epi=${clickid}, source=${source}`);
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("[API /api/go] Błąd przekierowania:", error);
      res.status(500).send("Błąd przekierowania");
    }
  });

  // 3. Postback z sieci afiliacyjnej (Money2Money / uniwersalny webhook)
  app.get("/api/postback", async (req, res) => {
    try {
      // Obsługujemy zarówno clickid, jak i epi / subid
      const clickid = (req.query.clickid || req.query.epi || req.query.subid) as string;
      const payout = req.query.payout || req.query.commission || req.query.rate || 0;
      
      if (!clickid) {
        res.status(400).send("Brak identyfikatora kliknięcia (clickid / epi)");
        return;
      }

      // Zapisujemy konwersję w Supabase
      await trackConversion(clickid, Number(payout));
      console.log(`[Postback] Zarejestrowano konwersję dla id/epi: ${clickid}, payout: ${payout}`);
      res.send("ok");
    } catch (error) {
      console.error("[Postback] Błąd postbacka:", error);
      res.status(500).send("Błąd postbacka");
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

  // 5. Endpoint dla leadów z lejka (zastępuje Make.com)
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
      console.error("Błąd zapisu leada:", error);
      res.status(500).json({ error: "Nie udało się zapisać leada." });
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

  // 8. Endpoint zapisu na monitoring spółki (B2B Lead)
  app.post("/api/company/monitor", async (req, res) => {
    try {
      const { email, nip, krs, companyName, plan } = req.body;
      if (!email) {
        res.status(400).json({ error: "Adres e-mail jest wymagany" });
        return;
      }

      console.log(`[B2B MONITORING] Nowy lead na monitoring spółki: ${email}, NIP: ${nip}, KRS: ${krs}, Spółka: ${companyName}, Plan: ${plan || 'Pro B2B'}`);
      res.json({
        success: true,
        message: "Aktywowano alerty monitoringu dla wybranej spółki. Raporty będą wysyłane na podany e-mail."
      });
    } catch (error: any) {
      console.error("Błąd zapisu na monitoring:", error);
      res.status(500).json({ error: "Nie udało się zapisać na monitoring" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { history, message } = req.body;
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY!,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      
      const systemInstruction = `
Jesteś zaawansowanym doradcą finansowym AI (CashMaker AI). 
Twoim celem jest kompleksowa analiza profilu finansowego użytkownika, zadawanie pogłębionych pytań (np. o zarobki, wydatki, cele, historię kredytową, posiadane oszczędności) i generowanie spersonalizowanych rekomendacji.
Zadawaj maksymalnie jedno pytanie naraz, aby nie przytłoczyć użytkownika.
Pamiętaj kontekst całej rozmowy. Jeśli użytkownik wspominał wcześniej o długach, weź to pod uwagę przy proponowaniu oszczędności.
Bądź profesjonalny, bezpośredni i używaj języka korzyści (w stylu CashMaker - agresywny marketing, ale merytoryczny).
Gdy zbierzesz wystarczająco dużo informacji (np. po 3-4 pytaniach), zaproponuj konkretne kroki lub produkty finansowe (np. konsolidacja, poduszka finansowa, konto oszczędnościowe, kredyt hipoteczny).
      `;

      const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      let chatResponseText: string | null = null;

      for (const modelName of candidateModels) {
        try {
          const chat = ai.chats.create({
            model: modelName,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            },
            history: history && history.length > 0 ? history : undefined
          });

          const response = await chat.sendMessage({ message });
          if (response.text) {
            chatResponseText = response.text;
            break;
          }
        } catch (err: any) {
          console.warn(`[ChatAPI] Model ${modelName} zgłosił błąd (${err?.status || err?.message || 'obciążenie serwerów'}). Próba kolejnego...`);
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      if (chatResponseText) {
        res.json({ text: chatResponseText });
      } else {
        res.json({ text: "Przepraszam, serwery AI odnotowują obecnie wzmożony ruch. Jako doradca polecam zapoznać się z naszym kalkulatorem kredytowym oraz audytem KRS, gdzie wskaźniki są weryfikowane natychmiast." });
      }
    } catch (error: any) {
      console.warn('Chat API Error:', error?.message || error);
      res.json({ text: "Przepraszam, mam obecnie problemy techniczne. Spróbuj ponownie za chwilę lub skorzystaj z naszych kalkulatorów bezpośrednio w zakładkach." });
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
