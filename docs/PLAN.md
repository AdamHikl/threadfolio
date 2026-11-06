# Build plan: getting Threadfolio working fast

Goal: a usable **scan → decide → save** loop on a real phone within the first ~20 hours, then grow from there. The milestone checklist is in [ROADMAP.md](../ROADMAP.md).

## Principles

1. **Customer first.** Every screen answers a buyer's question ("is it real?", "is it fair?", "does it go with my stuff?"), not a reseller's.
2. **Honest numbers.** Prices are always shown as ranges with a confidence level and a "check real prices" link. Never show a single exact value we can't back up.
3. **Local-first and private.** No accounts in v1. The collection lives on the device. Photos go to the scan service only for the request and are not stored.
4. **Ship small.** Each milestone ends with something you can try in Expo Go.

## Architecture

```
Phone (Expo app)                          Scan service (serverless)
┌──────────────────────────┐   photo     ┌─────────────────────────────┐
│ Scan · Collection ·      │ ──────────▶ │ validate + resize image     │
│ Outfits · Wishlist       │             │ call vision model (key here)│
│ SQLite + photos on device│ ◀────────── │ return JSON (schema-checked)│
└──────────────────────────┘  JSON only  │ no storage, rate-limited    │
                                         └─────────────────────────────┘
```

- **App:** Expo (managed workflow), TypeScript, Expo Router (tabs), `expo-sqlite`, `expo-camera` / `expo-image-picker`, `expo-file-system` for photos.
- **Scan service:** an Expo Router API route, `POST /api/scan` ([src/app/api/scan+api.ts](../src/app/api/scan+api.ts)), served by the dev server locally and deployable to EAS Hosting. It holds the AI provider key so the key never ships in the app. It asks Claude for a strict JSON shape ([src/scan/schema.ts](../src/scan/schema.ts): category, brand, era, materials, new and vintage price ranges, confidence, checks) using structured outputs, and the app validates the response with the same zod schema. With no key set, it returns a made-up mock result.
- **Checklist:** a curated rules file in the repo (`src/checks/*.ts`, by category and era: denim, band tees, leather, knitwear, outerwear and more), merged with AI-specific notes. The curated rules are the part competitors don't have.
- **Prices in v1:** AI estimate shown as a range with confidence, plus deep links to sold-listing searches on eBay, Etsy and Depop so the user can verify. No scraping. A licensed price-data source can come later.

## Data model (v1)

- `item`: id, status (`collection` | `wishlist` | `scanned`), category, brand, era, colour, size, photos[], pricePaid, newRange, vintageRange, confidence, notes, acquiredAt, acquiredWhere
- `outfit`: id, name, occasion, season, layout (item positions), createdAt
- `wishlist_target`: id, query (brand, category, era), targetPrice

## First sessions, in order

1. Tabs + SQLite schema + a seeded **fake** sample collection for development.
2. Camera screen → stub scan response (local JSON) → result card UI.
3. Real scan service with schema validation; switch the app from the stub to the service.
4. Fair-price verdict + checklist rules for the first 5 categories.
5. Save to collection or wishlist; collection grid; totals.

After step 5 the core loop works end to end, and it's ready for friends to test.

## Risks and how we handle them

| Risk | Mitigation |
|---|---|
| AI price estimates are wrong | Ranges + confidence + "check real prices" links; collect user feedback ("was this right?") |
| Sold-price data is hard to get | Start without it; look at licensed data or partnerships later |
| Scan costs | Resize images on the device, limit free scans, cache repeat scans |
| Users stop using a wardrobe app | Make the outfit builder and collection fun to open every day, not just at scan time |
| Privacy | Local-first, no accounts, photos not stored on the server |
