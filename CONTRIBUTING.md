# CONTRIBUTING.md

## How we work

This project is governed by:
- `TEAM_CHARTER.md`
- `AI_EXECUTION_DOCTRINE.md`
- `MIGRATIONS.md`

Read them before contributing.

---

## Default workflow

1. Preflight (workspace, git context, truth sources)
2. Session Spine (goal/scope/anti-goals/contracts/migration guard/acceptance criteria)
3. Minimal plan
4. Execute after approval (or explicit pre-approval)
5. Verify and close out

---

## Contribution rules

- HOLD > GUESS
- evidence-first claims
- no silent mangling
- minimal diffs
- no scope expansion without approval
- no destructive git actions without explicit instruction

---

## Contract changes

If changing a shared schema/API/format:
1. state why
2. state what changed
3. provide migration path
4. define acceptance criteria
5. obtain sign-off

Log it in `MIGRATIONS.md`.

---

## Extension-specific guardrails

Current extension scope includes governed dashboard, hook-driven session capture, deterministic `SESSION_SPINE` and `HOLD_STATE` handling, lifecycle progression with manual fallback, durable closeout/signoff artifacts, history/reporting, and markdown/json export.

Do not merge contributions that imply:
- universal interception of all AI/editor writes
- cloud sync, auth, or telemetry
- hidden network behavior
- broad provider/platform expansion beyond local hook capture

Those remain out of scope for this release.

