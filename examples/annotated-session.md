# Annotated Session: HOLD Prevents Wrong Field Shipment

This example shows a short governed session where omission and uncertainty checks stop a bad shipment.

## Task

Add a CSV export field for service charge in an existing reporting endpoint.

## Approved scope

- update export mapping
- update export docs
- verify contract compatibility

## What could have shipped wrong

A quick implementation could have shipped `service_charge_rate` as a decimal string.

The shared contract actually expects `service_charge_bps` as an integer.

That mismatch would break downstream consumers that parse basis points.

## Session trace (annotated)

### 1) Preflight and truth sources

- truth source identified: export contract doc and current exporter mapping
- scope confirmed: no contract redesign

### 2) HOLD raised before edit

```text
HOLD: Export field unit is not confirmed for the new service charge field.
Evidence: Current contract examples use *_bps integer fields for rate-like values.
What's unknown: Whether this new field follows bps integer or decimal string format.
Impact: Guessing could ship an incompatible field and break ingest.
Options:
1. Verify contract doc and sample payloads.
2. Ask decision owner to confirm unit.
3. Defer field until contract is explicit.
Resolution: Confirm required field name and unit from contract source.
```

### 3) Resolution

Contract evidence confirms:

- required field: `service_charge_bps`
- required type: integer
- decimal string form is not valid for this export

HOLD is cleared with evidence.

### 4) Implementation result

- exporter adds `service_charge_bps` integer
- docs updated with field semantics
- no contract changes required

### 5) What governance prevented

Without HOLD, a plausible but wrong field could have shipped:

- wrong key (`service_charge_rate`)
- wrong unit (decimal vs basis points)
- hidden downstream breakage

With HOLD, uncertainty became explicit, then resolved before merge.

## Takeaway

HOLD did not block progress. It redirected progress from guess-based output to contract-correct output.
