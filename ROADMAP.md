# Roadmap

Build sequence for Control Tower. Designed to deliver value fast (Monitor first), then the harder, higher‑value Builder.

## Phases

| Phase | Scope | Outcome |
|-------|-------|---------|
| **0 — Foundation** ✅ | repo, docs, prototype, CI, versioning | a real project foundation (this commit) |
| **1 — Monitor MVP (v0.1)** | VBCS shell + **Portfolio dashboard** + **Product 360** + Business Objects (Product, Component, Release) · manual entry + a "Sync now" GitHub pull | *See every product in one place* |
| **2 — Releases & readiness (v0.2)** | Releases, **Release Readiness** score + gates, **Version Matrix**, **Compare releases** | *Ship with confidence; always know versions* |
| **3 — Customers & governance (v0.3)** | **Customers**, **Customer 360** (deployments), **Features & demand** matrix, **Enhancements** (promote‑to‑core) | *Per‑customer tracking + feature governance* |
| **4 — Integrations & CI/CD cockpit (v0.4)** | live GitHub/Jira/**VB Studio**; **CI/CD** screen (trigger + status + DORA); stack adapters (VBCS/React) | *Status is live, not typed* |
| **5 — AI FDD Interpreter (v1.0)** | **Blueprint Studio**: FDD → Blueprint → generate VBCS scaffold → validate → apply | *Build products from an FDD* |

Details per feature are in `docs/01-functional-FDD.md` (screens) and `docs/02-technical-TDD.md` (architecture + data model).

## Open decisions (to confirm before Phase 1 code)

1. **Build approach for the VBCS app** — *code‑first sources in git + a local run harness* (how EquipRite is built, so changes are testable immediately) **vs** *Designer‑first* (built in VBCS Designer, git mirrors exports). Recommended: **code‑first**.
2. **Monitor‑first vs Builder‑first** — recommended: **Monitor first** (Phases 1–4), Builder as the v1.0 flagship. The prototype can prove the Builder UX earlier if preferred.
3. **LLM for the Builder** — OCI GenAI (keeps FDD IP in your tenancy) + Claude for quality, user‑selectable (reuse the EquipRite "Ask AI" picker).
4. **Sync mode for MVP** — on‑open + "Sync now"; add OIC/VB Studio push later.

## Principles

- `main` is always releasable; feature branches → PR → green CI → merge; tag every release.
- Integrate, don't reinvent: read from VB Studio / Git / Jira; own the product + customer + governance layer.
- No secrets in the repo or in Business Objects — tokens live in Service Connection auth.
