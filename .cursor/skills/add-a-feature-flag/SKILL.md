---
name: add-a-feature-flag
description: Add or gate a Grafana feature behind a feature flag. Use when adding a feature flag, gating new user-facing behavior, editing pkg/services/featuremgmt/registry.go, or running make gen-feature-toggles.
---

# Add a feature flag

Follow `contribute/feature-toggles.md`. Do not hand-edit generated toggle files.

## Steps

1. Add the flag in `pkg/services/featuremgmt/registry.go`.
2. Name it with a service prefix, e.g. `grafana.<name>`.
3. Set `Description`, `Stage`, `Owner`, `Expression` (usually `"false"`), and `Generate` (`Go`, `React` as needed).
4. Run `make gen-feature-toggles`.
5. Use the generated Go constant or React OpenFeature hook — never edit `*_gen.go` / `*.gen.ts` by hand.
6. Keep the new behavior off by default until the flag is enabled.

## Checks

- Confirm generated files are updated in the same change.
- Smoke-test with the flag off and on when UI or API behavior changes.
