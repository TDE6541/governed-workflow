# MIGRATIONS.md
**Status:** Active — updated whenever a schema, API, or data contract changes.

---

## Purpose

This file logs every change to a shared contract — schemas, APIs, export/import formats, data structures, or any interface where one component depends on the shape of another's output.

If it changed and something else depends on it, it gets logged here.

---

## Log

| Date | Change | Migration Path | Sign-off |
|------|--------|---------------|----------|
| | | | |

---

## How to use this

When making an entry:
- **Date:** When the change was made
- **Change:** What changed — be specific (field renamed, column added, endpoint modified, format altered)
- **Migration Path:** How existing data/consumers are handled — backward compatible? Backfill needed? Breaking change?
- **Sign-off:** Architect approval (initials, comment reference, or "approved in [session/issue]")
