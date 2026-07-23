# MSV Incognito Website

The website of MSV Incognito, built with [Astro](https://astro.build) and MDX.

## Tech Stack

- **Framework:** Astro 5.x
- **Rendering:** Native Astro layouts and routes
- **Styling:** Custom student-association editorial design system
- **Motion:** GSAP with responsive and reduced-motion handling
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
│   ├── components/       # Shared header and footer
│   ├── layouts/          # Site-wide Astro layout
│   ├── pages/            # Homepage and content routing
│   ├── content/
│   │   ├── config.ts     # Content collections config
│   │   └── docs/         # Long-form site content (MDX)
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
│       └── global.css    # Site design system
├── astro.config.mjs      # Astro config
└── package.json
```

## Content Priority

| Priority | Pages | Status |
|----------|-------|--------|
| P1 | Home, About, Contact | Implemented |
| P2 | Board, Committees, Sponsors, Code of Conduct, Privacy, Terms, Careers, Job Listings | Implemented |
| P2+ | Sponsor detail pages (ASML, Computd, Boels Rental, YER, ORTEC, ESAOTE, Medtronic, Startups) | Implemented |
| P3-P5 | Events, History, Members, Posts, Yearbooks, Store | Archive placeholders |

## Design system

- **Ink:** `#071526`
- **Incognito blue:** `#155eef`
- **Purple:** `#5746d8`
- **Pink:** `#ef3b8f`
- **Orange:** `#f57a32`
- **Paper:** `#f5f6f2`

## License

Content © MSV Incognito. All rights reserved.
