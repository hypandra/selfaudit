# Self-Audit Code Review

## `src/components/compare-pane.tsx`

- Line ~102-117
  - Category: Bug
  - `promptA` is initialized from `basePrompt` once and never updated when `auditType` changes, while `promptB` is reset on every audit-type switch.
  - Consequence: after changing audit types, "Prompt A — original" can still be the previous audit type's system prompt, so compare mode can run mismatched prompts and produce misleading diffs.

- Line ~148-156
  - Category: UX
  - `handleDiffSummary` leaves the previous `diffSummary` in state when a re-run fails and only records the error string.
  - The UI can continue showing an old summary next to a new failure, which makes it look like the failed re-run succeeded.

## `src/components/audit-results.tsx`

- Line ~272-276
  - Category: UX
  - `handleCopy` awaits `copyMarkdown(...)` without any error handling or fallback messaging.
  - If the Clipboard API is unavailable or denied, the export action fails silently for the user and surfaces only as an unhandled rejection.

- Line ~863-865
  - Category: React
  - The component clears `annotations` by calling `setAnnotations({})` inside an effect whenever `result` changes, which adds a guaranteed extra render and is flagged by the React hooks lint rule.

## `src/components/model-loader.tsx`

- Line ~57-71
  - Category: UX
  - Cache probing and cache removal both await WebLLM/Cache API calls without any `try/catch`, so failures from `isModelCached(...)` or `removeModelFromCache(...)` are unhandled.
  - A cache API failure leaves the cached-model badges stale and gives the user no visible indication of what went wrong.

- Line ~122-156
  - Category: UX
  - The cached-model "remove" control is a `<button>` nested inside the outer model-selection `<button>`.
  - Invalid interactive nesting makes focus and keyboard behavior browser-dependent, and can trigger model selection while the user is trying to remove a cached model.

## `src/lib/audit.ts`

- Line ~127-128, ~160-161, ~230
  - Category: Type
  - AI output is `JSON.parse`d and then cast directly into `AnyAuditResult` / `MetaAuditResult` shapes without any runtime validation after repair.
  - Malformed or partial model output can reach rendering, diffing, and export code as if it were trusted data, causing runtime crashes such as reading `.map`, `.summary`, or nested fields from `undefined`.

## `src/lib/diff.ts`

- Line ~72-79
  - Category: Bug
  - Two findings are treated as `same` whenever their `severity` matches, even if the observation, recommendation, or red-flag presence changed materially.
  - Consequence: compare mode can hide real prompt-induced differences and feed an incomplete diff payload into the model-generated summary.

## `src/lib/engine.ts`

- Line ~111-135
  - Category: Bug
  - `runInference` only emits `{ state: 'ready' }` on the success path, so exceptions from `chat.completions.create(...)` or the streaming loop leave status stuck at `loading` or `generating` unless each caller compensates manually.
  - Consequence: compare-mode and diff-summary failures can leave the shared model UI in a false busy state after the run has already stopped.

- Line ~116-120
  - Category: Type
  - `response_format` is forced through the type system with `as never`, which suppresses compile-time checking against the actual WebLLM request type.
  - If WebLLM's expected schema shape changes, this compiles cleanly and fails only at runtime.

## Additional note

No additional review findings stood out in the remaining `src/**/*.ts` and `src/**/*.tsx` files beyond the issues listed above.
