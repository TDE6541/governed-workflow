# CONTRIBUTING.md

## How we work

This project is governed by **TEAM_CHARTER.md**. Read it before contributing.

---

## Before you start

1. Read the **TEAM_CHARTER.md** — understand the doctrines
2. Read the **AI_EXECUTION_DOCTRINE.md** — understand the task execution flow
3. Check **MIGRATIONS.md** — know what contracts exist and their current state

---

## Making changes

### All changes
- Follow the four-phase task flow: **Plan → Execute → Self-Audit → Summarize**
- Change only what the task requires (minimal diffs)
- Do not modify artifacts outside the stated scope
- Default status for all new work: **proposed** until approved

### Contract changes (schemas, APIs, data structures, shared formats)
Contract changes require the full protocol:
1. Why — value of the change
2. What changes — fields, behaviors, interfaces affected
3. Migration — backward compatibility, existing data handling
4. Acceptance criteria — how we verify it worked
5. Sign-off — Architect approval before finalizing

Log all contract changes in **MIGRATIONS.md**.

### When uncertain
Surface a **HOLD** instead of guessing:
```
HOLD: [one-sentence summary]
Evidence needed: [what would resolve this]
Impact: [why it matters]
Options: [2-3 alternatives or questions]
```

---

## Commit hygiene

- One coherent change per commit
- Commit messages state *what* and *why*, not *how*
- No unrelated changes bundled into a commit
