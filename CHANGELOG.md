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

- **Phase 1.3 — AI FDD Interpreter (Design & Spec):** a toolbar **AI setup** (Claude / OpenAI / Gemini / OpenAI‑compatible / OCI; API key stored server‑side in a gitignored file, LLM called from the server — never in the browser or git). On **Design & Spec**, upload or paste a requirements / FDD document and the AI extracts **features, pages, flows, validations, conditions, entities** into a **versioned spec saved in DuckDB** (`blueprints` table). Falls back to a heuristic extractor when no key is set. Verified end‑to‑end with Playwright (0 console errors).

- **Phase 1.4 — EquipRite Next "Redwood" shell:** matched EquipRite's Redwood look — top **multi‑tab** navigation with an active‑tab underline, the **teal page‑header banner** (`rgb(44,82,102)`) with Oracle's colour strip, **Oracle Sans**, and EquipRite's exact Redwood tokens (page `rgb(245,244,242)`, ink `rgb(22,21,19)`, accent `rgb(0,104,140)`, 6px radii). Replaces the left‑sidebar shell; oj‑table / oj‑dialog still render via the JET Redwood theme. Verified with Playwright (tabs navigate, banner updates per screen, data from DuckDB, 0 console errors).

### Next
- Convert the remaining card/diagram screens (Product 360, Lifecycle Board, Calendar, Release Readiness, Compare releases) to native JET views; generate VBCS artifacts from a saved spec; add live GitHub / Jira / VB Studio sync; then realize the app in VBCS. See `ROADMAP.md`.

---

*Entries are added here as work lands; each release moves its items from **Unreleased** into a dated version section.*
