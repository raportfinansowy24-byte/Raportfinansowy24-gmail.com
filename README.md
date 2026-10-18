# RaportFinansowy24 – Nowoczesna Platforma Analityki Finansowej & Doradca AI 🚀

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.2-lightgrey?logo=express)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-3.5_Flash-orange?logo=google)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-green?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

Kompleksowa platforma internetowa (Full-Stack SPA) łącząca niezależną analitykę konsumencką (B2C), zaawansowane symulatory bankowe, moduł weryfikacji kontrahentów (B2B KRS/NIP), silnik rekomendacji AI i tracking afiliacyjny.

---

## Wymagania i Quickstart (zaktualizowane)

### Wymagania:
- Node.js v18.x (zalecane)
- npm

### Kroki instalacji:

1. **Sklonuj repozytorium:**
```bash
git clone https://github.com/raportfinansowy24-byte/Raportfinansowy24-gmail.com.git
cd Raportfinansowy24-gmail.com
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
- `NEWS_API_KEY` – klucz do NewsAPI (używany przez /api/news)
- `POSTBACK_SECRET` – sekret używany do weryfikacji postbacków (x-postback-secret)
- `SUPABASE_URL` i `SUPABASE_KEY` – konfiguracja Supabase (opcjonalne, jeśli używasz Supabase)

4. **Uruchom środowisko deweloperskie:**
```bash
npm run dev
```
Aplikacja uruchomi się pod adresem: `http://localhost:3000`

---

> Dodatkowe uwagi bezpieczeństwa: aplikacja domyślnie zezwala na wszystkie originy CORS w środowisku deweloperskim. W produkcji ustaw `CORS_ALLOWED_ORIGINS` na listę dozwolonych domen i skonfiguruj `POSTBACK_SECRET`.

(Reszta README pozostaje bez zmian. Zaktualizowano sekcję Quickstart, wymagane zmienne oraz referencję repo klonowania.)
