# Redesign — "Current" landing + "Volt" portal

## Run it
```
npm install
npm run dev
```
(The new packages are three, gsap, lenis and the self-hosted fonts. If you prefer pnpm, run `pnpm install` without `--frozen-lockfile` once so it updates pnpm-lock.yaml.)

## What's new
- `src/landing/` — cinematic landing page: 3D medium-voltage cable (three.js) that strips layer by layer on scroll, flow, live numbers, portals, features.
- `src/theme/volt.src.css` — the portal design language (edit this). Run `python scripts/build-volt.py` to regenerate `volt.css`.
- `src/theme/base.css`, `supplier-base.css` — the old styles recoloured into the new palette (originals `index.css`, `supplier.css` are untouched).
- `src/theme/PortalFX.jsx` — live 3D cable hero, ambient background, live ticker, page-change "current" wipe, spotlight/tilt/count-up effects.
- `src/CommandPalette.jsx` — Ctrl/⌘ + K anywhere in both portals.
- New employee + supplier dashboards, new sign-in screen.
- `public/assets/cables/` — product renders of the 3D cable.

## Backup
The files that were changed are saved, as they were, in `_backup-before-claude/`.
