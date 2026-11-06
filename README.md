# Threadfolio

**A pocket guide and collection app for people who buy vintage clothing to wear and collect.**

See a piece you like in a vintage shop or at a flea market and take a photo. Threadfolio tells you:

- **What it is:** category, likely brand, and era (with a confidence level).
- **What it costs:** a price range for buying it new and a typical range in vintage shops, plus a verdict on the price on the tag: *Good deal / Fair / Overpriced*.
- **What to check before buying:** a short checklist for that kind of piece: labels and tags, stitching, zippers, stains, odour, sizing, and signs of a reprint.

If you buy it, save it to your **collection**, see what the collection is worth, and **build outfits** from the pieces you own. Keep a **wishlist** of pieces you're hunting, with an estimated total cost.

Threadfolio is built for buyers, not resellers: it helps you avoid overpaying and enjoy what you own, not flip it for profit.

> Status: early development. See [ROADMAP.md](ROADMAP.md) for what's being built next and [docs/PLAN.md](docs/PLAN.md) for the full build plan.

## Who it's for

- Vintage shoppers deciding "should I buy this, and is the price fair?"
- Collectors who want to catalogue, style and show off their pieces.
- Hunters with a wishlist and a budget.

## Built with

- [Expo](https://expo.dev) + React Native + TypeScript (one codebase for iOS and Android)
- Local-first storage on the device (SQLite). No account needed, and your collection stays on your phone.
- A small scan service (planned: a serverless function) that sends the photo to a vision AI model for identification. It keeps the API key on the server and does not store photos.

## Privacy

Your collection, wishlist and outfits are stored only on your device. A photo is sent to the scan service only when you tap **Scan**, is used to answer that request, and is not kept. There are no accounts, no tracking and no ads.

## Run it

Requirements: Node.js 20+ and the [Expo Go](https://expo.dev/go) app on your phone (or an iOS Simulator / Android emulator).

```bash
git clone https://github.com/AdamHikl/threadfolio.git
cd threadfolio
npm install
cp .env.example .env   # then set EXPO_PUBLIC_SCAN_API_URL
npx expo start         # scan the QR code with Expo Go, or press i / a
```

## Contributing

Issues and pull requests are welcome. Please use made-up sample data in issues and tests, never real personal data, and never commit API keys (`.env` is git-ignored; use `.env.example`).

## License

[GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only). Copyright (C) 2026 Adam Hikl.
