# PUBLIC_THESIS_OBJECT.md

## Core thesis

AI-assisted work in real environments needs governance, not just speed.

## Public release object (v0.2.0)

This repository ships one governed workflow toolkit with three explicit operating surfaces.

### Surface 1: Portable governance skills (canonical)

Canonical governance artifacts remain in `skills/` as `SKILL.md` files:
- `hold-doctrine-SKILL.md`
- `fire-team-session-SKILL.md`
- `governed-repo-init-SKILL.md`

These are the portable governance source of truth.

### Surface 2: Claude Code native compatibility

Claude Code compatibility is additive and local-first through:
- `CLAUDE.md`
- `.claude/settings.json`
- `.claude/hooks/emit-governed-event.mjs`

The hook bridge appends local receipts to `.governed/hooks/events.jsonl` and performs deterministic post-stop extraction of fenced `SESSION_SPINE` and `HOLD_STATE` blocks.

### Surface 3: Standalone VS Code extension mode

`extension/` remains a stable standalone/manual governed workflow surface with:
- dashboard command (`Governance: Open Dashboard`)
- hook intake from `.governed/hooks/events.jsonl`
- deterministic session enrichment/HOLD handling
- closeout/signoff, history/reporting, and export

## Runtime responsibilities (v0.2.0)

- local dashboard visibility for workspace and git context
- auto-draft creation from first meaningful hook event
- deterministic `SESSION_SPINE` enrichment
- deterministic `HOLD_STATE` capture, persistence, and enforcement
- lifecycle progression with manual fallback controls
- stop/end-driven durable closeout
- file-touch capture and advisory contract-risk hints
- history/reporting over local artifacts
- markdown/json export for selected sessions

## Claims boundary

This product governs the local workflow path it implements.

Out of scope:
- cloud sync
- auth
- telemetry/analytics
- hidden network behavior
- broad provider-platform expansion beyond the Claude Code compatibility bridge

## Publication proof boundary

The publication lane is grounded by:
- public front-door and navigation docs
- proof lane docs and example artifacts
- verified local package output

Optional supplement:
- GUI screenshots can be captured with `proof/CAPTURE_RUNBOOK.md`
