# Quickstart: Governed AI-Assisted Work in 5 Minutes

This gets you from zero to a governed session quickly.

## Minute 0-1: Install the three core skills

Copy these files into your tool's skills directory:

- `skills/hold-doctrine-SKILL.md`
- `skills/fire-team-session-SKILL.md`
- `skills/governed-repo-init-SKILL.md`

Common locations:

- Claude Code: `~/.claude/skills/`
- Codex: `~/.codex/skills/`

If your tool uses project knowledge files, add these three files there.

## Minute 1-2: Confirm governance is active

Start a new session and paste:

```text
Read hold-doctrine and fire-team-session.
Confirm HOLD > GUESS and the session flow before execution.
``` 

Expected behavior:

- it identifies truth sources
- it separates known facts from unknowns
- it asks for approval before implementation

## Minute 2-4: Run one real task

Give one bounded task:

```text
Goal: [one sentence]
Must-ship: [one artifact]
Constraints: minimal diff, no scope expansion
What are your HOLDs before we start?
``` 

Approve only after the plan is explicit.

## Minute 4-5: Close out correctly

Require this closeout structure:

- changes made
- acceptance status (PASS/FAIL/HOLD)
- remaining HOLDs
- next actions
- signoff status

If uncertainty remains in a load-bearing area, keep the task in HOLD.

## Next reads (in order)

1. `WORKFLOW.md`
2. `docs/ABSENCE_PATTERNS.md`
3. `examples/annotated-session.md`
4. `README.md`

## What this quickstart does not do

- no cloud setup
- no auth setup
- no telemetry setup
- no runtime installation requirements for the skills path

It installs behavior, not infrastructure.
