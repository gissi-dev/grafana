---
name: write-a-backend-test
description: Write Grafana backend Go tests with testing and testify. Use when adding or fixing *_test.go under pkg/ or apps/, writing backend unit tests, or when a Go package needs TestMain via testsuite.
---

# Write a backend test

Follow `contribute/backend/style-guide.md`.

## Steps

1. Prefer co-located `*_test.go` in the same package (or `_test` package when needed for API boundaries).
2. Use the standard library `testing` package and [testify](https://github.com/stretchr/testify) for assertions.
3. If the package already has `TestMain` calling `testsuite.Run`, keep that pattern; add it only when the package needs shared DB/setup like nearby packages.
4. Assert concrete outcomes — values, errors, and side effects — not that code merely ran.
5. Run the narrowest useful command:

```bash
go test -run TestName ./pkg/services/myservice/
```

## Avoid

- Broad refactors while fixing one test.
- Skipping assertions with empty `catch`-style patterns or unused error returns.
- Hand-rolling DB setup that `testsuite` already covers in sibling packages.
