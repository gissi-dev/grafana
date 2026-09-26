---
name: learn-repo
description: >-
  Learn an unfamiliar repository and explain it. Leads with an architecture
  diagram, then a repo overview of request flow, directory map, backend and
  frontend shape, and local commands. Use when the user asks to explain a
  codebase, learn a repo, show its architecture, or asks for an architecture
  diagram of the project.
---

# Learn Repo

Explain the current repository. Lead with the architecture diagram, then the repo overview. Ground every claim in files you read. Do not invent services, layers, or commands.

## 1. Orient

Read these before writing anything:

1. Top-level directories.
2. The README, plus `AGENTS.md` or `CLAUDE.md` if present.
3. Language manifests for name, version, and license (`package.json`, `go.mod`, `pyproject.toml`, `Cargo.toml`, or the equivalent).
4. Process entry points: server/CLI `main`, and the frontend bootstrap if there is one.
5. The major code directories those entry points delegate to (services, features, packages, apps, plugins).

## 2. Find an existing architecture

Search docs and contributor guides for an architecture diagram before drawing one (`contribute/architecture`, `docs/`, `ARCHITECTURE.md`).

- If the repo already has a diagram, use that diagram and cite its file.
- Draw an additional diagram only for a boundary the existing one does not show.
- If none exists, draw from the entry points and directories you read.

## 3. Answer

Write the response in this order. Do not open with the overview.

### Architecture diagram

Put diagrams first.

1. One high-level runtime diagram: user, UI, server, persistence, and external systems the process talks to.
2. If the repo documents an internal request path, include that diagram next and cite the file.

Use a fenced `mermaid` block. Label nodes with real paths. Use solid arrows for the path that is live, and dashed arrows only when the source marks a path as optional or in migration. Omit a layer the repo does not have.

### Repo overview

After the diagrams, write the overview in this order:

1. **What it is.** One short paragraph: product, version, license, and what the running process does.
2. **How a request moves.** Numbered steps from the entry files you read through handlers, services, and the UI.
3. **Where the code lives.** A table of area, path, and role, limited to directories that exist.
4. **Backend shape.** How services, storage, plugins, and dependency injection are organized. Name the files.
5. **Frontend shape.** How features, state, and shared packages are organized. Skip this section when there is no frontend.
6. **Working on it.** Build, run, and test commands copied from the README, Makefile, or package scripts. Do not guess commands or flags.

Keep each section short. Prefer a table for the directory map and numbered steps for the request path.
