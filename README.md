# Governed Workflow

MIT-licensed, local-first governance toolkit for AI-assisted coding.

## HOLD > GUESS

If uncertainty is load-bearing, surface a HOLD instead of inventing an answer.

That single rule prevents the most expensive failure mode in AI-assisted work: confident output built on missing facts.

## The problem

Ungoverned AI sessions often fail in predictable ways:

- plausible fabrication presented as fact
- silent mangling of files or structure
- contract drift across schemas, APIs, and exports
- scope creep from "helpful" adjacent edits
- missing required outputs hidden by fluent summaries

These failures are usually discovered late, after rework has already started.

## The solution

This repo packages a practical governance method that keeps velocity while protecting correctness:

- HOLD > GUESS for uncertainty handling
- evidence-first claims
- no silent mangling
- contract discipline
- minimal diffs

The focus is operational behavior, not runtime theater.

## Three working surfaces

### 1) Portable governance skills (`skills/`)

Drop-in `SKILL.md` files that carry the method across environments.

Core skills:

- `skills/hold-doctrine-SKILL.md`
- `skills/fire-team-session-SKILL.md`
- `skills/governed-repo-init-SKILL.md`

New supplementary skills in v0.3.0:

- `skills/governance-retrospective-SKILL.md`
- `skills/absence-audit-SKILL.md`

### 2) Claude Code compatibility at repo root (`CLAUDE.md` + `.claude/`)

A local compatibility bridge that emits deterministic session receipts.

### 3) Standalone VS Code extension (`extension/`)

A local dashboard surface for governed session visibility and lifecycle handling.

## Start in 5 minutes

1. Read `QUICKSTART.md` for first-run setup.
2. Run the full session flow in `WORKFLOW.md`.
3. Learn omission detection in `docs/ABSENCE_PATTERNS.md`.
4. See a concrete HOLD moment in `examples/annotated-session.md`.

## What this repo does not do

- cloud sync
- auth
- telemetry or analytics
- hidden network behavior
- universal interception of editor or AI writes
- broad provider expansion beyond the local compatibility bridge

## Repo map

- `REPO_INDEX.md` for top-level navigation
- `docs/INDEX.md` for docs navigation
- `docs/specs/PUBLIC_THESIS_OBJECT.md` for claims boundary and surfaces
- `resources/WHY_THIS_KIT.md` for failure-mode framing
- `examples/session.md` and `examples/session.json` for artifact shape

## Optional: run the extension locally

```powershell
cd extension
npm install
npm run compile
```

Open `extension/` in VS Code, press `F5`, then run `Governance: Open Dashboard`.

## Version line

This front door integrates the v0.3.0 public documentation and skill surfaces.
