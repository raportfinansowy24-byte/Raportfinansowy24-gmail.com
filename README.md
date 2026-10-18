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


## Content attribution & revenue dashboard

The first-party content tracker records page views, affiliate clicks, leads, and confirmed affiliate conversions with attribution fields for `video_id`, `hook_id`, `platform`, `topic`, and UTM tags.

### Required setup

1. Apply `supabase/migrations/202610180001_content_analytics_events.sql` in the Supabase SQL Editor.
2. Configure server environment variables:
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the existing Supabase connection.
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for server-only analytics reads/writes. Never expose the service-role key to the browser.
   - `ANALYTICS_ADMIN_TOKEN` for the protected report endpoint and dashboard.
   - Keep `POSTBACK_SECRET` configured for affiliate postbacks.
3. Deploy the application. The site loads `/analytics.js` from `index.html`; it stores first-party attribution in session storage and a first-party cookie and sends page-view events.
4. Open `/analytics-dashboard.html`, enter `ANALYTICS_ADMIN_TOKEN`, and load the report.

### Link format for every social video

Use stable identifiers per published creative and hook. Example:

```text
https://raport-finansowy24.pl/?video_id=tt-20261018-001&hook_id=hook-a&platform=tiktok&topic=oszczednosci&utm_source=tiktok&utm_medium=organic&utm_campaign=shorts-2026-10&utm_content=tt-20261018-001-hook-a
```

Supported topic labels include `kredyty`, `oszczednosci`, `konta_bankowe`, and `promocje`. When a visitor clicks a same-site `/api/go` link, the tracker appends the attribution fields and the server creates a click ID. The lead endpoint reads the first-party attribution cookie. Affiliate conversions are added only from the protected `/api/postback` flow and matched to the originating click ID.

### Test vs real revenue

Add `rf24_test=1` to a test landing URL to mark its page views, clicks, and resulting attributed postback as test data. The dashboard excludes test events by default; enable “Uwzględnij zdarzenia testowe” to inspect them. Never use a real campaign's click ID for a test postback. A conversion is treated as confirmed revenue only when a valid affiliate postback is received. The reporting table also prevents duplicate conversion events per click ID.

### Limitations / operational checks

- The migration must be applied and the service-role key configured before the protected report can return data.
- Affiliate networks must pass the original `epi`/`clickid` back to `/api/postback`; without this, commission cannot be attributed to a video or hook.
- Browser analytics are first-party and may be blocked by browser settings or consent controls. Ensure the site's consent/privacy disclosures are appropriate for the deployment jurisdiction.
- This dashboard reports tracked events; it does not import social-platform view/impression counts. Those require platform APIs or manual imports.
