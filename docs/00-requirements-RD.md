# Control Tower — Requirements Document (RD)

**A VBCS application that manages the complete development lifecycle of every product you build — from the first idea to shipped releases — on one dashboard.**

| | |
|---|---|
| **Working name** | Control Tower *(rename freely — e.g. Orbit, Launchpad, DevCockpit)* |
| **Document type** | Requirements Document (RD) — vision, features, data model, roadmap |
| **Status** | Draft v0.1 — for review before build |
| **Platform** | Oracle Visual Builder (VBCS): Business Objects (data) + Service Connections (REST) + Redwood UI |
| **Audience** | You (the builder/owner) — this is an internal tool |
| **Date** | 2026‑11‑07 |

---

## 1. The problem

You build products one after another, all in VBCS. Today the "state" of each product lives in scattered places — git branches, Jira, your head, a few markdown files. There is **no single place** that answers, at a glance:

- What products do I have, and what phase is each in?
- What's shipping next, in what version, and is it *ready* to ship?
- Which ideas are worth building next?
- What's deployed where, and is it healthy?

**Control Tower is that single place** — one app that follows a product from **idea → requirements → design → build → test → release**, across your whole portfolio.

---

## 2. Vision & goals

**Vision:** *One pane of glass over every product's entire life.* Start a product right, watch it move through every phase, and ship it with confidence — the same way Oracle runs Fusion at scale, shrunk to your size.

**Goals**
1. **Portfolio visibility** — see every product and its phase in one view.
2. **Idea‑to‑release traceability** — follow one product from idea to shipped version, with nothing lost between stages.
3. **Release confidence** — an automatic "readiness score" so you never ship with a gate unmet.
4. **One standard** — every product starts and runs the same way (your own method, enforced).
5. **Live status** — pull real data from GitHub / Jira / VB Studio instead of re‑typing it.

**Non‑goals (v1)**
- It does **not** build, compile, or deploy code — GitHub Actions / VB Studio do that; Control Tower *monitors and orchestrates*.
- It is **not** a replacement for git or an IDE.
- It is **not** multi‑user/enterprise at first — it's your personal cockpit (multi‑user can come later).

**Success metrics**
- 100% of your active products registered and showing a current phase.
- Every release gets a readiness score before it ships.
- Zero "what version is live?" moments — the version matrix always answers it.

---

## 3. Users (personas)

Since it's internal, you wear every hat — but the tool should serve each *function*:

| When you act as… | You need Control Tower to… |
|---|---|
| **Product manager** | capture ideas, prioritise, see the roadmap/portfolio |
| **Developer / tech lead** | see build/CI status, branches, what's in progress |
| **QA** | see test/quality gates, what's blocking a release |
| **Release manager** | cut releases, check readiness, track versions & what's live |
| **Ops** | see environments, deployments, open incidents/risks |

*(Designed so that if you add a teammate later, these become real roles.)*

---

## 4. Scope — the lifecycle it manages

Control Tower owns the full chain, with a screen (or clear support) for each stage:

```
💡 Idea → 📋 Requirements → 🎨 Design → 🔨 Build → ✅ Test → 🚀 Release → 📈 Operate → (next idea)
```

| Stage | What Control Tower does here |
|---|---|
| **Idea / Discovery** | capture ideas, score/prioritise, promote to a product or feature |
| **Requirements** | hold goals, scope, stories & acceptance criteria (or link to Jira) |
| **Design** | track design status, link to wireframes/ADRs |
| **Build** | show git/CI status: branches, PRs, build pass/fail (live from GitHub/VB Studio) |
| **Test** | track quality gates, test results, open bugs |
| **Release** | cut a versioned release, compute readiness, write release notes, record what's live |
| **Operate** | track environments, deployments, incidents, risks |

---

## 5. Feature modules

Each module below becomes one or more VBCS pages. Requirements are written as **FR‑x** (functional requirement).

