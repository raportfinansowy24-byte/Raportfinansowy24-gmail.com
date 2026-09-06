# Financial Freedom - My to Sukces 🚀

Zaawansowana aplikacja internetowa do symulacji finansowych i generowania spersonalizowanych ofert przy użyciu AI. Projekt pozwala na kalkulację kredytów, symulację hipotek, planowanie oszczędności.  

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🎯 Główny Prompt Projektu

> *"Zbuduj zaawansowaną aplikację finansową typu Single Page Application w React (TypeScript, Tailwind CSS, Vite) działającą w trybie Full-Stack z użyciem Express. Aplikacja powinna łączyć analitykę finansową z nowoczesnym UI z animacjami. Główne moduły to: Kalkulator Kredytowy (Loan), Symulator Kredytu Hipotecznego (Mortgage) i Cel Oszczędnościowy (Savings target). Ponadto wbudowany powinien być Chatbot AI z asystentem finansowym bazującym na Gemini API. Projekt powinien wspierać responsywność, dynamiczne motywy (dark/high-contrast), powiadomienia, wyzwalanie rekomendacji ofertowych (AI Offer Recommendations) oraz agregację newsów (scraper)."*

---

## ✨ Aktualne Funkcje (Features)

1. **📱 Dashboard / Nawigacja:**
   - Nowoczesny, "neonowy" i responsywny interfejs.
   - Płynne animacje i nawigacja między modułami: Kredyty, Hipoteka, Oszczędności (slider/swipe view).
   - Dynamiczna zmiana dostępnych motywów UI, w tym tryb High Contrast.

2. **📊 Kalkulator Kredytowy (Loan Calculator):**
   - Obliczanie rat kredytowych, wygenerowany harmonogram.
   - Prezentacja wyników za pomocą interaktywnych wykresów (Recharts, d3).
   - Generowanie podsumowań m.in. w pliku PDF.

3. **🏠 Symulator Hipoteki (Mortgage Simulator):**
   - Pozwala na wprowadzanie zaawansowanych parametrów odnośnie nieruchomości.
   - Uwzględnia nadpłaty, zmiany oprocentowania i wyświetla wykresy amortyzacji.

4. **💰 Planowanie Oszczędności (Savings Goal):**
   - Wizualizacja postępów we wdrażaniu celu finansowego.
   - Kalkulator rat, które pomogą osiagnąć wyznaczony target np. dla emerytury, kupna auta.

5. **🤖 Asystent AI / Chatbot (Gemini API):**
   - Zintegrowany Chat widoczny na wszystkich ekranach z możliwością minimalizacji.
   - Inteligentne doradztwo wspierane Google Gemini API w zakresie finansów, ofert kredytowych i budżetu domowego.
   - Podpięty moduł `AiOfferRecommendations.tsx` dopasowujący usługi.

6. **📰 Aktualności Finansowe (Financial News) + Real-Time:**
   - Moduł pobierania i wyświetlania istotnych informacji gospodarczych / wskaźników z backendu.
   - Live Counter aktualizowane w czasie rzeczywistym.

---

## 📁 Struktura Plików Projekowych

```text
├── .env.example                # Szablony kluczy powiązanych z bazą (Supabase/Firebase) i AI (Gemini)
├── src/                        # Główny kod źródłowy React (Client) & Express (Server)
│   ├── components/             # Komponenty UI (kalkulatory, wykresy, layout, powiadomienia)
│   │   ├── AiOfferRecommendations.tsx
│   │   ├── AmortizationChart.tsx
│   │   ├── Chatbot.tsx
│   │   ├── FinancialNews.tsx
│   │   ├── Layout.tsx
│   │   ├── LiveCounter.tsx
│   │   ├── LoanCalculator.tsx
│   │   ├── MortgageSimulator.tsx
│   │   ├── SavingsGoal.tsx
│   │   ├── NotificationSystem.tsx
│   │   └── Timer.tsx
│   ├── context/                # Context API np. tryby jasne/ciemne i stan finansowy (ThemeContext.tsx)
│   ├── lib/                    # Interfejs bazodanowy i storage np. Supabase
│   ├── server/                 # Backend node w technologii Express 
│   │   ├── router.ts           # Definicje endpointów API
│   │   ├── scraper.ts          # Integracje zewnętrzne - web scrapping 
│   │   └── tracker.ts          # Moduł statystyk
│   ├── services/               # Serwisy odpowiedzialne za logikę biznesową, API do usług zew.:
│   │   ├── affiliate.service.ts
│   │   ├── aiOfferService.ts
│   │   ├── financial-state.service.ts
│   │   └── m2m.service.ts
│   ├── App.tsx                 # Główny stan nawigacyjny frontendu aplikacji
│   ├── main.tsx                # Zaczepienie root'a Vite & React 19 StrictMode
│   └── index.css               # Reguły styli CSS, definicja Tailwind, animacje, fonty
├── server.ts                   # Kod entry-point silnika backend API
├── vite.config.ts              # Konfiguracja build narzędzia Vite + React + Tailwind
└── package.json                # Lista wszystkich zainstalowanych zależności i konfiguracja skryptów 'npm'
```

---

## 📸 Zrzuty Ekranu (Screenshots)

Poniżej znajduje się przestrzeń na umieszczenie widoków z aplikacji. *(W edytorze GitHub przeciągnij obrazy, aby je automatycznie załadować).*

### 1. Panel Kalkulatora Kredytowego
![Screenshot-Kredyty]() 
*(Przeciągnij swój plik obrazka dla Kalkulatora tutaj)*

### 2. Panel Symulatora Hipoteki
![Screenshot-Hipoteka]()
*(Przeciągnij obrazek pokazujący wprowadzanie parametrów hipotecznych i wykres amortyzacji)*

### 3. Panel Celu Oszczędnościowego
![Screenshot-Oszczednosci]()
*(Przeciągnij screenschot paska i wyników dla Oszczędzania)*

### 4. Wygląd Modułu Chatbota AI
![Screenshot-Chatbot]()
*(Przeciągnij screenshot okna komunikacji z Doradcą)*

### 5. Rekomendacje Ofert AI i Wiadomości (Mobile/Desktop)
![Screenshot-Rekomendacje]()
*(Przeciągnij widok powiadomień lub okna wyświetlającego sugerowane usługi)*

---

## 🚀 Jak uruchomić projekt (Local Setup)

1. Upewnij się, że posiadasz zainstalowane **Node.js** (min. v20)
2. Sklonuj to repozytorium GitHub.
3. Załaduj wymagane zależności projektowe, wykonując komendę:
   ```bash
   npm install
   ```
4. Utwórz plik `.env` zgodnie ze wzorem `.env.example` i uzupełnij klucz `GEMINI_API_KEY`.
5. Uruchom serwer developerski:
   ```bash
   npm run dev
   ```
6. Aplikacja znajduje się w przeglądarce pod adresem: `http://localhost:3000`

---
*Created dynamically at AI Studio.*
