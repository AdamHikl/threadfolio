# Roadmap

Milestones are in order. Each one should end with a working app you can try on a phone. Hour figures are rough estimates.

## M0 — Foundations (~4 h)
- [x] Expo + TypeScript scaffold
- [x] AGPL v3 license, README, roadmap, `.env.example`
- [x] Navigation with tabs: Scan · Collection · Outfits · Wishlist
- [x] Local SQLite database and data model (items, photos, outfits, wishlist)
- [x] Collection and wishlist lists with value totals (made-up sample data in dev builds)
- [x] Lint, typecheck and unit tests in CI (GitHub Actions)

## M1 — Scan and decide (~15 h) ← first usable version
- [ ] Camera / photo picker, with an optional second photo of the label or tag
- [ ] Scan service (serverless function) that calls a vision model and returns structured JSON: category, brand, era, materials, confidence
- [ ] Price card: new price range, vintage shop range, and confidence
- [ ] "Is this a fair price?" Enter the tag price and get *Good deal / Fair / Overpriced*
- [ ] "Before you buy" checklist for each category and era (curated rules + AI notes)
- [ ] "Check real prices" links to sold-listing searches (eBay, Etsy, Depop) that open in the browser
- [ ] Save to Collection or Wishlist

## M2 — Collection (~10 h)
- [ ] Collection grid with filters (category, era, brand, colour)
- [ ] Item detail: photos, story, where and when bought, price paid vs. estimated value
- [ ] Collection total value and value over time
- [ ] Background removal for clean item cut-outs
- [ ] Care guide for each item

## M3 — Wishlist (~6 h)
- [ ] Wishlist entries by brand, category, era and target price
- [ ] Estimated wishlist total cost
- [ ] Turn a wishlist entry into a collection item when you buy it

## M4 — Outfits (~12 h)
- [ ] Outfit canvas: drag cut-outs, layer, resize
- [ ] Save outfits and tag them by occasion and season
- [ ] "Does it go with what I own?" Preview a scanned piece next to collection items before buying
- [ ] Simple outfit suggestions from your own collection

## M5 — Polish and launch (~10 h)
- [ ] Onboarding, empty states, accessibility pass (Dynamic Type, VoiceOver/TalkBack)
- [ ] Export and import a backup of your collection (JSON + photos)
- [ ] Shareable outfit or collection image
- [ ] Freemium: free scans per month, subscription for unlimited scans
- [ ] TestFlight / Play internal testing, then store release

## Later ideas
- Wishlist alerts when a matching listing appears (affiliate-labelled)
- Vintage sizing converter and measurement guide
- Optional paid expert authentication for high-value pieces
- Optional cloud sync between devices
