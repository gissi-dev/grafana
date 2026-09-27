---
name: open-a-pull-request
description: Prepare a Grafana pull request with Area: Summary titles, one issue, frontend/backend split, required tests, and changelog guidance. Use when opening a PR, drafting a Grafana PR description, or checking merge readiness. Wait for human approval before git push when AGENTS.md requires it.
---

# Open a pull request

Use `contribute/create-pull-request.md` and `contribute/merge-pull-request.md`.

## Checklist

1. **Title**: `Area: Summary` (UpperCamelCase area).
2. **Scope**: One related issue; frontend and backend in separate PRs unless inseparable.
3. **Tests**: Run the suites from `.cursor/rules/pr-tests-must-pass.mdc` for touched areas and confirm exit 0.
4. **Bugs**: Include `Fixes #<n>` or `Closes #<n>` and a regression test when fixing a bug.
5. **Changelog**: Note whether the change should appear in release notes per `contribute/merge-pull-request.md`.
6. **Generated code / flags / migrations**: Call out if present.

## Human review gate

Per `AGENTS.md`, stop and get explicit human approval before `git push` unless the active workflow (for example a cloud agent task) already authorizes push and PR creation.

## PR body sketch

```markdown
## Summary
- ...

## Test plan
- [ ] ...

## Checks run
- `command` — passed
```
