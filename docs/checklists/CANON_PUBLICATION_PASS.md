# Canon Publication Pass

Use this checklist after any publication-facing naming or residue cleanup pass.

## Identity

- [ ] One public repo identity is visible across README, thesis/spec, indexes, and examples.
- [ ] Legacy or competing identity language is removed or clearly subordinated.

## Command language

- [ ] One public command label is visible in docs and packaging surfaces.
- [ ] Internal command ids remain untouched unless the rename is proven low-blast-radius and verified.
- [ ] Launch/debug labels do not expose stale public wording.

## Package and version truth

- [ ] Package name, display name, version, and VSIX artifact name align.
- [ ] Package metadata and license are public-safe and aligned with repo truth.

## HOLD hygiene

- [ ] Public HOLD text reflects only current pending work.
- [ ] Example artifacts do not leak stale internal branch framing or private workflow residue.

## Suggested verification commands

- Run repo-wide searches for the exact stale identity terms, stale public command wording, and stale HOLD phrases being retired in the current cleanup pass.
- Confirm the current public command label, package version, and VSIX artifact name are the only public-facing survivors.
- Review `git diff --stat` before staging.

## Pass condition

Pass when the repo tells one story, the command language is public-safe, and publication docs do not overclaim unresolved work.
