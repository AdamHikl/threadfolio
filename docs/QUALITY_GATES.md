# Quality gates

Every step in [ROADMAP.md](../ROADMAP.md) is listed here with the checks that must pass before it can be ticked off. A roadmap box is ticked only when all of that step's gates are ticked, or when an unticked gate is explicitly moved to a later step.

Tick a gate only with evidence: a passing command, a test, a screenshot or screen recording, or a commit. "It should work" is not evidence. Keep the levels of evidence separate: passing code checks don't prove the simulator works, and the simulator doesn't prove a real phone works.

## Gates for every step

These apply to every step on top of its own gates.

| ID | Gate | How to check |
|---|---|---|
| **C1** | Typecheck, lint and tests pass locally | `npm run typecheck && npm run lint && npm test` |
| **C2** | CI is green on GitHub for the commit | GitHub → Actions |
| **C3** | New logic has unit tests (money, data, parsing, prompts' inputs/outputs) | Tests in `*.test.ts` next to the code |
| **S1** | Works in the iOS Simulator (Expo Go), following the step's test steps | Screenshot or written steps + result |
| **D1** | Works on a physical iPhone | Expo Go or a development build on a real device |
| **D2** | Works on Android (emulator or phone) | Same steps as S1 |
| **A1** | Accessible: every control has a label and role, tap targets ≥ 44 pt, text scales with Dynamic Type, works in light and dark mode | VoiceOver pass + Larger Text setting |
| **P1** | No secrets or real personal data in the repo or its history | `gitleaks git .` clean; `.env` not tracked; sample data is made up |
| **P2** | Nothing leaves the phone except what the step needs (only scan photos go to `/api/scan`, and the server stores nothing) | Code review of network calls |
| **R1** | README, ROADMAP and this file are updated | Diff |

Current status of the shared gates:
- **C2 is blocked:** GitHub Actions won't start jobs while the account has a billing lock. Until that's fixed, C1 is the only code gate actually run.
- **D1 and D2 have not been run for any step yet.** Every ticked roadmap step below is verified only up to the simulator (S1).

---

## M0 — Foundations

### M0.1 Expo + TypeScript scaffold — ✅ done
- [x] App bundles for iOS (`npx expo export --platform ios`)
- [x] Opens in Expo Go on the iOS Simulator
- [ ] Opens on Android (D2)

### M0.2 License, README, roadmap, `.env.example` — ✅ done
- [x] `LICENSE` is MPL 2.0 and GitHub detects it as `MPL-2.0` (switched from AGPL v3 to avoid BYOP's extra approval)
- [x] README says what it does, who it's for, what it's built with and how to run it
- [x] `.env.example` has placeholders only; `.env` is git-ignored and was never committed
- [x] gitleaks clean on the full history (P1)

### M0.3 Navigation with tabs — ✅ done
- [x] Scan, Collection, Outfits and Wishlist tabs switch correctly in the simulator
- [x] Tab icons and header use the app's light theme colours
- [ ] Dark mode checked on screen (A1)
- [ ] Android check (D2)

### M0.4 Local SQLite database and data model — ✅ done
- [x] Schema runs in real SQLite (checked with `sqlite3`)
- [x] Migrations are versioned with `PRAGMA user_version`; shipped migrations are never edited
- [x] Made-up sample data is seeded in development builds only, and only into an empty database
- [ ] Upgrade test: a database on version N migrates cleanly to N+1 (needed before the first schema change ships)

### M0.5 Collection and wishlist lists with totals — ✅ done
- [x] Unit tests for collection totals and wishlist totals (target price overrides the range)
- [x] Totals on screen match the pieces shown (simulator: 4 pieces, $403 paid)

### M0.6 Lint, typecheck and tests in CI — ✅ done (CI gate blocked)
- [x] `.github/workflows/ci.yml` runs typecheck, lint and tests
- [x] All three pass locally (C1)
- [ ] A CI run passes on GitHub (C2): blocked by the account billing lock

---

## M1 — Scan and decide

### M1.1 Camera / photo picker with optional label photo — ✅ done
- [x] Picking from the photo library works in the simulator
- [x] Photos are resized to 1280 px JPEG before upload
- [ ] Taking a photo with the camera works (needs D1: the simulator has no camera)
- [ ] Adding a label photo works and is sent as the second image
- [ ] Denying camera permission shows the "Camera access needed" message

### M1.2 Scan service (`/api/scan`) — ✅ done
- [x] Returns JSON that validates against `ScanResponseSchema`, with the real API and in mock mode
- [x] Bad input returns 400; other HTTP methods return 405
- [x] The API key and server code are not in the app bundle (checked in the exported iOS bundle)
- [x] Photos are not stored on the server (P2)
- [ ] Oversized photo returns 413 (not tested yet)
- [ ] Refusal and provider errors show a friendly message in the app (not tested yet)

### M1.3 Mock mode — ✅ done
- [x] With no API key, scans return the sample result at no cost (curl and simulator)
- [x] The sample result says it's a sample

### M1.4 Price card — ✅ done
- [x] Shows new and vintage ranges and a confidence label (simulator)
- [x] Ranges are ordered and clamped (unit tests for `normalizeScanResult`)

### M1.5 "Is this a fair price?" — ✅ done
- [x] Unit tests for the verdict at, below and above the range, and for price parsing ("45", "$1,200", "45.50", invalid input)
- [x] Typing $200 against $90–$180 shows "Overpriced" (simulator)

### M1.6 "Before you buy" checklist — ✅ done
- [x] Unit tests: AI checks first, then category and general checks, without duplicates
- [x] Items can be ticked (simulator)

### M1.7 "Check real prices" links — ✅ done
- [x] Unit tests for URL encoding and empty queries
- [x] Tapping a link opens the marketplace search in the browser (simulator)

### M1.8 Save to Collection or Wishlist with photos — ✅ done
- [x] "I bought it" saves to the collection with the tag price as price paid, and the list updates (simulator)
- [x] Photos are copied into the app's own storage and show as thumbnails
- [x] Unit tests for `itemFromScan`
- [ ] "Add to wishlist" from a scan checked on screen

### M1.9 Model comparison — ✅ done
- [x] 48 runs (8 photos × 3 models × with/without search), no errors, with time and cost per run
- [x] Photos are openly licensed, git-ignored, and their sources and licenses are recorded
- [x] Results compared against known answers, not just against each other

### M1.10 Quick scan (Sonnet) and Deep check (Opus + web search) — ✅ done
- [x] Unit tests for mode settings, defaults and environment overrides
- [x] Both modes work through the real API route (aloha shirt: 7.9 s quick, 17 s deep with 6 sources)
- [x] Deep check keeps the quick result while loading and on failure; shows sources; the Deep check card hides afterwards (simulator)
- [x] Web sources are shown with links, as required when showing web search results

### M1.11 Larger comparison with known prices — ⬜ open
- [ ] At least 30 photos with a known sold price or real purchase price
- [ ] Each photo run twice per setup to measure consistency
- [ ] Report: share of real prices inside the predicted range, average range width, and how often era and brand are right
- [ ] Decision recorded in README: keep or change the quick and deep models

### M1.12 Detail rules and asking for a label photo — ⬜ open (partly done)
- [x] Prompt includes collector dating tells (Levi's big E, single stitch, union labels, RN/WPL numbers, zip makers)
- [x] Retest: on the big-E jeans, the scan flags the possible valuable variant, widens the range and asks for a tab photo
- [ ] In the app, a scan that flags a possible valuable variant offers a one-tap "Add label photo and rescan"
- [ ] No regression: the small-e jeans and other test photos keep sensible ranges

### M1.13 Deploy the scan route with rate limiting — ⬜ open
- [ ] Deployed to EAS Hosting; production builds point at it (`origin` set)
- [ ] Rate limit per device or IP; abuse returns 429
- [ ] The API key lives only in the hosting environment's secrets
- [ ] Spend alert or cap set in the Anthropic Console
- [ ] Scan works from a physical phone on mobile data, not just Wi-Fi to the Mac (D1)

### M1.14 Checklist rules by era — ⬜ open
- [ ] Rules keyed by category and era, with unit tests
- [ ] Every rule is reviewed by a person, not generated

---

## M2 — Collection

### M2.1 Collection list with thumbnails and category filters — ✅ done
- [x] Thumbnails show the main photo, with a placeholder when there's none (simulator)
- [x] Category chips filter the list and the totals follow the filter (simulator: Denim → 1 piece, $45)
- [x] Chips are hidden when there's only one category
- [x] Unit test for `categoriesIn`

### M2.2 Item detail screen — ✅ done
- [x] Shows photos, price paid against worth now, where and when bought, and notes (simulator)
- [x] Back button and header layout correct on iOS
- [ ] Label photo shown next to the main photo (no saved piece with a label photo tested yet)

### M2.3 Edit and delete — ✅ done
- [x] Edit saves and shows the new value (simulator: "Rose Bowl flea market")
- [x] Delete asks for confirmation and removes the piece (simulator)
- [x] Unit tests: updates only touch editable columns
- [x] SQL checked in `sqlite3`: delete removes the piece and its photo rows
- [ ] Photo files are removed from storage on delete (tested piece had no photos)
- [ ] The field being typed in stays above the keyboard (fix added, not yet seen on screen)
- [ ] Invalid price shows "Enter the price as a number…" (not yet seen on screen)

### M2.4 Filters by era, brand and colour; grid view — ⬜ open
- [ ] Filters combine (for example Denim + 1990s) and totals follow
- [ ] Grid view with at least 3 columns on a 6.1" phone, readable with Larger Text
- [ ] Unit tests for the filter logic

### M2.5 Collection value over time — ⬜ open
- [x] Collection total value shown (done in M0.5)
- [ ] Value history stored with a date (new migration, with an upgrade test)
- [ ] Chart readable in light and dark mode, with an accessible text summary
- [ ] Re-pricing old pieces is opt-in and shows what it costs

### M2.6 Background removal for cut-outs — ⬜ open
- [ ] Cut-out is made on the device; the photo doesn't leave the phone for this
- [ ] Works in a development build (expect Expo Go not to include the native module)
- [ ] Original photo kept; cut-out saved as a separate `cutout` photo

### M2.7 Care guide per piece — ⬜ open
- [ ] Care tips depend on materials and category, with unit tests
- [ ] Shown on the item screen

---

## M3 — Wishlist

### M3.1 Move a wishlist piece to the collection — ✅ done
- [x] "I bought it" moves the piece, uses the target price by default, and records today's date (simulator)
- [x] SQL checked in `sqlite3`
- [ ] Entering a different price than the target checked on screen

### M3.2 Add wishlist entries without scanning — ⬜ open
- [ ] Add by brand, category, era and target price from the Wishlist tab
- [ ] Validation for empty name and invalid price, with unit tests

### M3.3 Estimated wishlist total — ✅ done (in M0.5)
- [x] Unit tests: target price used when set, otherwise the vintage range
- [x] Total shown on the Wishlist tab (simulator)

---

## M4 — Outfits

### M4.1 Outfit canvas — ⬜ open
- [ ] Drag, layer and resize cut-outs smoothly (60 fps on a physical phone, D1)
- [ ] Positions saved in `outfit_item` and restored exactly

### M4.2 Save and tag outfits — ⬜ open
- [ ] Occasion and season tags; list filters by tag
- [ ] Deleting a piece removes it from outfits without breaking them

### M4.3 "Does it go with what I own?" — ⬜ open
- [ ] After a scan, the piece can be previewed next to collection pieces before buying
- [ ] Nothing is saved unless the person saves it

### M4.4 Outfit suggestions — ⬜ open
- [ ] Suggestions use only the person's own pieces
- [ ] Cost per suggestion measured and acceptable for the pricing plan

---

## M5 — Polish and launch

### M5.1 Onboarding, empty states, accessibility pass — ⬜ open
- [ ] Full VoiceOver and TalkBack pass on every screen
- [ ] Largest Dynamic Type size: nothing cut off or overlapping
- [ ] Empty states explain the next action on every tab

### M5.2 Export and import a backup — ⬜ open
- [ ] Round trip: export, delete the app, reinstall, import → identical pieces and photos
- [ ] The backup file is only shared where the person chooses

### M5.3 Shareable image — ⬜ open
- [ ] Image contains only what the person chose to share (no location data from photos)

### M5.4 Freemium and subscription — ⬜ open
- [ ] Free scan limit enforced on the server, not only in the app
- [ ] Purchases tested in the store sandbox; restore purchases works
- [ ] Pricing covers the measured cost per scan with margin

### M5.5 TestFlight / Play testing, then release — ⬜ open
- [ ] Signed build installs and launches on physical devices (D1, D2)
- [ ] Privacy policy and store privacy labels match what the app really does (only scan photos leave the phone)
- [ ] Store listing claims checked against the app (no overclaiming of price accuracy)
- [ ] Crash-free in a week of testing with at least 5 testers
