# Change Navigator — Project Changelog

## Project Overview
**Change Navigator** is a PWA (Progressive Web App) built for ABN Consulting.
It presents 54 inspiration cards in Hebrew and English decks, allowing users to draw a random card, browse all cards, save favorites, keep a personal journal, and email cards to themselves.
Deployed at: Railway (see Railway dashboard for URL)
Git branch: `claude/migrate-to-railway-4sCTd`

---

## Architecture Summary

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/JS, Tailwind CSS (CDN), Inter font |
| PWA | `manifest.json` + `sw.js` (cache-first service worker) |
| Image storage | IndexedDB (`cnav-images` DB, `card-images` store) |
| Email | EmailJS (client-side, no backend) |
| Deployment | Railway static site (`npx serve`) |
| Card images | Google Drive (`drive.google.com/uc?export=view&id=FILE_ID`) |

---

## File Reference

| File | Purpose |
|---|---|
| `app.html` | Main PWA — language picker, 4 tabs (draw/browse/favorites/journal), card modal, email modal |
| `admin.html` | Password-protected admin panel (password: `9989`) — upload card images, manage EmailJS config |
| `cards-config.js` | Google Drive file ID mappings for all 54 cards × 2 languages × front/back |
| `manifest.json` | PWA manifest — name, icons, RTL, standalone display, theme `#0f172a` |
| `sw.js` | Cache-first service worker — precaches all app files for offline use |
| `icon.svg` | Shield logo SVG used as home screen icon |
| `index.html` | Landing page with QR code linking to `app.html`, install instructions, subtle Admin link |
| `railway.toml` | Railway config — nixpacks builder, `npx serve` start command |
| `serve.json` | Serve config — SPA rewrite, cache headers (used by Railway) |
| `netlify.toml` | Legacy Netlify config (kept for reference) |

---

## localStorage Keys

| Key | Value |
|---|---|
| `cnav_lang` | `"he"` or `"en"` — selected language |
| `cnav_favorites` | JSON array of favorited card numbers |
| `cnav_journal` | JSON object keyed by card number, stores journal notes |
| `cnav_emailjs_service` | EmailJS Service ID (overrides hardcoded default) |
| `cnav_emailjs_template` | EmailJS Template ID (overrides hardcoded default) |

---

## EmailJS Configuration

| Setting | Value |
|---|---|
| Public Key | `nxguxr-WfLhUpXOhn` |
| Service ID | `service_a85ap2g` (hardcoded fallback + overridable from admin) |
| Template ID | `template_xquxnon` (hardcoded fallback + overridable from admin) |

**Template variables sent in each email:**

| Variable | Content |
|---|---|
| `{{to_email}}` | Recipient email address (must be set in template "To Email" field) |
| `{{card_number}}` | Card number (1–54) |
| `{{card_image_url}}` | Google Drive image URL (empty string if locally uploaded — see 413 fix below) |
| `{{user_note}}` | Free text typed by user in email modal |
| `{{language}}` | `"עברית"` or `"English"` |
| `{{card_category}}` | Hebrew category (מנהיגות / עבודת צוות / etc.) |
| `{{card_quote}}` | Hebrew inspirational quote |
| `{{card_explanation}}` | Hebrew management explanation/connection |

---

## Build History

### Session 1 — Initial Build
- Created full PWA shell (`app.html`) with:
  - Language picker screen (Hebrew / English)
  - 4-tab navigation: Draw, Browse, Favorites, Journal
  - 3D card flip animation (CSS `perspective` + `rotateY`)
  - Card modal with flip, journal textarea, email CTA
  - Email modal with editable free-text box
  - IndexedDB integration: `openImageDB()`, `loadLocalImages()`, `localImageCache` Map
  - `getImageUrl(lang, num, side)` — priority: IndexedDB → Google Drive → placeholder
- Created `cards-config.js` with 54-card × 2-language Drive ID structure (placeholders)
- Created `admin.html` — password gate (`9989`), language tabs, 54-card upload grid, bulk upload by filename convention (`1F.png`, `1B.png` … `54B.png`), per-card delete, storage usage display
- Created `manifest.json`, `sw.js`, `icon.svg`, `index.html` landing page
- Created `netlify.toml` for Netlify static deploy (later migrated to Railway)

### Session 2 — Bug Fixes

**Fix 1 — Card aspect ratio (2:3)**
- Problem: Cards used fixed pixel heights (380px/340px), not matching source image ratio (750×1125 = 2:3)
- Fix: Added `.card-display { aspect-ratio: 2/3; width:100%; position:relative; }` CSS class; replaced inline `style="height:Xpx"` on both card containers with `class="card-3d card-display"`

**Fix 2 — Editable email inspiration box**
- Problem: The inspiration text field in the email modal was a read-only `<p>` tag
- Fix: Replaced with `<textarea id="email-free-text">` that starts empty on every open; `sendEmail()` reads from it

**Fix 3 — EmailJS placeholder IDs**
- Problem: `SERVICE_ID` and `TEMPLATE_ID` were `'YOUR_SERVICE_ID'` placeholders — email never sent
- Fix: Hardcoded real values (`service_a85ap2g`, `template_xquxnon`) with localStorage override; admin panel lets user update IDs without touching code

**Fix 4 — EmailJS 413 "Variables size limit"**
- Problem: Admin-uploaded images stored as base64 data-URLs (300–800 KB) exceeded EmailJS 50 KB variable limit
- Fix: `const emailSafeImageUrl = cardImageUrl.startsWith('data:') ? '' : cardImageUrl;` — strips data-URLs before sending; Google Drive URLs pass through unchanged

### Session 3 — Hebrew Card Content in Email
- Added `CARD_DATA_HE` object to `app.html` — all 54 Hebrew cards with category, quote, and management explanation
- Updated `sendEmail()` to look up `CARD_DATA_HE[card.num]` and pass `card_category`, `card_quote`, `card_explanation` as additional EmailJS template variables
- EmailJS template updated (in dashboard) to display a rich RTL Hebrew email with:
  - Card image
  - Category + quote in a blue-accented box
  - Management explanation in a grey box
  - User's personal note
  - Card number + language footer

**Fix 5 — EmailJS 422 "Recipients address is empty"**
- Problem: EmailJS template "To Email" field was blank — the `{{to_email}}` variable was sent correctly by the code but never wired to the delivery recipient in the template settings
- Fix: In EmailJS dashboard → template editor → set the "To Email" field to `{{to_email}}`

---

## Pending / Future Work

- [ ] Fill in Google Drive file IDs in `cards-config.js` (run the included Google Apps Script, or paste IDs manually)
- [ ] Connect Railway project to the `master` branch for auto-deploy
- [ ] Add English card content data (`CARD_DATA_EN`) if/when English deck content is available
- [ ] Optionally: add push notifications or share-sheet integration for mobile

---

## Google Drive Folder IDs (for card images)

| Language | Folder ID |
|---|---|
| Hebrew | `1DQ2gHhjbbhGB1b_dzIZGek85Jzgk-NmF` |
| English | `1v-TwwD67by7hp4BEQZLoRRau_1tnGoXi` |

A Google Apps Script is included in `cards-config.js` comments to auto-generate all Drive file IDs from these folders.
