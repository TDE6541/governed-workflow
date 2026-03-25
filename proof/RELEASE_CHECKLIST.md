# Release Checklist

Use this checklist for the v0.2.0 publication lane.

- [x] Root README presents one public identity.
- [x] Repo navigation spine exists (`REPO_INDEX.md`, `docs/INDEX.md`, `docs/indexes/`).
- [x] Public thesis and claims boundary are aligned.
- [x] MIT license is present at repo root and in `extension/package.json`.
- [x] Package metadata points to the public repository, README, and issue tracker.
- [x] Proof docs exist: `PROOF_MAP.md`, `CAPTURE_RUNBOOK.md`, `RELEASE_CHECKLIST.md`.
- [x] Versioned release notes exist at `../docs/RELEASE_NOTES_0.2.0.md`.
- [x] Example session artifacts are publication-safe.
- [x] Compile/package verification passes for the local VSIX artifact.
- [x] Publication lane is ready without screenshot supplements.

## Expected package commands

From `../extension/`:

```powershell
npm run compile
npm run package
```

Expected artifact:
- `../extension/governed-workflow-0.2.0.vsix`

## Optional proof supplement

GUI screenshots can be added later as a demo/presentation supplement.
If they are captured, keep them aligned with `CAPTURE_RUNBOOK.md`, but they are not a release gate.
