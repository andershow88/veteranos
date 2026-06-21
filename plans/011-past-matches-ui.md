# 011 — Past-matches page (wire up `listPastMatches()`)

**Against** `d878a27`. **Category** Direction (cheap win). **Effort** S. **Risk** LOW.

## Problem
`listPastMatches()` is fully implemented in `src/server/match-queries.ts` but never called — there's no UI to browse finished matches.

## Files
- New `src/app/matches/past/page.tsx` (server component, `force-dynamic`). Reuse `MatchCard`. Link from the home "More upcoming"/nav.
- New `src/app/matches/past/loading.tsx` skeleton (match the pattern in `app/loading.tsx`).

## Steps
1. Create `/matches/past` page: `await listPastMatches()`, render with `MatchCard` (same grid as home "More upcoming"), `currentPlayer` from `getCurrentUser`, `EmptyState` when none.
2. Add a discreet link to it (e.g. from the home page footer of the matches section, or a small "Past matches" link). Keep it simple.
3. Add `loading.tsx` skeleton.

## Verification
`npm run typecheck/lint/build`. Page lists past matches read-only; `MatchCard` already hides controls on past matches.

## Scope
Read-only browse. No new mutations. Don't change `MatchCard`.
