<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Tuwaga Frontend - Agent Operational Manual

## 1. Overview & Purpose
- **System**: Neo-brutalist tournament experience platform for players, referees, organizers, and admins.
- **Key Features**: Public tournament discovery, player registration, bracket views, real-time live scoring display, order-of-play (OOP) management, crew assignment, and the Hermes AI Copilot drawer for administrators.
- **Companion Backend**: `tuwaga-be` (Rust Axum on port `8004`, production: `https://api-tuwaga.wikra.my.id`).

## 2. Architecture & Tech Stack
- **Framework**: Next.js 16 App Router with React 19.
- **Styling**: Tailwind CSS v4, Lucide icons, Neo-brutalist design language (bold borders, stark drop shadows, high contrast).
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
