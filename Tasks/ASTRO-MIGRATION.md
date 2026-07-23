# Astro redesign task map

## 1. Foundation

- Remove the Starlight integration and schema.
- Keep Astro and MDX as the content foundation.
- Preserve all existing public URLs through a native Astro catch-all route.
- Create shared layout, navigation, metadata, and footer components.

## 2. Visual system

- Retain Incognito's black, blue, and white identity.
- Shift from documentation UI to a bright, student-association editorial direction.
- Carry forward the live site's blue, purple, pink, and orange accent gradient.
- Establish reusable typography, spacing, color, button, card, and content tokens.
- Add purposeful motion with a reduced-motion fallback.

## 3. Homepage

- Lead with a straightforward introduction to the association rather than recruitment copy.
- Use real board photography and clear routes into events, committees, careers, and membership.
- Prioritize student utilities: events, tutors, the wiki, committees, and the store.
- Surface the three pillars: social, educational, and professional.
- Give sponsors a polished but secondary presence.

## 4. Content migration

- Render all existing MDX through the new Astro layout.
- Replace Starlight-only cards and callouts with semantic HTML.
- Refine tables, imagery, sponsor grids, notices, and long-form legal pages.

## 5. Quality assurance

- Build all static routes and inspect output for broken links.
- Test desktop and mobile navigation.
- Check keyboard focus, contrast, reduced motion, and image behavior.
- Verify that no runtime or package dependency on Starlight remains.
