# 001 — Fix OUT-rank collision in `adminSetSignupAction`

**Against** `d878a27`. **Category** Correctness. **Effort** S. **Risk** MED.

## Problem
`src/server/match-actions.ts` (OUT branch of `adminSetSignupAction`) computes the decline rank as `db.signup.count({ status: "OUT", player.kind: "ABO" })`. The rest of the code uses `resolveOutRank()` which returns `(max OUT rank ?? -1) + 1` — its doc comment explicitly says count is wrong because it collides when ranks have gaps (a player leaving OUT vacates a rank without renumbering). A collision corrupts the decline-order sort and the waitlist payment-status sync.

## Files
- `src/server/match-actions.ts` — `resolveOutRank` (~:29), `adminSetSignupAction` OUT branch (~:464).

## Steps
1. In the OUT branch, replace the `count`-based rank with `resolveOutRank(input.matchId, input.playerId)` (already in this file, handles the "already OUT → keep rank" case too).
2. Remove the now-dead `count` query.

## Verification
- `npm run typecheck`, `npm test`, `npm run build` green.
- Manual reasoning: setting two different ABOs to OUT yields distinct ranks even after one toggles back.

## Scope
Only the OUT branch. Don't touch WAITLIST (`nextWaitlistRank`) or IN branches.
