# Governed AI-Assisted Development Workflow

This is the practiced workflow for shipping with AI assistance without losing truth, scope, or contract safety.

If you only remember one line, remember this:

**HOLD > GUESS**

When uncertainty appears, we surface it, resolve it, and keep moving on what is supported.

## What this workflow is for

Use this workflow when work has a real delivery state:

- code changes
- multi-file docs changes
- contract-adjacent edits (schemas, APIs, exports, shared formats)
- anything where wrong assumptions create expensive rework

Do not use this as heavy ceremony for casual chat or rough brainstorming.

## Operating laws

These laws are load-bearing:

1. HOLD > GUESS
2. Evidence-first
3. No silent mangling
4. Contract discipline
5. Minimal diffs

If a proposed action violates one of these laws, pause and correct course before editing.

## Session flow

Every governed session runs in this order.

### 1) Preflight

Confirm the operating perimeter before touching files:

- repo/workspace path
- current branch/context
- git cleanliness and staged state
- remotes
- governing truth sources for this task

If the perimeter is unclear, emit a HOLD and stop.

### 2) Session Spine

Write a one-screen framing contract:

- Goal
- In scope
- Anti-goals
- Truth sources
- Contracts touched: Yes/No
- Migration guard: Yes/No
- Acceptance criteria
- Constraints

This keeps execution bounded and reviewable.

### 3) Risk scan

Run three quick checks before planning:

- Contract-risk scan: what could drift if changed casually
- HOLD scan: what is unknown or ambiguous
- Do-not-ship conditions: what makes this unsafe to deliver

### 4) Plan and approval gate

Build a minimal patch plan with:

- exact files to touch
- exact files to keep untouched
- verification method per acceptance criterion
- commit boundaries

Then stop for approval. Do not execute early.

### 5) Execute narrowly

After approval:

- work one wave at a time (WIP = 1)
- make only planned edits
- avoid "while I'm here" changes
- verify each wave before moving on

If a surprise appears, stop and convert it into a HOLD.

### 6) Verify

Verification is not optional. At minimum:

- file existence and location checks
- content checks against acceptance criteria
- link and reference checks for docs
- `git diff --check`
- scoped grep/scrub checks when wording constraints matter

If verification fails, fix or HOLD. Do not ship ambiguous status.

### 7) Commit and closeout

Each commit must be coherent and standalone:

- stage only intended files
- use explicit, truthful commit messages
- keep blast radius legible

Closeout must report:

- what changed
- acceptance status (PASS/FAIL/HOLD)
- remaining HOLDs
- next actions
- signoff status

## HOLD as a working primitive

A HOLD is not dead time. It is a safety signal that preserves momentum.

Use this format:

```text
HOLD: [one-sentence blocker]
Evidence: [what is known]
What's unknown: [specific missing information]
Impact: [risk if guessed]
Options:
1. [safe path]
2. [alternative path]
3. [fallback path]
Resolution: [what closes this HOLD]
```

Clear the HOLD when evidence arrives, scope narrows, or risk is explicitly accepted by the decision owner.

## Practical execution checklist

Use this list before shipping:

- Scope stayed inside the approved fence
- No forbidden files changed
- No contract drift was introduced silently
- Claims match observable repo behavior
- Wording is public-safe and neutral
- Each commit is standalone and reviewable

## Where to go next

- `QUICKSTART.md` for the fastest path into governed work
- `docs/ABSENCE_PATTERNS.md` for omission-detection logic
- `examples/annotated-session.md` for a concrete HOLD-in-action example
- `skills/` for portable governance behaviors
