# MSV Incognito Website — Content Inventory & Migration Priority

> Generated from WordPress extraction at `/Volumes/S/Incognito/Site WP/output/`
> Target: New website built with Next.js, Tailwind CSS, and Sanity CMS

---

## Executive Summary

| Category | Count | Notes |
|----------|-------|-------|
| **Pages** | 46 | Mix of active, legacy, draft, and utility pages |
| **Posts** | 184 | Historical blog posts spanning 2006–2024 |
| **Events** | 24+ | The Events Calendar entries (2024) |
| **Custom Post Types** | 17 | Organizers, venues, Elementor templates |
| **Images** | ~792 | Mix of content images, logos, banners, posters |
| **Total Files** | ~1,123 | Markdown + images + attachments |

---

## Priority 1 — CRITICAL (Launch Blocker)

These are the core pages and assets required for a functioning public website. Migrate first.

### 1.1 Home Page
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2024/home-2/` | `index.md`, `images/` | `app/(site)/page.tsx` or Sanity | Hero section, sponsor logos, events snippet, about teaser |
| `pages/2019/home/` | `index.md`, `images/` | Archive / reference only | Older home page content (2019 era) — review for reusable copy |

**Key Assets to Migrate:**
- `31st-board-scaled.jpg` — hero/board image
- Sponsor logos: `ASML_Holding_N.V._logo.svg`, `Computd-Logo-Dark.svg`, `Logo_Boels_Rental.svg`, `medtronic-logo.jpg`, `LOGO_ESAOTE_2023_PAYOFF_ORIZZONTALE_COLOREPIATTO.png`
- Background photos from Unsplash (review licensing)

### 1.2 About Page
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2024/about/` | `index.md`, `images/` | `app/(site)/about/page.tsx` or Sanity | Who we are, what we do, academic/social/career support sections |

**Key Assets to Migrate:**
- `31st-board-scaled.jpg`, `57e2d1464c5bac14ea89837cc3202a7f1038dae05056784f7d_1920-1024x683.jpg`
- `57e1d6414f50a414ea89837cc3202a7f1038dae05250774d7c_1920-1024x678.jpg`
- `55e3d3404d51b114a6df8579cf35367b123bdbe75752734e_1920-1024x683.jpg`
- Sponsor logos (same as home)

### 1.3 Contact Page
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2024/contact/` | `index.md` | `app/(site)/contact/page.tsx` | Address, email, social links |

**Content:**
- Address: Paul-Henri Spaaklaan 1, 16229 EN Maastricht
- Email: incognito@maastrichtuniversity.nl
- Social: LinkedIn, Instagram
- Contact form (rebuild in Next.js + API route or embed)

### 1.4 Core Branding Assets
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `_unattached/images/2013/` | `web-logo-wit.png`, `web-logo-wittig.png`, `web-logo-zwart.png` | `public/assets/logo/` | Wordmark variants (white, off-white, black) |
| `_unattached/images/2014/` | `favicon.ico` | `public/favicon.ico` | Favicon |
| `_unattached/images/2015/` | `MysteryLAN-logo-*.png` | `public/assets/events/` | MysteryLAN branding |

---

## Priority 2 — HIGH (Important for Public Face)

These should be live shortly after core pages. They define the organization's identity and governance.

### 2.1 Board Page
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2024/board/` | `index.md`, `images/` | `app/(site)/board/page.tsx` or Sanity | Current + historical boards |
| `pages/2019/boards/` | `index.md`, `images/` | Merge / archive | Older board page with overlapping history |

**Key Assets:**
- `31st-board-scaled.jpg` — 31st Board (current at time of extraction)
- `Incognito-30th-Board.jpg` — 30th Board
- `2023.png` — 29th Board
- `board2021-2022.jpeg` — 28th Board
- `board2020-2021.jpeg` — 27th Board
- `board26.png` — 26th Board

**Data Structure Recommendation:** Board members should be a Sanity document type (`board`) with fields: year, members[], photo, order.

### 2.2 Committees Page
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2024/new-committees/` | `index.md` | `app/(site)/committees/page.tsx` | Current committees structure |
| `pages/2009/committees/` | `index.md`, `images/` | Archive / reference | Historical committee logos (aKtiE, boeKtiE, eduKatiE, fiKtiE, hacKErs, piKtiE, proKtiE, redaKtiE, tasKE) |

### 2.3 Sponsors Overview
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2024/new-sponsors/` | `index.md`, `images/` | `app/(site)/sponsors/page.tsx` or Sanity | Sponsor grid/listing |
| `pages/2021/sponsorship-documents/` | `index.md` | `public/docs/` or link | Sponsorship package PDFs |

