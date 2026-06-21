# 009 — Scaling investigations (PLAN ONLY)

**Against** `d878a27`. **Category** Performance. **Effort** M. **Confidence** MED. **Status** investigate — low impact at current scale.

These are real patterns but not worth changing while the league is small. Revisit when player/match counts grow (say >100 players or >100 matches/30d).

1. **Payments query** `getPaymentsForPlayer` (`match-queries.ts:236-284`) scans all matches in the window then iterates signups. Add a WHERE narrowing to matches with outstanding signups for the player, or paginate. Verify with a 1000-row fixture first.
2. **Admin players list** has no server-side pagination (`admin/players/page.tsx`, `players-admin.tsx`). Add cursor pagination at ~50/page when the roster grows.
3. **`renumberWaitlist`** issues N updates in a transaction. Fine for small waitlists; batch via a single `UPDATE…CASE` if it ever gets hot.
4. **Indexes**: consider `@@index([playerId, matchId])` / `([status, playerId])` on `Signup` — but only after confirming with real query plans (don't add speculative indexes).
5. **npm audit**: 2 moderate dev-chain advisories (esbuild/postcss class). `npm audit fix` when convenient; no runtime exposure.

## Verification
Each sub-item: benchmark with a large fixture before/after; no behaviour change.
