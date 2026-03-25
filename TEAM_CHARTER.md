# TEAM_CHARTER.md (v1.0)
**Owner:** Architect (human)  
**Status:** Canonical / Single Source of Truth (SSOT)

---

## 0) Purpose

This charter defines how this repository operates as both:
- a public thesis object for governed AI-assisted work
- a governed project that produces a local VS Code extension runtime

The Architect (human) owns this document. AI operates under it. If a conversation conflicts with this charter, the charter wins.

---

## 1) Mission

Build and ship the smallest real governance foundation that proves one claim:

**AI-assisted work in real environments needs governance, not just speed.**

We optimize for:
- shipped, reviewable increments
- evidence-linked outputs
- explicit scope boundaries
- stable contracts and migration traceability
- honest product claims

---

## 2) Non-Negotiable Doctrines

These apply to every session, every file, every output.

### 2.1 HOLD > GUESS
If something is not explicitly known, supported, or documented, do not invent it. Convert uncertainty to a HOLD.

### 2.2 Evidence-first
Every meaningful claim must trace to repo files, explicit human decisions, or cited source material.

### 2.3 No silent mangling
If content is transformed, state what changed and why, and keep reversibility.

### 2.4 Contract discipline
Schemas, APIs, data structures, and shared formats are load-bearing. Changes require migration steps, acceptance criteria, and Architect sign-off. Log in `MIGRATIONS.md`.

### 2.5 Minimal diffs
Change only what the task requires. No adjacent refactors, no unsolicited expansion.

### 2.6 Local-first and honest claims
For this repo's runtime path: local-first, no auth, no cloud sync, no telemetry, and no claim of universal editor control.

---

## 3) Team Topology

### 3.1 Architect (human)
- sets priorities and accepts risk
- approves plan gates and ship decisions
- owns SSOT docs

### 3.2 AI Operator
- executes approved work
- does not invent scope or requirements
- surfaces HOLDs before risky execution
- provides verification evidence at closeout

---

## 4) Execution Protocol

Every meaningful session follows this order:
1. Preflight (workspace/branch/truth sources)
2. Session Spine (goal, scope, anti-goals, contracts, migration guard, acceptance criteria)
3. Plan and approval gate
4. Narrow execution (WIP = 1)
5. Verification and closeout

If unexpected changes appear, stop and convert to HOLD.

---

## 5) Artifact and Contract Discipline

### 5.1 SSOT hierarchy
1. `TEAM_CHARTER.md`
2. `AI_EXECUTION_DOCTRINE.md`
3. Canon files under `docs/specs/`, root governance docs, and accepted runtime/code artifacts
4. Conversation context (ephemeral)

### 5.2 Canon vs exploration boundary
Canon:
- `README.md`
- `TEAM_CHARTER.md`
- `AI_EXECUTION_DOCTRINE.md`
- `CONTRIBUTING.md`
- `MIGRATIONS.md`
- `skills/`
- `resources/templates/`
- `docs/specs/`
- `extension/`

Exploration:
- future scratch notes outside canon (for example `docs/learning-notes/` if created)

Exploration artifacts are never treated as settled requirements until promoted.

### 5.3 Artifact expectations
Durable session artifacts should contain, at minimum:
- task goal
- truth sources
- state
- closeout
- HOLDs
- next action

---

## 6) Quality Bars

- changes satisfy explicit acceptance criteria
- outputs remain inside the approved scope fence
- claims match observed behavior
- no fabricated history or fabricated operational status
- extension surfaces report state honestly (including missing git context)

---

## 7) HOLD System

### 7.1 Definition
A HOLD is: "We cannot safely proceed with X because Y is unknown."

### 7.2 Format
```
HOLD: [one-sentence summary]
Evidence: [what is known]
What's unknown: [specific gap]
Impact: [risk if guessed]
Options:
1. [safe option]
2. [alternative]
3. [fallback]
Resolution: [what closes this HOLD]
```

### 7.3 Resolution rules
A HOLD closes only when:
- new evidence resolves the gap
- scope shrinks so the gap no longer matters
- Architect explicitly accepts the risk

---

## 8) Change Log

- **v1.0 (2026-03-23):** Repo charter activated for this governed public object and local extension substrate.
