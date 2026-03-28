# ABSENCE_PATTERNS.md

## Hold as an information primitive

In governed AI-assisted work, the biggest failures are often absence failures:

- required fields not provided
- required artifacts not produced
- missing evidence behind a confident claim
- omitted migration handling for a contract change

A HOLD is the explicit representation of that absence.

Instead of hiding missing information inside fluent prose, we model it as state.

## A typed model for uncertainty

A practical model is:

```text
Known<T>
Unknown<reason, proof_needed>
NotApplicable
```

HOLD corresponds to `Unknown<...>`.

This is useful because unknown data is now explicit and machine-checkable instead of silently coerced into a guessed value.

## Option-type analogy

Most engineers already reason about optional values.

- `Some(value)` means present and usable
- `None` means absent

HOLD adds a governed layer on top of plain absence:

- what is absent
- why it is absent
- what evidence resolves it
- what risk appears if we proceed anyway

That turns passive absence into active decision support.

## Null safety analogy

Null safety prevents accidental dereference of missing values.

HOLD serves a similar role for delivery decisions:

- do not dereference uncertainty into a committed claim
- do not ship from unresolved unknowns when the unknown is load-bearing
- force an explicit handling path: resolve, reduce scope, or accept risk

Without this gate, uncertainty is treated like a valid value and leaks into shipped output.

## Falsification discipline

A useful HOLD is falsifiable.

It should identify:

- current evidence
- missing evidence
- concrete resolution event

This creates a testable closure condition.

A HOLD is cleared by evidence, scope reduction, or explicit risk acceptance by the decision owner.

## Omission detection pattern

Absence audits become straightforward with HOLD state:

1. Enumerate expected outputs from approved scope.
2. Compare against observed outputs.
3. For each missing load-bearing output, raise HOLD.
4. Record impact and closure path.
5. Block ship when unresolved high-impact omissions remain.

This pattern catches under-delivery that passes superficial review.

## Contract safety pattern

For schemas, APIs, and shared formats:

- missing migration notes are an omission
- missing downstream compatibility evidence is an omission
- missing sign-off on structural changes is an omission

Treat these as HOLD candidates, not documentation polish tasks.

## Why this matters operationally

HOLD does not slow work by default.

It reduces rework by preventing guessed assumptions from becoming merged artifacts.

The cost is front-loaded clarity. The benefit is fewer rollback cycles.

## Minimal implementation shape

At minimum, each HOLD should carry:

- summary of the unknown
- known evidence
- impact if guessed
- closure criteria

This is enough to make absence visible to both humans and tooling.

## Failure modes this pattern prevents

- confident but unverified output
- partial deliverables presented as complete
- silent contract drift
- missing acceptance evidence at closeout

## Boundary

This pattern is governance methodology.

It does not claim runtime interception of all edits, cloud enforcement, or hidden policy infrastructure.

It defines how teams reason about missing information before ship.
