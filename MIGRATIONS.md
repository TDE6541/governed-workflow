# MIGRATIONS.md
**Status:** Active - update when a shared schema, API, export/import format, or data contract changes.

---

## Purpose

This log tracks contract changes that can affect downstream consumers.

Do not fabricate historical entries.

---

## Log

| Date | Change | Migration Path | Sign-off |
|------|--------|----------------|----------|
| 2026-03-23 | Governed extension v2 contract upgrade: added hook-aware/session-history fields (`source`, `verification_summary`, `risk_notes`, `signoff_by`, `signoff_status`, `files_touched`, `contract_risks_detected`, `hold_history`, `hook_events_captured`) and deterministic skill emission contracts for `SESSION_SPINE` + `HOLD_STATE`. | v0.1 artifacts remain readable. Runtime now normalizes legacy artifacts on load and rewrites in v2-compatible shape on update/transition while preserving legacy compatibility fields (`closeout`, `signoff`, `holds`, `summary/detail`). | Included in the v0.2.0 public release. |
| 2026-03-23 | Extension session artifact contract extended for lifecycle gate v0 (`Draft -> Reviewed -> Approved`) with explicit `hold` object, `reviewed_at`, and `approved_at`; active session update-in-place introduced. | Existing draft artifacts remain readable; on first update/transition they are rewritten in place to the extended JSON/Markdown shape. Compatibility `holds` is still written as a derived field for continuity. | Included in the v0.2.0 public release. |
| 2026-03-23 | Extension session artifact contract extended for execution/closeout v0 with `Executed` and `Closed` lifecycle states, `executed_at`/`closed_at`, `execution_notes`, structured `closeout`, and structured `signoff`; panel actions now include `Mark Executed`, `Close Session`, and `Sign Off`. | Existing prior artifacts remain readable. On first update/transition they are rewritten in place with defaults (`executed_at`/`closed_at` null, structured `closeout`, structured `signoff`). Legacy string `closeout` is migrated into `closeout.summary`; `next_action` is preserved. | Included in the v0.2.0 public release. |

---

## Entry requirements

For each change include:
- what changed
- why it changed
- compatibility/migration handling
- acceptance criteria evidence
- sign-off reference