**Key Assets:**
- `ASML_Holding_N.V._logo.svg`
- `Computd-Logo-Dark.svg`
- `Logo_Boels_Rental.svg`
- `LOGO_ESAOTE_2023_PAYOFF_ORIZZONTALE_COLOREPIATTO.png`
- `medtronic-logo.jpg`
- `yer-logo.svg`
- `ortec.svg`

**Data Structure Recommendation:** Sponsor should be a Sanity document type with: name, logo, tier, description, website, active (boolean).

### 2.4 Code of Conduct
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2020/code-of-conduct/` | `index.md` | `app/(site)/code-of-conduct/page.tsx` | Required governance document |

### 2.5 Privacy Policy & Terms
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2024/privacy-policy/` | `index.md` | `app/(site)/privacy-policy/page.tsx` | GDPR compliance |
| `pages/2024/terms-and-conditions/` | `index.md` | `app/(site)/terms/page.tsx` | Store/website T&C |

### 2.6 Careers / Job Listings
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2024/job-listings2/` | `index.md`, `images/` | `app/(site)/careers/page.tsx` | Aggregated job listings |
| `pages/2019/careers/` | `index.md`, `images/` | Archive / merge | Older careers page |

---

## Priority 3 — MEDIUM (Engagement & Content)

These drive member engagement and SEO. Migrate after the public face is stable.

### 3.1 Events Calendar
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `custom/tribe_events/2024/*/` | `index.md`, `images/` | Sanity `event` documents or CMS | 24+ events from 2024 |

**Notable Events to Preserve:**
- `intro-camp-2024/` — Major recruitment event
- `ski-trip-2024/` — Popular recurring event
- `drinks-and-demos-*` — Multiple editions (Vol 7, 8, 9)
- `beer-pong-2024-11-29/`, `casino-night-2024-09-18/`, `halloween-party-2024-11-02/`
- `board-game-night-2024-10-31/`, `christmas-movie-night-2024-11-27/`
- `inkoffieto-*` — Coffee social events
- `programming-session-*` — Academic support events
- `linkedin-workshop-professional-photoshoot-2024-11-13/`

**Data Structure Recommendation:** Event document type with: title, date, coverImage, description, location, price, signupLink, category, status.

### 3.2 History / Anthem
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2024/history/` | `index.md` | `app/(site)/history/page.tsx` | Contains anthem lyrics (note: folder is named "history" but title is "Anthem") |
| `pages/2015/incognito-song/` | `index.md` | Archive / merge | Possibly same content |

### 3.3 Members Page
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2019/members/` | `index.md`, `images/` | `app/(site)/members/page.tsx` or member portal | Benefits, Discord, yearbooks, memories |

**Key Assets:**
- Committee photos: `aktie-scaled.jpg`, `hackers-scaled.jpg`, `taske-scaled.jpg`
- Social photos: `incognito-pic3-scaled.jpg` through `incognito-pic7-scaled.jpg`
- `yearbook-scaled.jpg`, `memories-scaled.jpg`
- `Discord-Logo-Color-1.png`

### 3.4 Recent Blog Posts (2023–2024)
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `posts/2024/*/` | `index.md`, `images/` | Sanity `post` documents | Most recent news/announcements |
| `posts/2023/*/` | `index.md`, `images/` | Sanity `post` documents | Recent news/announcements |

---

## Priority 4 — LOWER (Historical Archives)

These are valuable for legacy and SEO but not launch-critical. Bulk import or archive.

### 4.1 Historical Blog Posts (2006–2022)
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `posts/2006/*/`, `posts/2007/*/`, ... `posts/2022/*/` | `index.md`, `images/` | Sanity `post` documents with `archive` tag | 150+ historical posts |

**Notable Historical Content:**
- **2006–2008:** Founding-era posts, early events (cantus, movie nights, career days)
- **2009:** Lustrum (5-year anniversary), introduction camp, pub crawl
- **2010–2011:** Beertastings, game nights, book sales, business days
- **2012:** Werewolves night, apenkooien, billiards, holidays
- **2013:** Faculty introduction, Kafe series (academic talks), MysteryLAN, Halloween
- **2014:** Archery, lustrum overdress, DKE for Dummies, more Kafe talks

### 4.2 Legacy Static Pages
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2013/yearbooks/` | `index.md`, `images/` | `app/(site)/yearbooks/page.tsx` | Yearbook archive (17-18 cover visible) |
| `pages/2016/photo-albums/` | `index.md` | Archive / gallery page | Photo album links |
| `pages/2018/old-events/` | `index.md` | Archive | Old events listing |
| `pages/2014/honorary-members/` | `index.md` | `app/(site)/honorary-members/page.tsx` | Honorary members list |
| `pages/2009/documents/` | `index.md` | `public/docs/` or archive | Old documents page |
| `pages/2009/membership/` | `index.md` | Archive | Old membership info |

