# Matomo Consent Banner Design

## Goal

Add privacy-first Matomo analytics consent to every public route while preserving the visual identity shared by the MSV Incognito website and wiki.

This design supersedes the privacy behavior in `2026-08-15-matomo-tracking-design.md` and the implementation constraint in `2026-08-15-matomo-tracking.md` that excluded consent handling.

## Reference and Visual Direction

The live wiki uses a compact bottom-docked consent panel with the Incognito navy, blue, light blue, and pink palette. It offers equally clear acceptance and refusal actions, does not load Matomo before acceptance, and leaves a persistent privacy-settings control after a decision.

The website version will preserve those recognizable traits while adapting them to the website's sharper editorial system:

- square geometry rather than the wiki's rounded Starlight cards;
- the existing condensed display type, uppercase labels, and strong typographic hierarchy;
- a navy panel with a blue-to-purple-to-pink top rule;
- the website's existing button proportions, borders, and focus treatment;
- restrained shadow and no decorative glass or blur effects; and
- full compatibility with both existing website themes.

The panel will sit above the lower viewport edge, centered within the site's content width. Desktop layout places copy and actions side by side. Mobile layout stacks the content and buttons without horizontal overflow. The banner must respect safe-area insets.

## Content and Controls

The banner is an accessible dialog-like region titled “Privacy-friendly analytics.” Its copy explains that MSV Incognito uses cookieless Matomo analytics to understand website usage, that no analytics data is sent before acceptance, and that the choice can be changed later. It links to `/privacy-policy`.

The actions are:

- **Allow analytics** — records acceptance, initializes Matomo once, and hides the banner.
- **Decline** — records refusal, keeps Matomo unloaded, and hides the banner.

After either action, a small fixed **Privacy settings** button remains in the lower-right corner. Activating it reopens the banner and moves keyboard focus to the first action. Closing the banner after a new decision returns focus to the settings button.

Both choices receive comparable visual weight and must remain reachable and understandable with JavaScript, keyboard navigation, zoom, high contrast, and narrow viewports. Focus states use the existing pink accent.

## Architecture

Consent behavior will live in a dedicated client script loaded by `BaseLayout.astro` on every route. Styling will use a focused component section in the existing global stylesheet so it can consume the website's design tokens and theme values.

The script owns three responsibilities:

1. render and control the consent UI;
2. persist and restore the user's decision; and
3. initialize Matomo only when consent exists.

The decision is stored in `localStorage` under `incognito.analytics-consent.v1` with the values `accepted` or `declined`. Storage failures are tolerated: the current page decision still applies, but it cannot persist across page loads. Because browser local storage is origin-specific, the main website and wiki retain separate decisions; this design does not introduce cross-subdomain cookies.

The script is idempotent. Re-execution must not create duplicate banners, settings buttons, Matomo scripts, queues, or page-view events.

## Analytics Data Flow

On a first visit or an invalid/missing stored value:

1. render the visible consent banner;
2. do not create the Matomo script element; and
3. do not send a page view.

On acceptance:

1. persist `accepted` when storage is available;
2. initialize `window._paq`;
3. queue `requireConsent`, `disableCookies`, and `setConsentGiven`;
4. configure `https://analytics.msvincognito.nl/matomo.php` and site ID `1`;
5. queue one page view and link tracking; and
6. asynchronously load `https://analytics.msvincognito.nl/matomo.js` exactly once.

On a later page load with stored acceptance, Matomo initializes immediately using the same cookieless configuration. On refusal or a later change from acceptance to refusal, the script queues consent withdrawal and cookie deletion when Matomo is already present, then prevents analytics initialization on subsequent page loads.

Changing from refusal to acceptance initializes Matomo and records the current page once. Reaffirming acceptance must not duplicate the current page view.

## Accessibility and Motion

The banner uses a labelled and described region with semantic buttons and a normal link. It does not trap focus because it is non-modal and leaves the underlying page operable. Reopening settings moves focus into the banner; completing a choice returns focus to the settings control.

The banner may enter and leave with a short opacity and vertical-transform transition. Under `prefers-reduced-motion: reduce`, transitions are disabled. Hidden controls are removed from layout and the accessibility tree.

## Failure Behavior

If local storage is unavailable, the banner remains functional for the current document. If the analytics host or script is blocked, the website continues to render and operate because the tracker loads asynchronously. Consent actions must never depend on a successful analytics request.

If Matomo initialization throws unexpectedly, the accepted choice remains recorded and the consent UI still closes; a future document load can retry initialization.

## Verification

Focused automated tests will execute the built consent script in a minimal browser-like environment and verify:

- first visits show the banner without loading Matomo;
- acceptance persists and initializes the exact cookieless Matomo queue once;
- refusal persists and leaves Matomo unloaded;
- stored acceptance initializes tracking on load;
- stored refusal does not initialize tracking;
- invalid stored values behave like no decision;
- privacy settings reopen the banner and allow the choice to change;
- repeated initialization does not duplicate UI or tracking; and
- representative generated pages include the consent controller exactly once.

The full Astro build and existing checks must pass. Representative output will also be inspected at desktop and mobile widths in both light and dark themes to confirm placement, contrast, focus visibility, and lack of overflow.
