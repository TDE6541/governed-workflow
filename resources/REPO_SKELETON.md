# Repo Skeleton - Quick Reference

This is a starter repository structure. Copy it as the foundation for a new project, then add your governance docs (TEAM_CHARTER.md and AI_EXECUTION_DOCTRINE.md) to the root.

---

## What's included

```
repo_skeleton/
├── src/                        # Your application code goes here
├── tests/
│   ├── golden/                 # Known-good reference outputs - regression anchors
│   └── live/                   # Integration and live tests
├── docs/
│   ├── INDEX.md                # Docs index
│   ├── specs/                  # Canonical specifications - authoritative, promoted
│   ├── indexes/
│   │   └── WHERE_TO_CHANGE_X.md # Maintenance change guide
│   ├── schemas/                # Optional contract docs when the project needs them
│   └── learning-notes/         # Optional exploration lane - not authoritative
├── scripts/                    # Utility and automation scripts
├── .gitignore                  # Pre-configured for Python + Node + common IDE/OS files
├── CONTRIBUTING.md             # Contribution guidelines (references the charter)
├── MIGRATIONS.md               # Schema/contract change log (empty, ready to use)
├── REPO_INDEX.md               # Repo-level index
└── README.md                   # Public/front-door overview
```

---

## How to use it

1. Copy this directory as your new project root.
2. Add **TEAM_CHARTER.md** and **AI_EXECUTION_DOCTRINE.md** to the root.
3. Fill in `README.md` and `REPO_INDEX.md` with project truth.
4. Create `docs/INDEX.md` and the `docs/indexes/` files that match the repo's real surfaces.
5. Initialize git: `git init && git add -A && git commit -m "Initial scaffold"`.
6. Start building.

---

## Surface-aware navigation

Use these files as the default navigation spine:

- **`README.md`** - public front door
- **`REPO_INDEX.md`** - repo-level index
- **`docs/INDEX.md`** - docs index
- **`docs/indexes/WHERE_TO_CHANGE_X.md`** - fast change guide

Add engine/ui-specific indexes only when the project actually has those surfaces.

---

## The canon vs exploration boundary

This is the most important structural decision in the skeleton:

- **`docs/specs/`** and **`docs/indexes/`** are canon. The AI treats these as authoritative. Decisions here are settled.
- **`docs/schemas/`** is also canon when the project carries formal data/API contracts.
- **`docs/learning-notes/`** is exploration. Ideas, experiments, research, scratch work. The AI does NOT treat these as requirements or settled decisions.

This boundary prevents the AI from building on top of brainstorms. Keep it clean.

---

## The golden tests directory

`tests/golden/` holds known-good reference outputs - inputs paired with expected results. When you have a pipeline, transformation, or process that should produce consistent output, put a reference case here. It becomes your regression anchor: if a change breaks golden output, you know immediately.

You don't need golden tests on day one. But when your project has any process that transforms input -> output, start capturing them here.
