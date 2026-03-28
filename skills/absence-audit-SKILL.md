---
name: absence-audit
public_label: Expected Output Omission Audit
class: verification
tier: supplementary
inherits: hold-doctrine
description: "Expected-output omission verification. Detects missing required artifacts, states what should have been present, and explains why the omission matters before ship."
---

# Absence Audit

## Purpose

This skill verifies expected outputs by checking what is missing, not only what exists.

Most review passes catch wrong content. This pass catches absent content that should have been present.

Use it to prevent quiet under-delivery.

## When to use

Use this skill when work has explicit expected outputs, such as:

- sprint deliverables
- required docs in a publication lane
- acceptance-criteria artifacts
- contract-adjacent outputs

## When not to use

Do not run this when outputs are intentionally open-ended and no expected artifact list exists.

If expected outputs are unclear, emit a HOLD and define them first.

## Core audit model

For each expected output, answer three questions:

1. What expected thing is missing?
2. What should have been present?
3. Why does the omission matter?

If any answer is unknown, keep it explicit and unresolved.

## Inputs required

- scope fence for the session
- expected artifact list
- acceptance criteria
- actual produced artifacts
- verification evidence

## Audit procedure

1. Build an expected-output list from approved scope.
2. Build an observed-output list from repo state and staged changes.
3. Compare expected vs observed.
4. Mark each expected item as `present`, `partial`, or `missing`.
5. For every `partial` or `missing` item, record impact and closure path.

## Output template

```markdown
# Absence Audit - [session-id]

## Expected vs Observed
| Expected Item | Observed State | Should Have Been Present | Why Omission Matters | Action |
|---|---|---|---|---|
| [artifact] | present/partial/missing | [required content/state] | [impact] | [fix/hold] |

## Missing Items Summary
- [item] -> [impact] -> [required closure]

## HOLDs Raised
- [HOLD summary] | [proof needed] | [resolution path]

## Ship Decision
- PASS: no missing load-bearing outputs
- HOLD: one or more missing load-bearing outputs remain
```

## Severity guidance

Treat omissions by impact:

- High: missing load-bearing artifact blocks ship
- Medium: partial artifact requires fix before merge
- Low: non-blocking gap can be queued with explicit follow-up

Default to HOLD for high-impact omissions.

## Guardrails

- Do not invent expected outputs that were never approved.
- Do not downgrade missing required outputs to optional without approval.
- Keep findings evidence-backed and file-specific.
- Use this as a pre-ship safety check, not as a rewrite pass.

## Closeout line

End with:

`Absence audit status: PASS/HOLD | unresolved omissions: [count]`
