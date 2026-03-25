# Example Session Artifact

## Session ID
example-governed-workflow-publication-proof

## State
Closed

## Source
mixed

## Created At
2026-03-24T02:05:00.000Z

## Updated At
2026-03-24T02:46:00.000Z

## Executed At
2026-03-24T02:33:00.000Z

## Closed At
2026-03-24T02:40:00.000Z

## Goal
Demonstrate governed workflow publication proof across skills, Claude Code compatibility, and the standalone extension.

## Truth Sources
- README.md
- docs/specs/PUBLIC_THESIS_OBJECT.md
- proof/PROOF_MAP.md
- proof/CAPTURE_RUNBOOK.md
- extension/package.json
- extension/src/extension.ts

## Contract Risk
true

## Execution Notes
Illustrative publication example showing draft creation, deterministic block enrichment, HOLD handling, and closeout/export shape.

## Verification Summary
Compile/package verification is tracked in `proof/RELEASE_CHECKLIST.md`; this example focuses on artifact shape.

## Risk Notes
Optional GUI screenshots were not included in this example export; public proof stays grounded through docs and package verification.

## Signoff By
Architect

## Signoff Status
signed_off

## Files Touched
- README.md
- docs/specs/PUBLIC_THESIS_OBJECT.md
- proof/PROOF_MAP.md
- proof/CAPTURE_RUNBOOK.md
- extension/package.json

## Contract Risks Detected
- extension/package.json | deployment_config | Extension release metadata changed.

## HOLD History
- raised | 2026-03-24T02:22:00.000Z | Deterministic HOLD block emitted while deciding whether to add optional GUI screenshots.
- cleared | 2026-03-24T02:27:00.000Z | Publication proof lane grounded via docs and package verification; screenshots left as an optional supplement.

## Hook Events Captured
- evt-0001 | pre_tool_use | Draft session auto-created from first PreToolUse event.
- evt-0002 | session_spine | SESSION_SPINE block parsed and artifact enriched.
- evt-0003 | hold_state | HOLD_STATE block parsed (raised).
- evt-0004 | stop | Stop event received; session closed durably.

## Workspace Context
- Name: governed-workflow
- Path: <workspace-root>

## Git Context
- Summary: Git details intentionally omitted in this public example
- Detail: This published example focuses on artifact shape rather than a specific repository state.

## HOLD Status
- Active: false
- Reason: Publication proof lane grounded via docs and package verification; screenshots left as an optional supplement.
- Raised At: 2026-03-24T02:22:00.000Z
- Cleared At: 2026-03-24T02:27:00.000Z
- State When Raised: Reviewed

## Reviewed At
2026-03-24T02:15:00.000Z

## Approved At
2026-03-24T02:18:00.000Z

## Closeout Summary
Publication example finalized with deterministic capture, HOLD tracking, and export artifacts visible.

## Next Action
Review the proof docs and packaged artifact; optionally capture screenshots with `proof/CAPTURE_RUNBOOK.md`.