### 4.3 Sponsor Detail Pages
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2024/asml/`, `pages/2024/computd/`, `pages/2024/boels-rental/`, `pages/2024/yer/`, `pages/2024/ortec/` | `index.md`, `images/` | Sanity or dynamic route `[sponsor]/page.tsx` | Individual sponsor pages with descriptions |
| `pages/2025/esaote/`, `pages/2025/medtronic/`, `pages/2025/startups/` | `index.md`, `images/` | Same as above | Newer sponsor pages |

---

## Priority 5 — LOWEST (Complex / Deferred / Drafts)

### 5.1 E-Commerce / Store
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2024/store/`, `pages/2024/cart/`, `pages/2024/check-out/`, `pages/2024/all-products/`, `pages/2024/bestsellers/`, `pages/2024/ourfavorites/`, `pages/2024/wishlist/`, `pages/2024/compare/` | `index.md`, `images/` | **Deferred** — evaluate Shopify/Snipcart/Sanity Commerce | Merch store with hoodies, stickers, hats, caps |

**Products Identified:**
- "Dacs hoodie"
- "Cute duck sticker pack"
- "Multi-colored baseball hat with duck"
- Tote bags

**Recommendation:** This is a significant build. Consider embedding Shopify Buy Button, using Snipcart, or building with Sanity Commerce. Defer to Phase 2.

### 5.2 Tickets / Event Registration
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/2024/tickets-order/` | `index.md` | **Deferred** | May be event-specific; integrate with events system |

### 5.3 Drafts & Unused Content
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `pages/_drafts/2024/size-guide/` | `index.md` | Review / discard | Store size guide (orphaned) |
| `pages/_drafts/id-193622/` | `index.md`, `images/` | Review / discard | Draft sponsor page? |
| `custom/elementor_library/` | `index.md`, `images/` | **Discard** | Elementor templates — framework-specific, not reusable |
| `pages/2024/under-construction/` | `index.md` | Discard | Placeholder page |
| `pages/2024/new-home/`, `pages/2024/portfolio/` | `index.md` | Review / discard | Appear to be unused or test pages |

### 5.4 Unattached Images
| Source | File(s) | Destination | Notes |
|--------|---------|-------------|-------|
| `_unattached/images/2009/` through `_unattached/images/2026/` | ~500+ images | Manual review + organize | Unlinked media library images. Many are event posters, board photos, sponsor logos, headers. Require manual curation. |

---

## Recommended Sanity Schema (CMS Data Model)

Based on the content inventory, the following document types are recommended for Sanity:

```
page          — Static pages (about, contact, code-of-conduct, etc.)
post          — Blog posts (with archive tag for old content)
event         — Calendar events (with date, venue, price, signup)
board         — Board entries (year, members[], photo)
committee     — Committees (name, description, logo, members)
sponsor       — Sponsors (name, logo, tier, website, description)
memberBenefit — Members page sections (benefits, links, images)
product       — Store products (deferred)
```

---

## Migration Order Recommendation

| Phase | Content | Effort |
|-------|---------|--------|
| **Phase 0** | Set up Next.js project, Tailwind, Sanity schema, deploy pipeline | 1–2 days |
| **Phase 1** | Build core pages: Home, About, Contact, Board, Committees, Sponsors | 3–5 days |
| **Phase 2** | Import events + build events calendar, import recent posts | 2–3 days |
| **Phase 3** | Build members portal, careers, history/anthem | 2–3 days |
| **Phase 4** | Bulk import historical posts (2006–2022), archive pages | 1–2 days |
| **Phase 5** | Evaluate and build store (Shopify/Snipcart integration) | 3–5 days |

---

## Asset Organization Recommendation

```
public/
  assets/
    logo/
      logo-white.svg
      logo-black.svg
      logo-retina.png
      favicon.ico
    sponsors/
      asml-logo.svg
      computd-logo.svg
      ...
    events/
      2024/
        intro-camp-poster.jpg
        ...
    boards/
      31st-board.jpg
      30th-board.jpg
      ...
    committees/
      aktie-logo.png
      hackers-logo.png
      ...
  docs/
    sponsorship-package.pdf
    code-of-conduct.pdf
```

---

## Notes

- **Instagram Integration:** Home page references an Instagram feed ("Please reauthorize instagram"). Plan for Instagram Basic Display API or embed.
- **Events Calendar Shortcode:** Old site used The Events Calendar plugin with shortcodes (`[events-calendar-templates ...]`). Rebuild as custom React component querying Sanity.
- **Contact Form:** Old site had an embedded form. Rebuild with Next.js API route + email service (Resend, SendGrid) or embed Typeform/Tally.
- **Image Optimization:** ~792 images should be processed through Sanity's image pipeline or Next.js `<Image>` for optimization.
- **URLs:** Plan redirect map from old WordPress permalinks to new Next.js routes to preserve SEO.
