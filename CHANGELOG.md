# Changelog

All notable changes to Control Tower are recorded here.
Format based on [Keep a Changelog](https://keepachangelog.com/); versioning follows [SemVer](https://semver.org/) per component and CalVer for the suite (see `VERSIONS.md`).

## [Unreleased]

### Added
- Repository foundation: `README`, `CHANGELOG`, `VERSIONS`, `ROADMAP`, `.gitignore`, CI workflow.
- Full design set under `docs/`: Requirements (RD), Functional Design (FDD), Technical Design (TDD), and the Customers & Governance addendum.
- Clickable prototype (`docs/prototype/index.html`) and rendered process flows (`docs/prototype/flows.html`).
- `app/` scaffold with the Business‑Object data model (blueprint).
- **Phase 1 — runnable local dev build:** zero‑dependency Node harness (`server.js`, `npm run serve`) serving the full Control Tower UI at `app/web/` — portfolio, product 360, releases, compare, CI/CD, readiness, version matrix, calendar, customers, features & demand, enhancements, design & spec, admin — with sample data. Verified rendering end‑to‑end (0 console errors).
- **Phase 1.1 — real Oracle Redwood look:** the app loads Oracle's official **Redwood theme** and maps its UI onto real Redwood **design tokens** (brand, neutrals, dividers, status colors, radii) from the Oracle JET CDN — authentic VBCS styling across every screen, light & dark. Verified with Playwright (tokens resolve, 0 errors).
- **Desktop app (Electron):** `npm run desktop:fresh` opens Control Tower in a native desktop window (wraps the dev server). Electron stays in `desktop/` so a web‑only install isn't affected.

- **Phase 1.2 — real Oracle JET UI + DuckDB backend:** the app is now built with genuine Oracle JET Redwood components (oj‑navigation‑list, oj‑table, oj‑button, oj‑dialog) from the Oracle JET CDN, and **every object type is a DuckDB table** (`@duckdb/node-api`, seeded from `app/data/seed.json`). Full CRUD — create via dialog, per‑row delete — persists to the local DuckDB file through a REST API (`/rest/:collection`). Verified end‑to‑end with Playwright (UI create persists; 0 console errors).

### Next
- Convert the remaining card/diagram screens (Product 360, Board, Calendar, Readiness, Compare, Design & Spec) to native JET views; add edit‑in‑place and live GitHub / Jira / VB Studio sync; then realize the screens as a deployable VBCS app. See `ROADMAP.md`.

---

*Entries are added here as work lands; each release moves its items from **Unreleased** into a dated version section.*