### 5.1 Portfolio Dashboard *(home)*
The landing screen — health of everything at a glance.
- **FR‑1** Show a card per product: name, current lifecycle phase, release‑readiness traffic light, next release, open‑risk count.
- **FR‑2** Show a KPI strip: total products, # in build, # releasing this quarter, open risks/incidents.
- **FR‑3** Clicking a product card opens **Product 360**.
- **FR‑4** Filter/sort by phase, owner, or readiness.

### 5.2 Product 360
Everything about one product.
- **FR‑5** Phase stepper (Idea→Requirements→Design→Build→Test→Release) with the current phase highlighted.
- **FR‑6** Components table: each shippable piece (web app, mobile, API…) with its current version.
- **FR‑7** Environments panel: Dev / Test / Prod instances — what version is deployed, when, health.
- **FR‑8** Current sprint / in‑progress work (from Jira), recent releases, open risks.
- **FR‑9** Quick links out to the git repo, Jira board, VB Studio project, docs.

### 5.3 Ideas & Backlog
Where products and features begin.
- **FR‑10** Capture an idea: title, problem, value, effort guess, status (New / Evaluating / Accepted / Rejected).
- **FR‑11** Simple prioritisation (e.g. value × effort score, or a RICE‑style field).
- **FR‑12** Promote an accepted idea into a **Product** or a **Release** item.

### 5.4 Lifecycle Board
A Kanban of the whole portfolio by phase.
- **FR‑13** Columns = lifecycle phases; cards = products (or releases) sitting in their current phase.
- **FR‑14** Drag a card to advance its phase (updates the product record).

### 5.5 Releases
The release register across all products.
- **FR‑15** Table of releases: product, version, target date, Oracle train (e.g. 26C), state (Planned / In progress / Released), readiness %.
- **FR‑16** Create a release: pick product, set version (SemVer per component, CalVer for the suite), scope, train.
- **FR‑17** Auto‑draft release notes from linked commits/stories (AI assist — see 5.11).

### 5.6 Release Readiness *(the signature feature)*
An automatic go/no‑go score — borrowed from Oracle's "Release Readiness".
- **FR‑18** For a selected release, show a **checklist of gates** with pass/fail:
  tests green · acceptance criteria present · changelog updated · version bumped · deployed to Test · no open blockers.
- **FR‑19** Compute a **readiness %** and a traffic light (🔴/🟡/🟢) from the gates.
- **FR‑20** Each gate can be auto‑checked (from GitHub/Jira) or manually ticked.
- **FR‑21** Block / warn on "Release" if readiness is below a threshold.

### 5.7 Version Matrix
The live answer to "what version is everything?"
- **FR‑22** Grid: products (rows) × components (columns) → current version per cell.
- **FR‑23** Show which version is **live in Production** vs **latest built**.
- **FR‑24** Map a suite/marketing version to its component versions (e.g. "EquipRite 2026.1 = web 1.3.0 + mobile 1.1").

