---
name: Generated client DOM iterable support
description: The generated React API client uses Headers.entries and needs DOM iterable typings.
---

The shared generated client requires `dom.iterable` in its TypeScript `lib` list because Orval emits code that calls `Headers.entries()`.

**Why:** API codegen can succeed while the workspace typecheck fails if the client package only includes `dom` and `es2022`.

**How to apply:** Keep `dom.iterable` enabled in `lib/api-client-react/tsconfig.json` when regenerating the client.