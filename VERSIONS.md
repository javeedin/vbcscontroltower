# Versions

One place that answers "what version is everything?" (Control Tower's own version registry — and the pattern it implements for the products it tracks).

## This product (Control Tower)

| Component | Scheme | Current | Notes |
|-----------|--------|---------|-------|
| **Control Tower (suite)** | CalVer | `2026.0` (pre‑release) | marketing/release version |
| **VBCS app** | SemVer | `0.1.0` | the Visual Builder application |

Suite release mapping (filled as we ship):

> **Control Tower 2026.0** = VBCS app `0.1.0`

## Versioning rules

- **Suite:** CalVer `YYYY.N` — ships on a cadence; "how current is this" is obvious.
- **VBCS app:** SemVer `MAJOR.MINOR.PATCH` — MINOR for features, PATCH for fixes, MAJOR at first stable GA.
- **Tag every release** `vX.Y.Z` on `main`; note the component versions in the tag message and `CHANGELOG.md`.