### 5.8 Release Calendar (Oracle train)
- **FR‑25** Calendar overlaying **Oracle's quarterly train** (26A–26D, 27A…) with your planned releases pinned.
- **FR‑26** Flag releases that land inside an Oracle update/test‑pod window (so you don't ship blind into an upgrade).

### 5.9 Integrations
Live data instead of manual entry.
- **FR‑27** **GitHub**: repos, branches, PRs, Actions (CI) status, tags, releases.
- **FR‑28** **Jira**: stories, sprints, fixVersions, acceptance‑criteria presence.
- **FR‑29** **VB Studio / OCI DevOps**: builds, deployments.
- **FR‑30** Connection status + last‑sync time per integration; a "Sync now" action.

### 5.10 Admin & Product Registration
- **FR‑31** Register a new product: name, repo, Jira project, VBCS instance URLs, owner.
- **FR‑32** Define the **standard checklist/gate template** applied to every new release.
- **FR‑33** Manage lookups (phases, environments, train names).

### 5.11 AI Assist *(innovative, reuses your Ask‑AI work)*
- **FR‑34** Draft release notes / changelog from commit messages & closed stories.
- **FR‑35** Summarise a product's status in plain English.
- **FR‑36** Flag risks ("3 stories have no acceptance criteria", "version not bumped").

---

## 6. Information architecture (navigation / menu)

**Left sidebar (primary menu):**
- 🏠 **Portfolio** (dashboard / home)
- 💡 **Ideas & Backlog**
- 🧭 **Lifecycle Board**
- 🚀 **Releases**
- ✅ **Release Readiness**
- 🔢 **Version Matrix**
- 📅 **Calendar**
- 🔌 **Integrations**
- ⚙️ **Admin**

**Top bar:** app name/logo · global search · theme toggle (light/dark) · sync status · user menu.

**Drill‑downs:** Portfolio card → Product 360 → (component, release, environment detail).

---

## 7. Data model (VBCS Business Objects)

Business Objects are VBCS's built‑in database — no extra infrastructure. Core objects and key fields:

| Business Object | Key fields | Relationships |
|---|---|---|
| **Product** | name, description, owner, phase, status, repoUrl, jiraProject, vbStudioUrl | has many Components, Releases, Environments, Risks |
| **Component** | name, type (web/mobile/api), versionScheme, currentVersion | belongs to Product |
| **Release** | version, suiteVersion, targetDate, train, state, readinessPct, notes | belongs to Product; has many GateResults |
| **Gate** *(template)* | name, type (auto/manual), rule, weight | used by GateResult |
| **GateResult** | status (pass/fail/na), source, checkedAt | belongs to Release + Gate |
| **Environment** | name (Dev/Test/Prod), url, deployedVersion, deployedAt, health | belongs to Product |
| **Idea** | title, problem, value, effort, score, status | may promote to Product/Release |
| **Risk / Incident** | title, severity, status, description, postmortem | belongs to Product |
| **ADR** | title, decision, context, consequences, date | belongs to Product |
| **Integration** | type (GitHub/Jira/VBStudio), config, lastSync, status | global |
| **Link** | type, url, label | polymorphic (to Product/Release) |

*Cached live data (PRs, builds, sprint items) is stored on/under these objects and refreshed by sync, so the UI is fast and respects API rate limits.*

---

## 8. Integrations — how data gets in

VBCS **Service Connections** (REST) pull from:
- **GitHub REST API** — commits, PRs, Actions runs, tags, releases.
- **Jira REST API** — issues, sprints, fixVersions.
- **VB Studio / OCI DevOps REST** — builds, deployments.

**Sync strategy** (VBCS has no strong built‑in scheduler — choose per need):
1. **Refresh‑on‑open + "Sync now" button** (MVP, simplest).
2. **Cache in Business Objects**, refreshed periodically (respects rate limits).
3. **Push from outside** — an OIC scheduled integration or a VB Studio pipeline POSTs fresh data to Control Tower on a cron (for near‑real‑time).

**Secrets** (GitHub/Jira tokens) live in the Service Connection's authentication — **never in a Business Object**.

---

## 8A. Build vs buy — why Control Tower exists

No single product covers this whole need:

- **Dev platforms** (GitLab, GitHub, Azure DevOps, VB Studio) do version control + CI/CD + releases — but not the portfolio view, per‑customer deployments, or feature governance.
- **Jira / Atlassian** is an excellent tracker with basic release management — but it is not a full SDLC tool on its own (no VCS, no CI/CD engine) and has no native model for "which version each customer runs" or base‑vs‑customer‑specific features.
- **Product tools** (Productboard, Aha!) do demand; **feature‑flag tools** (LaunchDarkly) do per‑customer enablement; **ALM suites** (Polarion, Jama) do variant management — each only a slice.

The slice **nobody sells** is the ISV layer: portfolio + per‑customer deployments + base‑vs‑custom feature governance + an AI FDD builder, VBCS‑native.

**Principle: integrate, don't reinvent.** Control Tower is the **layer on top** that unifies these and adds what's missing — it *reads from* Git / Jira / VB Studio rather than replacing them.

## 8B. What Control Tower owns vs reads

| Capability | System of record | Control Tower's role |
|---|---|---|
| Source control (Git) | GitHub / VB Studio | **reads** (branches, PRs, tags) |
| CI/CD execution | VB Studio / GitHub Actions / OCI DevOps | **triggers + reads** (status, logs) |
| Backlog, sprints | Jira | **reads** (or owns if no Jira) |
| Design docs (RD/FDD/TDD) | Confluence / repo | **owns / links** (ProductDoc) |
| Portfolio, readiness, version matrix | — | **owns** |
| Customers, deployments, feature governance | — | **owns** (no other tool does) |
| AI FDD builder (Blueprint) | — | **owns** |
| Feature flags | LaunchDarkly / Unleash | **reads / links** |

## 8C. CI/CD — control plane, not engine

**Can Control Tower do CI/CD?** It can own the *control & visibility* half — but **not the execution engine**, and it shouldn't try to.

- **CI/CD needs build compute** (runners that check out code, run builds/tests, deploy). **VBCS has no build runners** — it's metadata + REST, not a build farm. Rebuilding an execution engine inside VBCS is neither possible nor wise.
- **What Control Tower *does* own (the cockpit):** trigger pipelines (REST), show live run status, link to logs, **gate releases** on build/test results, and record **deploy history + DORA metrics**.
- **The smart bit:** when **Blueprint Studio** scaffolds an app, it also **generates the pipeline config** (a GitHub Actions workflow or a VB Studio pipeline) and commits it — so Control Tower *sets up* CI/CD per product without executing it.
- **Executors (the engine):** **VB Studio** (VBCS‑aware — recommended for the web apps), **GitHub Actions** (the packaged desktop/Android apps), OCI DevOps, GitLab CI, Jenkins.

So Control Tower "has CI/CD" the way a cockpit "has engines": it commands and monitors them; the engines do the work.

---

## 9. Non‑functional requirements

- **NFR‑1 Platform:** built entirely in VBCS; reuse your existing Redwood shell + binding conventions.
- **NFR‑2 Security:** API tokens stored in Service Connection auth, not data; least‑privilege scopes.
- **NFR‑3 Performance:** cache external data; page loads from Business Objects, not live API calls on every render.
- **NFR‑4 Rate limits:** batch/throttle GitHub/Jira calls; show last‑sync time.
- **NFR‑5 Responsive:** works on desktop and phone (you follow things on mobile).
- **NFR‑6 Theming:** light/dark, consistent with your other apps.
- **NFR‑7 Deployability:** standard VBCS dev → stage → publish; versioned like any product (dogfood).

---

## 10. Assumptions & constraints

- You develop **only in VBCS** → the tool is VBCS‑native by design.
- It starts as a **single‑user** internal tool.
- Control Tower is **Product #1 in its own registry** (it tracks itself — proof the model works).
- It depends on external APIs being reachable (GitHub/Jira) for live data; it still works (read‑only on cached data) if a sync fails.

---

## 11. Phased roadmap

| Phase | Scope | Outcome |
|---|---|---|
| **MVP (v0.1)** | Product + Component + Release Business Objects · Portfolio dashboard · Product 360 · manual entry · "Sync now" GitHub pull | *See every product in one place.* |
| **v0.2** | Gate/GateResult + Release Readiness score · Version Matrix | *Ship with confidence; always know versions.* |
| **v0.3** | Live Jira + GitHub Actions status · Lifecycle Board · Calendar (train) | *Status is live, not typed.* |
| **v0.4** | Ideas & Backlog · Admin product registration · standard checklist template | *The full idea→release chain, standardised.* |
| **v1.0** | AI assist (release notes, risk flags) · Integrations screen · polish · self‑host/dogfood complete | *A real internal product.* |

---

## 12. Open questions (for you)

1. **Final name** — Control Tower, Orbit, Launchpad, DevCockpit, or your own?
2. **Jira**: reuse the same connection style as EquipRite, or a dedicated read‑only token?
3. **Sync**: start with on‑open + manual "Sync now" (simplest), or set up OIC/VB Studio push early?
4. **Single‑user now**, or design the data model for teammates from day one?
5. **MVP first product to register** — Control Tower itself + EquipRite?

---

*Next step after you review this + the prototype: lock the MVP scope (§11), create the repo, and scaffold the VBCS skeleton (shell + Portfolio dashboard) from commit #1 with `main` + CHANGELOG + VERSIONS + CI.*
