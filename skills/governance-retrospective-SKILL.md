---
name: governance-retrospective
public_label: Governance Learning Capture
class: retrospective
tier: supplementary
inherits: hold-doctrine
description: "Post-session governance learning capture. Documents what the governance layer caught, what rules earned their keep, and what created friction without value."
---

# Governance Retrospective

## Purpose

This skill captures governance learnings after a session closes.

It is about trust-layer performance, not code style preferences:

- what uncertainty was surfaced
- what bad outcome was prevented
- which rules proved valuable
- which steps created friction without value

Use this to improve future governed sessions without widening scope.

## When to use

Use this skill when a completed session had one or more of these signals:

- meaningful HOLD activity
- contract-adjacent decisions
- near-miss outcomes prevented by governance
- repeated process friction worth correcting

## When not to use

Do not run this for every tiny task.

Skip it when:

- the task was low-stakes and routine
- no meaningful HOLD or governance event occurred
- retrospective capture would add noise instead of signal

## Inputs required

Collect only evidence from the closed session:

- session goal and scope
- raised and cleared HOLDs
- verification outcomes
- closeout notes
- artifacts touched

If evidence is missing, emit a HOLD and leave unknowns explicit.

## What to capture

Capture five outputs in order:

1. HOLDs raised this session
2. What governance caught before ship
3. Rules that earned their keep
4. Friction without value
5. Action recommendation for next sessions

## Output template

Use this exact structure:

```markdown
# Governance Retrospective - [session-id]

## Session
- Goal: [one sentence]
- Scope summary: [short]
- Date: [YYYY-MM-DD]

## HOLDs Raised
- [hold summary] | [raised/cleared/escalated] | [outcome]

## What Governance Caught
- [specific issue prevented]
- [doctrine/rule that prevented it]

## Rules That Earned Their Keep
- [rule] -> [specific prevented outcome]

## Friction Without Value
- [process step or rule]
- [why it slowed work]
- [recommended adjustment]

## Recommendations
- Keep: [rule/process] because [reason]
- Adjust: [rule/process] because [reason]
- Add or remove: [rule/process] because [reason]
```

## Execution method

1. Read the final session artifact and closeout.
2. Separate facts from inference.
3. Record only evidence-backed learnings.
4. Keep language concrete and operational.
5. End with one actionable recommendation set.

## Guardrails

- Optional by design: this is a supplementary pass, not a mandatory gate.
- Do not rewrite historical session facts.
- Do not invent misses or successes.
- Do not turn this into a broad project roadmap.
- Keep recommendations specific enough to test in the next session.

## Closeout line

End with:

`Retrospective status: complete | next session checks: [list]`
