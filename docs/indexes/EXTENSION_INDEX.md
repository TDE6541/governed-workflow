# Extension Index

This index maps the standalone VS Code extension surface in `extension/`.

## Start files

- `../../extension/package.json` for package metadata, command label, scripts, and VSIX output name
- `../../extension/README.md` for runtime and packaging summary
- `../../extension/.vscode/launch.json` for the local F5 launch profile
- `../../extension/tsconfig.json` for compile setup

## Runtime flow

- `../../extension/src/extension.ts` for activation, command registration, lifecycle actions, export, and hook replay
- `../../extension/src/hookEvents.ts` for `SESSION_SPINE` / `HOLD_STATE` parsing and application
- `../../extension/src/artifactStore.ts` for artifact shape, markdown/json rendering, history, and persistence
- `../../extension/src/panelViews.ts` for panel view-model shaping
- `../../extension/src/panelHtml.ts` for the dashboard UI shell
- `../../extension/src/types.ts` for shared types and artifact fields

## Use this index when you need to change

- command/package metadata
- session lifecycle behavior
- hold behavior
- history/reporting
- markdown/json export
- dashboard UI or rendering