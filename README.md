# MSV Incognito Website

The new website of MSV Incognito, built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

## Tech Stack

- **Framework:** Astro 5.x
- **Theme:** Starlight (documentation framework)
- **Styling:** Custom CSS with dark theme (blue, white, black)
- **Content:** MDX

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
.
├── public/               # Static assets (images, favicon)
│   ├── assets/
│   │   ├── boards/       # Board photos
│   │   ├── committees/   # Committee logos
│   │   └── sponsors/     # Sponsor logos
│   └── favicon.ico
├── src/
│   ├── assets/           # Logo and other Astro assets
│   ├── content/
│   │   ├── config.ts     # Content collections config
│   │   └── docs/         # All site pages (MDX)
│   │       ├── index.mdx
│   │       ├── about.mdx
│   │       ├── contact.mdx
│   │       ├── board.mdx
│   │       ├── committees.mdx
│   │       ├── sponsors.mdx
│   │       ├── sponsors/ # Sponsor detail pages
│   │       ├── archive/  # P3-P5 placeholder pages
│   │       └── ...
│   └── styles/
│       └── custom.css    # Dark theme overrides
├── astro.config.mjs      # Astro & Starlight config
└── package.json
```

## Content Priority

| Priority | Pages | Status |
|----------|-------|--------|
| P1 | Home, About, Contact | Implemented |
| P2 | Board, Committees, Sponsors, Code of Conduct, Privacy, Terms, Careers, Job Listings | Implemented |
| P2+ | Sponsor detail pages (ASML, Computd, Boels Rental, YER, ORTEC, ESAOTE, Medtronic, Startups) | Implemented |
| P3-P5 | Events, History, Members, Posts, Yearbooks, Store | Archive placeholders |

## Theme Colors

- **Background:** `#000000` (black)
- **Text:** `#f1f5f9` (off-white)
- **Accent:** `#3b82f6` (blue)
- **Accent High:** `#93c5fd` (light blue)
- **Borders:** `#1e293b` (dark slate)

## License

Content © MSV Incognito. All rights reserved.
