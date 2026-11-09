# app/ — the VBCS application

This folder holds the Control Tower Visual Builder application as it's built.

## Structure (as it fills in)

```
app/
├── data-model/            Business Object definitions (the blueprint — see below)
│   └── business-objects.json
├── (vbcs sources)         Visual Builder app sources: flows, pages, action chains,
│                          service connections — added as screens are built
└── README.md              this file
```

## Data model

`data-model/business-objects.json` is the **blueprint** for the Business Objects Control Tower uses — Products, Releases, Customers, Features, Deployments, the Builder's Blueprint objects, and more. It is a design artifact (stack‑neutral), derived from `docs/02-technical-TDD.md §3` and the customers addendum. Each object becomes a VBCS Business Object when the app is built.

> It is a specification, **not** a VBCS import file — the authoritative Business Objects are created in VBCS from this spec.

## Build approach

To be confirmed (see `ROADMAP.md` → Open decisions):
- **Code‑first** — author VBCS sources here in git and run via a local harness (how EquipRite is built), or
- **Designer‑first** — build in VBCS Designer; git mirrors exports.

## Conventions (carried from EquipRite)

- VBCS binding rules: no arrow functions / `String()` / `Number()` / `Boolean()` in bindings; `:style` must be an object; no `oj-bind-for-each` in select/table; action chains are AMD classes named after their file.
- Redwood UI; light/dark; responsive.
- No secrets in Business Objects — tokens via Service Connection auth.
