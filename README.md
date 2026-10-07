# RaportFinansowy24 – Nowoczesna Platforma Analityki Finansowej & Doradca AI 🚀

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.2-lightgrey?logo=express)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-3.5_Flash-orange?logo=google)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-green?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

Kompleksowa platforma internetowa (Full-Stack SPA) łącząca niezależną analitykę konsumencką (B2C), zaawansowane symulatory bankowe, moduł weryfikacji kontrahentów (B2B KRS/NIP), silnik rekomendacji oparty o **Google Gemini AI z Search Grounding** oraz bezpieczny system afiliacyjny i program poleceń.

---

## 🌟 Kluczowe Moduły Systemu

### 1. 🧮 Szybkie Narzędzia & Kalkulatory Finansowe (B2C)
- **Kalkulator Kredytowy (`/loan`):** Interaktywna symulacja rat, kosztu odsetkowego, prowizji i RRSO z płynnie animowanymi licznikami (`AnimatedNumber`), wykresem spłaty (Recharts/d3) oraz eksportem raportu do PDF.
- **Ranking Kont Bankowych i Promocji (`/konta`):** Zestawienie darmowych rachunków 0 zł z gwarantowaną premią gotówkową na start (do 650 zł) oraz filtrowaniem według korzyści.
- **Symulator Kredytu Hipotecznego (`/mortgage`):** Zaawansowany model z uwzględnieniem wkładu własnego (10-20%), marży banku, stawki WIBOR/WIRON oraz harmonogramu amortyzacji i nadpłat.
- **Konsolidacja Zobowiązań (`/loan?goal=debt`):** Symulator połączenia wielu drogich pożyczek w jedną ratę o obniżonym koszcie miesięcznym.
- **Planer Celów Oszczędnościowych (`/savings`):** Kalkulator procentu składanego, budowania poduszki finansowej i optymalizacji zysku z lokat.

### 2. 🏢 Moduł Weryfikacji Firm & B2B KRS/NIP (`/firma`)
- **Automatyczny audyt rejestrowy:** Integracja z rejestrami publicznymi – Biała Lista Podatników VAT (Ministerstwo Finansów), KRS oraz REGON.
- **Walidator NIP:** Rygorystyczna weryfikacja algorytmiczna sumy kontrolnej NIP (wagi 6, 5, 7, 2, 3, 4, 5, 6, 7 mod 11) odporna na fałszywe zapytania.
- **Scoring wiarygodności B2B:** Ocena ryzyka transakcyjnego kontrahenta, wyliczenie sugerowanego limitu kupieckiego oraz weryfikacja statusu VAT.
- **Monitoring Spółek B2B:** Rejestracja subskrypcji alertów zmian w KRS i kondycji finansowej podmiotów gospodarczych.

### 3. 🤖 Inteligentne Rekomendacje & Doradca AI (Gemini API)
- **Search Grounding NBP/WIBOR:** Pasek *Puls Rynku* zasilany przez `gemini-3.5-flash` z włączonym Google Search Grounding pobierający bieżące stopy procentowe NBP (5,75%) i stawkę WIBOR 3M.
- **AiOfferRecommendations:** Personalizowany silnik dopasowania ofert bankowych analizujący 14 parametrów profilu ryzyka, prezentujący konkretne benefity, wskaźnik zgodności (98.4%) oraz dynamiczne CTA.
- **Czatbot Doradca Finansowy:** Asystent AI wspierający użytkownika w optymalizacji budżetu domowego, porównaniu ofert i interpretacji umów kredytowych.

### 4. 📈 Bezpieczny Tracking Afiliacyjny & Idempotentny Postback
- **Server-Side Tracking (`/api/go`):** Generowanie deterministycznych, unikalnych identyfikatorów `clickid` (UUIDv4) zabezpieczających przed manipulacją parametrami kampanii.
- **Idempotencja Webhooka Postback (`/api/postback`):** Ochrona przed wielokrotnym zliczaniem prowizji – operacje bazodanowe typu `UPDATE ... WHERE id = :clickid` gwarantują spójność salda.
- **Scraper Katalogu M2M:** Moduł pobierania i buforowania (in-memory cache z 1h TTL) aktualnych kampanii finansowych.

