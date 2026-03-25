# Governed Workflow

MIT-licensed, local-first governance toolkit for AI-assisted coding.

This repo is one public proof object with three working surfaces:
- portable governance skills in `skills/`
- Claude Code compatibility at repo root via `CLAUDE.md` + `.claude/`
- a standalone VS Code extension in `extension/`

## Why this exists

This repo exists to make one claim inspectable:

**AI-assisted work in real environments needs governance, not just speed.**

The goal is not abstract doctrine. The goal is a real, runnable, reviewable toolkit that shows what governed AI-assisted work looks like in practice.

## What is real today

- portable `SKILL.md` governance artifacts in `skills/`
- committed Claude Code hook compatibility via `CLAUDE.md`, `.claude/settings.json`, and `.claude/hooks/emit-governed-event.mjs`
- a local VS Code dashboard surface opened by `Governance: Open Dashboard`
- deterministic `SESSION_SPINE` / `HOLD_STATE` handling and local markdown/json exports
- a concrete proof lane in `proof/` with example session artifacts in `examples/`

## What this repo does not do

- cloud sync
- auth
- telemetry or analytics
- hidden network behavior
- universal interception of all editor or AI writes
- broad provider expansion beyond the local Claude Code compatibility bridge

## Start here

For the repo map, start with `REPO_INDEX.md` and `docs/INDEX.md`.

### Try it in Claude Code

1. Open this repository as the project workspace in Claude Code.
2. Confirm `.claude/settings.json` is present.
3. Read `CLAUDE.md`.
4. Run a session normally; local hook receipts append to `.governed/hooks/events.jsonl`.

### Use the skills directly

Start with:
- `skills/hold-doctrine-SKILL.md`
- `skills/fire-team-session-SKILL.md`
- `skills/governed-repo-init-SKILL.md`

### Run the VS Code extension

From repo root:

```powershell
cd extension
npm install
npm run compile
```

Then open the `extension/` folder in VS Code, press `F5`, and run `Governance: Open Dashboard`.

### Inspect proof

Start with:
- `proof/PROOF_MAP.md`
- `proof/RELEASE_CHECKLIST.md`
- `proof/CAPTURE_RUNBOOK.md`
- `docs/RELEASE_NOTES_0.2.0.md`
- `examples/session.md`
- `examples/session.json`

### Inspect thesis and runtime contract

Start with:
- `docs/specs/PUBLIC_THESIS_OBJECT.md`
- `extension/README.md`
- `TEAM_CHARTER.md`
- `AI_EXECUTION_DOCTRINE.md`

## Entry points

- Claude Code user: `CLAUDE.md` -> `.claude/settings.json` -> `.claude/hooks/emit-governed-event.mjs`
- Public reviewer: `docs/specs/PUBLIC_THESIS_OBJECT.md` -> `proof/CAPTURE_RUNBOOK.md` -> `examples/session.md`
- General builder: `skills/governed-repo-init-SKILL.md` -> `resources/WHY_THIS_KIT.md` -> `extension/README.md`

## Package and local artifact

From `extension/`:

```powershell
npm run package
```

Expected local artifact:
- `extension/governed-workflow-0.2.0.vsix`

## Publication status

The publication lane is grounded by the public docs, example artifacts, and verified package output.

Optional proof supplement:
- GUI screenshot capture guidance in `proof/CAPTURE_RUNBOOK.md`
