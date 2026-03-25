# Extension (v0.2.0)

Governed Workflow standalone VS Code surface for local-first governed sessions.

## Command

- `Governance: Open Dashboard`

## Runtime behavior

- always-on local hook intake from `.governed/hooks/events.jsonl`
- auto-creates a draft session on first meaningful hook event
- deterministic `SESSION_SPINE` enrichment
- deterministic `HOLD_STATE` capture, persistence, and enforcement
- lifecycle progression with manual fallback controls
- stop/end-driven durable closeout
- file-touch capture and conservative advisory contract-risk hints
- history/reporting across local governed artifacts
- markdown/json export to `.governed/exports/`

## Storage convention

- session artifacts:
  - `.governed/sessions/<timestamp>-<slug>/session.md`
  - `.governed/sessions/<timestamp>-<slug>/session.json`
- hook intake:
  - `.governed/hooks/events.jsonl`
- exports:
  - `.governed/exports/<session-id>.md`
  - `.governed/exports/<session-id>.json`

## Deterministic block contracts

### SESSION_SPINE block

```SESSION_SPINE
{
  "block_type": "SESSION_SPINE",
  "version": "2.0",
  "goal": "...",
  "truth_sources": ["README.md"],
  "contract_risk": false,
  "execution_notes": null,
  "closeout_summary": null,
  "verification_summary": null,
  "risk_notes": null,
  "next_action": null,
  "signoff_by": null,
  "signoff_status": "not_signed_off"
}
```

### HOLD_STATE block

```HOLD_STATE
{
  "block_type": "HOLD_STATE",
  "version": "2.0",
  "hold_active": true,
  "reason": "...",
  "proof_needed": ["..."],
  "options_next_step": ["..."],
  "resolution_event": "raised",
  "resolved_at": null
}
```

## Run

```powershell
npm install
npm run compile
```

Open the `extension/` folder in VS Code and press `F5`.

## Package (local VSIX)

```powershell
npm run package
```

Output artifact:
- `extension/governed-workflow-0.2.0.vsix`

## Scope boundary

- local-first only
- no auth
- no cloud sync
- no telemetry
- no hidden network behavior
- no claim of universal editor control
