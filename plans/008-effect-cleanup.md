# 008 — Effect cleanup: weather fetch abort + avatar close race

**Against** `d878a27`. **Category** Correctness. **Effort** S. **Risk** LOW.

## Problem
- `src/components/weather-widget.tsx`: the `fetch` in `useEffect` has no abort/cleanup → `setData` can fire after unmount.
- `src/components/ui/avatar-uploader.tsx`: `save()`/`remove()` call `close()` inside the `startTransition` callback before error handling resolves → modal can close on error with no feedback.

## Steps
1. Weather: add an `AbortController`, pass `signal` to `fetch`, `abort()` in cleanup, ignore `AbortError`, and guard `setData` with a mounted check.
2. Avatar: only `close()` on success (after the awaited action resolves without throwing); on error keep the modal open and show the error.

## Verification
`npm run typecheck/test/build`. Manual: weather still loads; avatar save closes on success, stays open + shows error on failure.

## Scope
Minimal; don't restructure the components.