### 5. 🎁 Program Poleceń & Kredyty Premium (Referral System)
- Unikalne kody polecające dla użytkowników.
- Zabezpieczenie przed manipulacją po stronie przeglądarki (weryfikacja kredytów wyłącznie po stronie serwera).
- Odblokowywanie pełnych raportów wywiadowni gospodarczej za polecenia serwisu.

---

## 🏗️ Architektura i Technologie

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 SPA)                         │
│   Vite · Tailwind CSS 4 · Framer Motion · Recharts · Lucide Icons     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │  Reverse Proxy / REST API
┌───────────────────────────────────▼────────────────────────────────────┐
│                       BACKEND (Node.js / Express)                      │
│   server.ts · router.ts · companyService.ts · referralManager.ts       │
└─────────┬─────────────────────────┬──────────────────────────┬─────────┘
          │                         │                          │
┌─────────▼───────────┐   ┌─────────▼───────────┐    ┌─────────▼─────────┐
│     AI ENGINE       │   │   DATA STORAGE      │    │    EXTERNAL DATA  │
│  Google Gemini API  │   │   Supabase (Postgres│    │  Biała Lista VAT  │
│  @google/genai SDK  │   │   Local Storage JSON│    │  Rejestry KRS/REG │
│  Search Grounding   │   │   In-Memory Cache   │    │  Katalog M2M      │
└─────────────────────┘   └─────────────────────┘    └───────────────────┘
```

- **Bezpieczeństwo kluczy:** Żadne klucze API (Gemini, Supabase Service Role) nie trafiają do bundle przeglądarki – cała komunikacja z modelami AI i rejestrami przechodzi przez bezpieczne proxy serwerowe.
- **Dual Persistence:** Zapis leadów, subskrypcji monitoringu oraz kliknięć realizowany dwutorowo: asynchroniczna replikacja do bazy Supabase oraz bezpieczny lokalny bufor fallback.
- **Zgodność prawna:** Pełna implementacja wymogów Art. 66 Kodeksu Cywilnego (wyliczenia oznaczone jako symulacje orientacyjne), brak telemetrii naruszającej RODO.

---

## 📁 Struktura Projektu

```text
├── .env.example                # Wzorzec konfiguracji zmiennych środowiskowych
├── index.html                  # Główny szablon HTML z metadanymi SEO i OpenGraph
├── metadata.json               # Konfiguracja uprawnień aplikacji w AI Studio
├── package.json                # Zależności i skrypty uruchomieniowe (Vite + Express)
├── server.ts                   # Główny serwer Express (API endpoints, Gemini proxy, SSR router)
├── vite.config.ts              # Konfiguracja buildera Vite z Tailwind CSS v4
│
└── src/
    ├── App.tsx                 # Główny router aplikacji React
    ├── index.css               # Globalne style, motyw, animacje CSS i typography
    ├── main.tsx                # Entry-point React DOM
    │
    ├── components/             # Komponenty interfejsu użytkownika
    │   ├── AboutUs.tsx         # Strona informacyjna o portalu i zespole
    │   ├── AiOfferRecommendations.tsx # Karta wyselekcjonowanej rekomendacji AI
    │   ├── AmortizationChart.tsx     # Wykres amortyzacji rat kredytowych
    │   ├── AnimatedNumber.tsx        # Płynny licznik liczb z easingiem
    │   ├── BankAccountsHub.tsx       # Ranking darmowych kont z premią
    │   ├── Chatbot.tsx               # Czatbot doradcy finansowego Gemini
    │   ├── CompanyAnalysis.tsx       # Narzędzie audytu B2B firm i KRS/NIP
    │   ├── FinancialNews.tsx         # Moduł bieżących newsów gospodarczych
    │   ├── FinancialProtocolFunnel.tsx # Lejek profilowania finansowego
    │   ├── Home.tsx                  # Strona główna z Szybkimi Narzędziami
    │   ├── Layout.tsx                # Nagłówek, stopka i nawigacja
    │   ├── LiveCounter.tsx           # Wskaźnik aktywności live
    │   ├── LiveMarketTicker.tsx      # Przewijany pasek pulsu rynkowego NBP/WIBOR
    │   ├── LoanCalculator.tsx        # Główny kalkulator kredytów gotówkowych
    │   ├── MortgageSimulator.tsx     # Symulator kredytów hipotecznych
    │   ├── PrivacyPolicy.tsx         # Polityka prywatności zgodna z RODO
    │   ├── ReferralModal.tsx         # Panel programu poleceń
    │   ├── SavingsGoal.tsx           # Kalkulator oszczędzania i lokat
    │   ├── SystemHealthCheck.tsx     # Wewnętrzny panel diagnostyczny API
    │   └── Terms.tsx                 # Regulamin świadczenia usług
    │
    ├── context/                # Konteksty stanu React (Theme, ViewMode)
    ├── lib/                    # Klient Supabase i helpery storage
    ├── server/                 # Logika biznesowa backendu
    │   ├── companyService.ts   # Integracja rejestrów KRS, REGON i Białej Listy VAT
    │   ├── leadManager.ts      # Obsługa bazy leadów i monitoringu firm
    │   ├── nipValidator.ts     # Algorytmiczna walidacja sumy kontrolnej NIP
    │   ├── referralManager.ts  # Zarządzanie kodami poleceń i kredytami
    │   ├── router.ts           # Routing ofert i silnik dopasowania
    │   ├── scraper.ts          # Pobieranie i buforowanie katalogu kampanii
    │   └── tracker.ts          # Rejestracja kliknięć i obsługa postbacków
    └── services/               # Klienty API dla warstwy frontendu
```

---

## ⚡ Endpointy API (Backend)

| Metoda | Endpoint | Opis |
| :--- | :--- | :--- |
| `POST` | `/api/offers` | Zwraca oferty dopasowane do profilu finansowego użytkownika |
| `POST` | `/api/ai-offers` | Dobór rekomendacji przez model Google Gemini z uzasadnieniem |
| `GET` | `/api/market-pulse` | Bieżące wskaźniki rynkowe (NBP/WIBOR) z Google Search Grounding |
| `GET` | `/api/go` | Bezpieczne przekierowanie afiliacyjne z wygenerowanym `clickid` |
| `GET` / `POST` | `/api/postback` | Idempotentny webhook rejestracji konwersji i prowizji |
| `POST` | `/api/company/diagnostic` | Audyt spółki po NIP (KRS, REGON, VAT, ryzyko transakcyjne) |
| `POST` | `/api/company/monitor` | Zapis na monitoring zmian i alertów prawno-finansowych spółki |
| `POST` | `/api/leads` | Rejestracja kontaktu klienta zainteresowanego ofertą |
| `GET` | `/api/health` | Diagnostyka statusu połączenia z bazą danych i Gemini API |

---

## 🚀 Uruchomienie Lokalne (Quickstart)

### Wymagania:
- **Node.js** v20.x lub nowszy
- **npm** v10.x lub nowszy

### Kroki instalacji:

1. **Sklonuj repozytorium:**
   ```bash
   git clone https://github.com/twoj-login/kalkulator-ofert-kredytowych.git
   cd kalkulator-ofert-kredytowych
   ```

2. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

3. **Skonfiguruj zmienne środowiskowe:**
   Skopiuj `.env.example` do `.env` i uzupełnij wymagane klucze:
   ```bash
   cp .env.example .env
   ```
   *Wymagane zmienne:*
   - `GEMINI_API_KEY` – klucz do Google AI Studio API (wymagany do rekomendacji i czatbota)
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` – opcjonalna integracja trwałej bazy danych
   - `POSTBACK_SECRET` – opcjonalny sekret zabezpieczający webhooki sieci afiliacyjnych

4. **Uruchom środowisko deweloperskie:**
   ```bash
   npm run dev
   ```
   Aplikacja uruchomi się pod adresem: `http://localhost:3000`

5. **Weryfikacja i budowanie wersji produkcyjnej:**
   ```bash
   # Kontrola typów i linting
   npm run lint

   # Pełna kompilacja produkcyjna (bundle klienta + serwer)
   npm run build

   # Uruchomienie skompilowanego środowiska
   npm start
   ```

---

## 🛡️ Bezpieczeństwo i Transparentność

- Platforma prowadzona jest przez **Zespół RaportFinansowy24**.
- Wszystkie kalkulacje są bezpłatne i nie wymagają podawania danych logowania do bankowości.
- Wszelkie prezentowane dane finansowe mają charakter symulacji edukacyjno-analitycznej w rozumieniu Art. 66 Kodeksu Cywilnego.
- Kontakt z redakcją: `raportfinansowy24@gmail.com`.

---
*© 2026 RaportFinansowy24.pl – Wszelkie prawa zastrzeżone.*
