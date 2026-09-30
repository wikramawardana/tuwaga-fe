<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Tuwaga Frontend - Agent Operational Manual

## 1. Overview & Purpose
- **System**: Tournament operations platform ("Control the Game") for players, referees, organizers, and admins.
- **Key Features**: Public tournament discovery, player registration, bracket views, real-time live scoring display, order-of-play (OOP) management, crew assignment, and the Hermes AI Copilot drawer for administrators.
- **Companion Backend**: `tuwaga-be` (Rust Axum on port `8004`, production: `https://api-tuwaga.wikra.my.id`).

## 2. Architecture & Tech Stack
- **Framework**: Next.js 16 App Router with React 19.
- **Styling**: Tailwind CSS v4 with the Tuwaga Skor brand tokens in `src/app/globals.css` (see §6).
- **Icons**: Phosphor via `@phosphor-icons/react/dist/ssr` (works in server and client components); sport glyphs Phosphor lacks live in `src/components/icons/SportIcons.tsx`.
- **Linter & Formatter**: Biome (`biome.json`).
- **Authentication**: Better Auth client connected to `https://auth.wikra.my.id`.
- **Ports**: Local FE port `3004`, Local BE port `8004`.

## 3. Core Guidelines & Role Conventions
1. **Access Tiers & Portals**:
   - `admin`: Has access to the Hermes AI Copilot drawer, tournament setup, and crew role assignments.
   - `organizer`: Can manage operational match scoring, court queues, and OOP schedules.
   - `player` / General Users: Public views, registration, bracket exploration. If an unauthorized user attempts to access admin portals, render the dedicated 403 Forbidden page.
2. **Registration Flow**:
   - Following player registration, route to the dedicated registration success page (`feat(player): add registration success and next steps page`) showing next steps.
3. **Build-Time Requirements**:
   - `NEXT_PUBLIC_API_URL` must be supplied at Docker build time so browser code resolves the public backend properly.

## 4. Development & Verification Commands
- **Run dev server**:
  ```bash
  pnpm dev
  ```
- **Lint & Format**:
  ```bash
  pnpm lint
  pnpm format
  ```
- **Build production bundle**:
  ```bash
  pnpm build
  ```

## 5. Deployment & Infrastructure
- **GitOps App**: Managed via `wikra-gitops` to Wikra k3s cluster (`tuwaga-fe` in `wikra-apps`).
- **Production Domain**: `https://tuwaga.wikra.my.id`
- Follow `docs/ai-deployment-runbook.md` and the `tuwaga-deploy` skill.

## 6. Design System (brand guidelines: 60% charcoal · 30% cream · 10% orange)
- **Colour scales** (`globals.css` `@theme`): `ink-*` warm neutrals ending at brand charcoal `ink-950` `#171717`; `cream-*` around brand cream `cream-200` `#EDDEBD`; `brand-*` around brand orange `brand-500` `#E06D30`. Use `brand-600`+ for orange text on light surfaces (AA). `emerald`/`amber` are re-tuned for status only; `rose` is errors/live alerts. Do not reintroduce `blue`/`slate`/`indigo` utilities.
- **Surfaces**: public headers, navbar, footer and hero bands are charcoal (`bg-ink-950`, cream text); working areas sit on `bg-canvas` with white cards.
- **Type**: Inter Tight (`font-sans`) for everything; Geist Mono (`font-mono`, `.eyebrow`) for labels, scores, and timecodes.
- **Buttons**: always `btn` + one variant — `btn-primary` (orange, one main action per view), `btn-dark`, `btn-outline`, `btn-ghost`, and `btn-cream` / `btn-outline-dark` / `btn-ghost-dark` on charcoal, `btn-outline-ink` on orange. Sizes `btn-sm` / default / `btn-lg`. Group CTAs in `.cta-row` (primary → secondary → `.link-arrow`) so placement matches everywhere and stacks full-width on phones.
- **Layout**: `container-page` (1200px) for public pages, `container-wide` (1440px) for admin; the navbar switches automatically on `active="admin"`.
- **Icons**: prefer none over decorative ones; never use emoji in UI. Icons size with `text-*` (they are `1em`), use `weight="bold"` inline and `"duotone"` for large feature icons.
