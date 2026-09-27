---
name: add-a-migration
description: Add a Grafana SQLStore database migration under pkg/services/sqlstore/migrations/. Use when adding or changing database schema, SQL migrations, or when the user mentions migrations, postgres_tests, or mysql_tests.
---

# Add a migration

Migrations live under `pkg/services/sqlstore/migrations/`. See `AGENTS.md` and `contribute/backend/database.md`.

## Steps

1. Find the right migration package or file for the domain (or add one next to existing peers).
2. Register the migration in that package's migration list the same way nearby migrations do.
3. Keep the change backward compatible where possible (additive columns/indexes preferred over destructive edits).
4. Avoid data loss; prefer multi-step deprecation for removals.
5. Run integration checks when schema is involved:

```bash
make devenv sources=postgres_tests,mysql_tests
make test-go-integration-postgres
```

## Notes

- Match naming and helper patterns from the closest modern migration in the same folder.
- Do not edit historical migrations that already shipped; add a new one.
- Call out upgrade risk and any required follow-up in the pull request.
