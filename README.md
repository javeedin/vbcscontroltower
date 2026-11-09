# Control Tower

**A VBCS application that manages the complete software development lifecycle — from the first idea to shipped releases — across every product you build, with per‑customer deployment tracking, feature governance, and an AI FDD‑to‑app builder.**

> Status: **Phase 1.2 — real Oracle JET UI + DuckDB backend** (full CRUD, persisted locally). VBCS realization next. See [`ROADMAP.md`](ROADMAP.md).

---

## What it is

Control Tower is the **product‑and‑customer brain** that sits on top of your delivery tools (VB Studio, Git, Jira). It doesn't replace them — it **reads from and orchestrates** them, and adds the layer none of them provide:

- **Portfolio** — every product and the lifecycle phase it's in, at a glance.
- **Product 360** — one product end to end: components, versions, environments, and its **Design & Spec** (RD/FDD/TDD, features, data objects, pages, APIs).
- **Releases & versions** — what's in each release; **compare releases** (features added / changed / removed).
- **Release Readiness** — an automatic go/no‑go score from quality gates.
- **Customers & deployments** — register a customer, assign a version, track **which version/release each customer runs**.
- **Feature governance** — **base vs customer‑specific** features; decide **promote‑to‑core vs customer‑specific**; **compare demand across customers** (common vs specific).
- **CI/CD cockpit** — trigger and monitor pipelines (execution stays in VB Studio / GitHub Actions).
- **AI FDD Interpreter (Blueprint Studio)** — feed an FDD, review the extracted Blueprint, and generate the app scaffold (data model, pages, flows, integrations).

It is **stack‑aware**: register a product as VBCS, React, Node, etc., and Control Tower adapts its integrations and the AI builder's output per stack.

## Why it exists (build vs buy)

No single product covers the full SDLC *plus* the ISV multi‑customer / feature‑governance layer — not Jira, not VB Studio, not GitLab. See **[`docs/00-requirements-RD.md` §8A–§8C](docs/00-requirements-RD.md)**. Control Tower is the missing layer on top; it integrates, it doesn't reinvent.

## Repository layout

```
├── docs/                         The design set (read in order)
│   ├── 00-requirements-RD.md         Requirements: vision, features, data model, roadmap
│   ├── 01-functional-FDD.md          Functional design: 16 screens, flows, status models
│   ├── 02-technical-TDD.md           Technical design: VBCS architecture, data model, AI builder
│   ├── 03-addendum-customers-and-governance.md   Customers, deployments, feature governance
│   └── prototype/
│       ├── index.html                Clickable prototype (open in a browser)
│       └── flows.html                Rendered process-flow diagrams
├── server.js                     Local dev harness (zero-dependency static server)
├── package.json                  npm scripts: serve / start
├── app/                          The VBCS application
│   ├── web/                          the running app (shell + all screens, sample data)
│   ├── README.md                     app structure & build approach
│   └── data-model/                   Business Object definitions (the blueprint)
├── CHANGELOG.md                  What changed per version
├── VERSIONS.md                   Component version registry
└── ROADMAP.md                    Build sequence & open decisions
```

## Run it locally

The app runs as a local dev build (Node, zero dependencies):

```bash
git clone https://github.com/javeedin/vbcscontroltower.git
cd vbcscontroltower
npm install
npm run serve        # → http://localhost:3000
```

This is the **local dev harness**: the UI is built with **real Oracle JET / Redwood components** (oj‑navigation‑list, oj‑table, oj‑button, oj‑dialog, loaded from the Oracle JET CDN — so it needs internet), and **every object type is stored in a local DuckDB database** (`app/data/controltower.duckdb`, seeded from `app/data/seed.json` on first run, served via `/rest/:collection`). You can add, edit and delete records and they persist. It's the development emulation; the production app is realized/deployed in **VBCS** (Business Objects + Service Connections + JET pages) — swapping this harness for VBCS is a base‑URL change.

**Desktop app (Electron):**

```bash
npm run desktop:fresh      # installs Electron on first run, then opens the app window
```

The app uses **Oracle's official Redwood theme** (loaded from Oracle's CDN), so it needs internet. Electron lives in `desktop/`, so a web‑only `npm install` isn't affected by it.

> Prefer no install? Open `docs/prototype/index.html` directly in a browser for the same UI (the early mockup; the real app is under `app/web/`).

## How it's built

- **Platform:** Oracle Visual Builder (VBCS) — Business Objects (data) + Service Connections (REST) + Redwood UI.
- **Reads from / orchestrates:** VB Studio (CI/CD, deploys), Git/GitHub (code), Jira (backlog), an LLM (the AI builder).
- **Versioning:** CalVer for the suite, SemVer per component; `main` + tags; see `VERSIONS.md`.

---

*Control Tower builds and watches products; the engines (VB Studio / GitHub Actions) do the building. It's the cockpit, not the engine.*
