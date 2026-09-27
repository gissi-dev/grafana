---
name: regenerate-code
description: Pick and run the correct Grafana code generator from the files touched. Use when changing Wire DI, CUE kinds, feature toggles, OpenAPI/Swagger, i18n strings, or the Go workspace, or when generated files are stale.
---

# Regenerate code

Run only the generator that matches the source you changed.

| If you changed | Run |
| --- | --- |
| `pkg/server/wire.go` or service constructors wired there | `make gen-go` |
| CUE under `kinds/` or app kinds | `make gen-cue` |
| `pkg/services/featuremgmt/registry.go` | `make gen-feature-toggles` |
| OpenAPI / Swagger API specs | `make swagger-gen` |
| User-facing frontend strings | `make i18n-extract` |
| New Go modules / `go.work` | `make update-workspace` |

## Rules

- Do not hand-edit generated output.
- Commit source and generated files together.
- If unsure which target applies, check `AGENTS.md` Commands → Code Generation.
