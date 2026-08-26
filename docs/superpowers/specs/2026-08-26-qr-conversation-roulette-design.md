# QR Conversation Roulette Design

## Purpose

Add a permanent, unlisted `/qr` page for people who scan a printed Incognito QR code at an event. The page helps start conversations by spinning a category wheel and revealing a random prompt from the selected category.

All printed QR codes point to the same `/qr` URL. The route must not be linked from the website header, footer, navigation, sitemap content, or other pages.

## Audience and Context

The primary user opens the page on a phone by scanning a QR code. The design therefore targets portrait phone screens, one-tap operation, short sessions, and prompts that are easy to read aloud or show to another person. Larger screens remain supported but do not determine the layout.

## Visual Direction

The experience uses Incognito's navy, blue, and pink palette with a polished event feel. The spin itself adds a restrained playful moment without turning the page into a carnival aesthetic.

The page is visually self-contained. It omits the normal website header and footer and instead uses a compact Incognito wordmark, the title “Conversation Roulette,” a short instruction, the wheel, and the current controls. This keeps the scanned experience focused while ensuring `/qr` is not advertised elsewhere.

## Interaction Flow

The approved mobile interaction combines the “wheel-first” and “prompt-first” concepts:

1. The initial view places a large category wheel at the center of the phone screen with a prominent spin control.
2. Activating the control selects a category and animates the wheel to that segment for approximately two to three seconds.
3. When the wheel stops, it shrinks upward and a large result panel slides up from the bottom.
4. The result panel shows the selected category and one randomly chosen prompt from that category.
5. “Another prompt” keeps the selected category and reveals another prompt from it.
6. “Spin again” dismisses the result panel and restores the wheel-first view.

The interface avoids immediately repeating a prompt when its category contains more than one prompt. Repeats across longer sessions are acceptable and no session history is persisted.

## Content Editing

Editable wheel content lives in `src/data/qr-prompts.json`. Each entry contains:

- a category label;
- a segment color; and
- an array of prompts.

The SVG wheel is generated from this data. Editors do not create or modify SVG files. Adding or removing a category automatically recalculates segment sizes and label positions. Changing a label, color, or prompt only requires editing the JSON file.

The initial implementation uses clearly identified sample categories and sample prompts. They are temporary content intended to be replaced after the interaction and visual design have been reviewed.

## Technical Design

The feature is a static Astro route with client-side interaction and no network dependency.

- `src/pages/qr.astro` owns the unlisted route and focused page shell.
- `src/components/QrWheel.astro` renders the generated SVG, controls, result panel, and interaction hooks.
- `src/data/qr-prompts.json` is the single editable content source.
- A small client-side module handles category selection, rotation, prompt selection, and view-state transitions.

The SVG uses one path per category, generated from the number of entries in the JSON data. The winning rotation is derived from the selected category index and includes multiple full turns so every outcome feels intentional. The selection is made before animation begins; the animation only reveals the selected result.

No account, cookie, local storage, server endpoint, database, or external request is required. Existing site analytics and consent behavior remain unchanged.

## Accessibility and Motion

- The spin control and both result actions are native buttons with visible focus states.
- The wheel has a concise accessible label; category and prompt results are announced through an `aria-live` region after the animation finishes.
- Color is not the only indication of the selected category; the result includes its text label and the winning segment receives a visual emphasis.
- Labels and controls maintain readable contrast against their backgrounds.
- Users who prefer reduced motion receive a short, non-spinning state transition and the same result.
- Buttons remain comfortably sized for touch use on narrow screens.

Sound is not included.

## Validation and Error Handling

The build validates that the data file contains at least two categories, that every category has a non-empty label and valid color, and that every category contains at least one non-empty prompt. Invalid content fails the build with a specific message rather than producing a broken wheel.

The client-side script treats controls as disabled while a spin is in progress, preventing overlapping spins. If an unexpected runtime error occurs, the controls are re-enabled and the user receives a brief retry message.

## Responsive Behavior

Portrait phones receive the primary design: a nearly full-width wheel followed by a bottom result panel. The layout accounts for device safe areas and keeps primary controls within easy reach.

On wider screens, the page constrains itself to a comfortable app-like width. The wheel and result may sit side by side when space permits, but the interaction and content order remain the same.

## Verification

Verification will include:

- automated checks for valid prompt data and selection behavior;
- a successful production build that emits `/qr/index.html`;
- keyboard operation and live-result announcement checks;
- reduced-motion behavior;
- prevention of duplicate spin actions;
- visual checks at narrow phone, larger phone, and desktop widths; and
- confirmation that no existing navigation or content page links to `/qr`.

## Out of Scope

- Final production categories and prompts;
- an editor interface or content management system;
- separate URLs or behavior for different QR codes;
- sharing, voting, accounts, saved history, sound, or server-side tracking; and
- adding `/qr` to any website navigation or promotional content.
