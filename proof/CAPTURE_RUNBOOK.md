# CAPTURE_RUNBOOK.md

## Purpose

Use this file as an optional screenshot capture guide for Governed Workflow (v0.2.0).
The publication proof lane does not depend on these screenshots; it is already grounded by the proof docs, example artifacts, release notes, and verified package output.

## Output folder

If you want a GUI screenshot supplement, save files to `proof/screenshots/` using these exact filenames:
1. `01-dashboard-open.png`
2. `02-auto-draft-created.png`
3. `03-session-spine-enriched.png`
4. `04-file-touch-contract-risk.png`
5. `05-hold-active.png`
6. `06-hold-cleared-resumed.png`
7. `07-closed-signed-off.png`
8. `08-history-reporting.png`
9. `09-export-artifacts.png`
10. `10-vsix-package-proof.png`

## Exact setup

1. Open `extension/` in VS Code.
2. Press `F5` to launch Extension Development Host.
3. In Extension Development Host, run `Governance: Open Dashboard`.
4. Ensure this repository is the active workspace.
5. Ensure hook events append to `.governed/hooks/events.jsonl`.

## Deterministic snippets

### SESSION_SPINE
```SESSION_SPINE
{
  "block_type": "SESSION_SPINE",
  "version": "2.0",
  "goal": "Capture Governed Workflow publication proof across skills, Claude Code compatibility, and the standalone extension.",
  "truth_sources": ["README.md", "CLAUDE.md", "extension/src/extension.ts"],
  "contract_risk": true,
  "execution_notes": "Applying compatibility pack and release-surface cleanup.",
  "closeout_summary": null,
  "verification_summary": null,
  "risk_notes": null,
  "next_action": "Run compile/package and optionally capture screenshot supplements.",
  "signoff_by": null,
  "signoff_status": "not_signed_off"
}
```

### HOLD_STATE (raise)
```HOLD_STATE
{
  "block_type": "HOLD_STATE",
  "version": "2.0",
  "hold_active": true,
  "reason": "Demonstrate an active HOLD in the dashboard before resuming governed work.",
  "proof_needed": ["Reviewer decision before resuming work."],
  "options_next_step": ["Resolve the hold and resume work", "Keep the session paused for review"],
  "resolution_event": "raised",
  "resolved_at": null
}
```

### HOLD_STATE (clear)
```HOLD_STATE
{
  "block_type": "HOLD_STATE",
  "version": "2.0",
  "hold_active": false,
  "reason": "Review completed; governed work resumed.",
  "proof_needed": [],
  "options_next_step": ["Continue the demo flow"],
  "resolution_event": "cleared",
  "resolved_at": "2026-03-24T00:00:00.000Z"
}
```

## Capture sequence

1. Dashboard open
- Show panel loaded with workspace and git context.
- Save `01-dashboard-open.png`.

2. Auto draft created
- Append first meaningful hook event (`pre_tool_use` with a file target).
- Show active draft created automatically.
- Save `02-auto-draft-created.png`.

3. SESSION_SPINE enriched
- Append deterministic `SESSION_SPINE` block.
- Show goal/truth/contract fields enriched in panel.
- Save `03-session-spine-enriched.png`.

4. File touch + contract risk hints
- Append hook events with contract-facing file paths.
- Show `files_touched` and `contract_risks_detected` state.
- Save `04-file-touch-contract-risk.png`.

5. HOLD active
- Append HOLD raise block.
- Show HOLD active state in dashboard.
- Save `05-hold-active.png`.

6. HOLD cleared + resumed
- Append HOLD clear block.
- Show HOLD cleared state.
- Save `06-hold-cleared-resumed.png`.

7. Closed + signed off
- Move through lifecycle and signoff.
- Show closed signed-off state.
- Save `07-closed-signed-off.png`.

8. History + reporting
- Show history list and aggregate counters populated.
- Save `08-history-reporting.png`.

9. Export artifacts
- Export selected session to markdown and json.
- Show files under `.governed/exports/<session-id>.md` and `.governed/exports/<session-id>.json`.
- Save `09-export-artifacts.png`.

10. VSIX package proof
- From `extension/` run:
  - `npm run compile`
  - `npm run package`
- Show success output and `extension/governed-workflow-0.2.0.vsix`.
- Save `10-vsix-package-proof.png`.

## Completion check

The core publication proof lane is grounded when the proof docs, example artifacts, release notes, and the package artifact `governed-workflow-0.2.0.vsix` are present and verified.
If you capture the optional screenshot supplement, keep the filenames aligned with this guide.