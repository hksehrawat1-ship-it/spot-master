# Stain Master — Professional Website & PWA

Rebuild the presentation layer into a responsive, installable professional website. All existing engines, stores, data files, Supabase auth, roles, RLS, safety and governance logic stay intact; existing working routes keep their paths and are restyled to the new token system.

## 1. Design foundation

- Replace the Google Material palette in `src/index.css` / `tailwind.config.ts` with the specified tokens (Deep Navy #12304A, Professional Blue #1769E0, Teal #087F73, Soft BG #F5F7FA, Border #DDE3EA, text #17212B / #607080, plus proceed/caution/stop/info colours and their tinted backgrounds).
- Font stack: Inter, "Noto Sans Devanagari", "Noto Sans", system-ui. Remove serif from working screens. Type scale with 16px minimum body/button/input.
- Component conventions: radius 12–16px, 48–52px buttons and inputs, 44px minimum touch targets, subtle shadows, visible focus rings, reduced-motion support.
- Status components always pair colour with an icon plus text label. No dark mode (avoiding a partial implementation).

## 2. Responsive site shell

- `PublicShell` — marketing header (logo, How it works, Working levels, Supported kits, Pricing, Sign in, Start Stain Master) with a mobile sheet menu, plus the full footer.
- `AppShell` — mobile bottom navigation (Home, New Case, Cases, Products, Account) with a prominent New Case action; tablet/desktop switch to a left navigation rail. Max content width 1200px, side padding 16/24px.
- Admin keeps its own separate protected shell.

## 3. Pages

| Route | Content |
| --- | --- |
| `/` | Landing: hero, three benefits, working-levels preview, supported kits (loaded from `companies`/`product_kits`), how it works, pricing preview, safety statement, footer |
| `/register` | Name, searchable country selector, international phone input with dial code and per-country validation, email + Supabase email OTP, separate optional marketing consent |
| `/sign-in` | Email OTP default, resend with countdown, recovery; post-sign-in routing by entitlement state |
| `/checkout` | Order card (₹18,000 struck through, ₹8,000, save ₹10,000), server-validated coupon, tax line, provider abstraction |
| `/payment-success` | Server-verified status only: amount, invoice number, dates, access window, invoice download |
| `/setup` | Resumable 4-step wizard: working level → spotting kit(s) → available products → country/language/units/currency/timezone |
| `/home` | Personalised daily homepage (details below) |
| `/cases/new`, `/cases` | New-case workflow wrapper over the existing engines; saved-case list with search/filters (cards on mobile, table on desktop) |
| `/products` | Product library with Approved / Published / Under review / Superseded / Not verified labels |
| `/account` | Profile, verified mobile, preferences, subscription, invoices, install, privacy, sign out |
| `/legal/*` | Privacy, Terms, Refund, Safety Disclaimer, About, Contact, Supported countries |

Existing operational routes (`/retail-spotting`, `/professional-spotting`, `/master-spotter`, `/stain-categories`, `/treatment-stages`, `/fabric-check`, `/products/*`, `/admin/*`) keep working and move inside `AppShell` with the new tokens.

## 4. Personalised homepage

Greeting with first name, compact Level and Kit selectors (saved to the profile), a prominent "Start a new stain case" button, the search field as the main discovery control, quick safety cases (unknown stain, unknown fabric, no care label, colour bleeding, possible damage, previously treated), the 12 redesigned category cards with line icons and no fixed counts, and up to three recent cases.

Search covers names, aliases, local names, alternate spellings and fuzzy matching against approved records; recent searches are per-user.

## 5. Category redesign

Twelve cards using the specified professional titles, each with a consistent Lucide line icon, two or three examples and a chevron. One column under 640px, two on tablet, three or four on desktop. Technical names appear only as secondary text. Counts are shown only when computed from approved records.

## 6. Payments (Cashfree + Stripe)

A provider-agnostic payment layer:

- `payments_config` (single pricing record: list price, offer price, currency, access period, tax rules) and `coupons` — pricing lives in one place only.
- `orders` and `payment_events` tables with RLS; append-only event log covering awaiting, processing, successful, failed, cancelled, pending verification, duplicate callback and refunded states.
- `subscriptions`/entitlement table read through a security-definer function; access unlocks only after server verification.
- Edge functions: `payment-create-order`, `payment-webhook` (signature verified), `payment-status`. Provider chosen server-side — Cashfree for INR/UPI, Stripe for international.
- Amounts and coupons are always resolved on the server; the browser never supplies a payable amount.
- Without provider credentials the checkout renders a "Payment configuration required" state — no simulated success path.

## 7. Access gating

Route guards extend the existing `ProtectedRoute`: verified-unpaid → `/checkout`, paid-without-setup → `/setup`, expired → renewal, active → `/home`. Entitlement is read from the server each session; localStorage holds only non-authoritative UI preferences (last level, last kit).

## 8. PWA

`vite-plugin-pwa` in `generateSW` mode with `injectRegister: null`, `devOptions.enabled: false`, and a guarded registration wrapper that refuses to register in dev, iframes, Lovable preview hosts, and with `?sw=off`. NetworkFirst for navigations, CacheFirst for hashed assets. Manifest with Stain Master name/short name, standalone display, theme colour, icon set, Apple touch icon and iOS metadata. Non-intrusive install action with dismissal memory and iOS instructions. Update-available prompt.

Offline: shell and previously viewed non-sensitive content only, with a stale-data banner; safety-critical guidance fails closed with the specified message. Payment data, tokens and other organisations' data are never cached.

## 9. Legacy isolation, SEO, accessibility, tests

- Course, lesson, certificate, resource-vault and progress components and routes are removed from all navigation and hard-disabled (flag forced off in every environment); database records are untouched.
- `index.html` metadata, canonical URLs, Open Graph, structured data, `sitemap.xml` for public pages, and robots rules disallowing `/home`, `/cases`, `/checkout`, `/payment-success`, `/account`, `/setup` and `/admin`. Private routes also carry `noindex`.
- WCAG 2.2 AA pass: semantic headings, labelled forms, accessible OTP and country selector, keyboard/focus, screen-reader status announcements, `lang` attribute per language, no horizontal scroll.
- Extend the Vitest suite (pricing config, entitlement gating, coupon/server-amount rules, category mapping, offline fail-closed) and verify build, lint and the existing 470 tests still pass, plus a responsive review at mobile, tablet and desktop widths.

## Configuration you will need to supply

- Cashfree App ID + Secret Key and webhook secret (test and production).
- Stripe secret key and webhook signing secret for international payments.
- GSTIN, legal business name and address, GST rate and HSN/SAC for invoices.
- Final legal copy for Privacy, Terms, Refund and Safety Disclaimer.
- Production domain, support email/phone, and any brand logo/icon source files.

Until these are supplied, the affected pages show honest configuration-required states rather than placeholder or simulated behaviour.
