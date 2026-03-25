# Governed Workflow

This repository runs local-first governed coding sessions with explicit receipts.

## Operational Truth
- Canonical portable governance lives in `skills/*-SKILL.md`.
- `CLAUDE.md` + `.claude/` is the Claude Code-native compatibility layer.
- The VS Code extension in `extension/` remains a standalone/manual fallback surface.

## Non-Negotiables
- HOLD > GUESS.
- Evidence first.
- No silent mangling.
- Contract discipline.
- Minimal diffs.
- WIP = 1.
- No destructive git without explicit human instruction.
- Local-first only: no telemetry, no hidden network behavior.

## Session Posture (Every Run)
1. Preflight: confirm workspace path, branch, git status, remotes, and truth sources.
2. Session Spine: establish one bounded goal, in-scope items, anti-goals, contracts touched, migration guard, and acceptance criteria.
3. Plan before change: keep edits narrow and explicit.
4. Execute additively: avoid architecture drift, speculative expansion, and side quests.
5. Verify and close out with explicit PASS/FAIL/HOLD status.

## Deterministic Blocks
When structured updates are needed, emit fenced JSON blocks exactly as:
- `SESSION_SPINE` for goal/truth/contract/closeout metadata.
- `HOLD_STATE` for raised/cleared HOLD state.

Unknown values must be `null`, not guessed.

## Session Spine Update Discipline
Use this update shape during meaningful checkpoints:
- `Session Spine`
- `Objective`
- `Current Phase`
- `Files Touched`
- `What Changed`
- `Verification Run`
- `Remaining Risk`
- `Next Step`

## Closeout Requirements
Always finish with:
- Changes made
- Acceptance criteria status
- Remaining HOLDs
- Next actions
- Signoff status

## Claude Code Hook Compatibility
- Hooks append local JSONL events to `.governed/hooks/events.jsonl`.
- On `Stop`, transcript parsing is post-stop only (no streaming interceptor).
- Parsed `SESSION_SPINE` and `HOLD_STATE` blocks are normalized into append-only event lines.

## Canon References
- `skills/hold-doctrine-SKILL.md`
- `skills/fire-team-session-SKILL.md`
- `skills/governed-repo-init-SKILL.md`
- `TEAM_CHARTER.md`
- `AI_EXECUTION_DOCTRINE.md`
- `CONTRIBUTING.md`
- `MIGRATIONS.md`
