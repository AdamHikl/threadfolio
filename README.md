# Threadfolio

**A pocket guide and collection app for people who buy vintage clothing to wear and collect.**

See a piece you like in a vintage shop or at a flea market and take a photo. Threadfolio tells you:

- **What it is:** category, likely brand, and era (with a confidence level).
- **What it costs:** a price range for buying it new and a typical range in vintage shops, plus a verdict on the price on the tag: *Good deal / Fair / Overpriced*.
- **What to check before buying:** a short checklist for that kind of piece: labels and tags, stitching, zippers, stains, odour, sizing, and signs of a reprint.

If you buy it, save it to your **collection**, see what the collection is worth, and **build outfits** from the pieces you own. Keep a **wishlist** of pieces you're hunting, with an estimated total cost.

Threadfolio is built for buyers, not resellers: it helps you avoid overpaying and enjoy what you own, not flip it for profit.

> Status: early development. See [ROADMAP.md](ROADMAP.md) for what's being built next, [docs/QUALITY_GATES.md](docs/QUALITY_GATES.md) for the checks each step must pass, and [docs/PLAN.md](docs/PLAN.md) for the full build plan.

## Who it's for

- Vintage shoppers deciding "should I buy this, and is the price fair?"
- Collectors who want to catalogue, style and show off their pieces.
- Hunters with a wishlist and a budget.

## Built with

- [Expo](https://expo.dev) + React Native + TypeScript (one codebase for iOS and Android)
- Local-first storage on the device (SQLite). No account needed, and your collection stays on your phone.
- A small scan service (an [Expo Router API route](src/app/api/scan+api.ts)) that sends the photo to Claude's vision model and returns structured JSON. It keeps the API key on the server and does not store photos.

## Privacy

Your collection, wishlist and outfits are stored only on your device. A photo is sent to the scan service only when you tap **Scan**, is used to answer that request, and is not kept. There are no accounts, no tracking and no ads.

## Run it

Requirements: Node.js 20+ and the [Expo Go](https://expo.dev/go) app on your phone (or an iOS Simulator / Android emulator).

```bash
git clone https://github.com/AdamHikl/threadfolio.git
cd threadfolio
npm install
cp .env.example .env   # optional: add ANTHROPIC_API_KEY for real scans
npx expo start         # scan the QR code with Expo Go, or press i / a
```

Without an API key, scans return a made-up sample result so you can try the whole flow at no cost. With `ANTHROPIC_API_KEY` set in `.env`, the `/api/scan` route sends the photo to Claude. The key is read only on the server and never ships in the app.

- **Quick scan** (default): Claude Sonnet 5.5, no web search. About 5–8 seconds and about $0.01 per scan.
- **Deep check** (button on the result): Claude Opus 5.5 with web search for current listings, collector forums and guides, plus the sources it checked. About 15–20 seconds and about $0.12 per scan.

These defaults come from a comparison on test photos; run your own with `npm run compare -- <photo-folder>` (results go to the git-ignored `eval-results/`). Override the models with `SCAN_MODEL` and `SCAN_DEEP_MODEL`.

Development builds also fill the app with a few made-up sample pieces so the screens aren't empty. Those sample pieces have no photos. For testing with real pictures, eight openly licensed clothing photos are in [`assets/sample-photos/`](assets/sample-photos/CREDITS.md); they aren't linked to the sample pieces yet.

Checks (the same ones CI runs):

```bash
npm run typecheck
npm run lint
npm test
```

## Contributing

Issues and pull requests are welcome. Please use made-up sample data in issues and tests, never real personal data, and never commit API keys (`.env` is git-ignored; use `.env.example`).

## License

[Mozilla Public License 2.0](LICENSE) (MPL-2.0). Copyright (C) 2026 Adam Hikl.

If you modify Threadfolio's files and distribute them, you must share those modified files under MPL 2.0. The license does not grant rights to the "Threadfolio" name or logo.

The sample clothing photos in [`assets/sample-photos/`](assets/sample-photos/CREDITS.md) are not covered by MPL 2.0. They come from Wikimedia Commons under their own licenses (CC0, public domain, CC BY 2.0, CC BY-SA 2.0 and CC BY-SA 4.0), with authors and sources listed in [CREDITS.md](assets/sample-photos/CREDITS.md).

This line was added by a Jorah build test on 2026-11-10 to try draft pull requests.
