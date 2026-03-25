# Claude Compatibility Index

This index maps the Claude Code compatibility layer that lives at repo root.

## Start files

- `../../CLAUDE.md` for the repo-local operating posture
- `../../.claude/settings.json` for hook registration
- `../../.claude/hooks/emit-governed-event.mjs` for local event emission and transcript parsing

## Event path

- Hooks emit `SessionStart`, `PreToolUse`, `PostToolUse`, `Stop`, and `SessionEnd`
- Events append to `.governed/hooks/events.jsonl`
- On `Stop`, fenced `SESSION_SPINE` and `HOLD_STATE` blocks are extracted and normalized for the extension intake path

## Use this index when you need to change

- Claude Code setup instructions
- hook registration behavior
- local event normalization
- transcript parsing behavior
- compatibility-layer claims boundary