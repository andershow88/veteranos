# 006 — Replace `include: { player: true }` with explicit `select`

**Against** `d878a27`. **Category** Performance. **Effort** M (reassessed). **Risk** MED. **Status** PLAN ONLY.

> Reassessed during execution: `MatchView`/`composeMatchView` and the team-generator
> are typed against the **full `Player`** and thread it through many consumers
> (MatchCard, team-showcase, signup-manager, payments). Narrowing the query's
> `player` select changes the inferred type and forces a typed refactor across the
> whole view layer — M effort, MED risk — for a small per-row payload saving.
> Not worth it at the current scale; revisit only if payload/memory becomes a
> measured problem. Steps below kept for that future.

## Problem
`buildMatchView`, `listUpcomingMatches`, `getPaymentsForPlayer` (`src/server/match-queries.ts`) and `generateTeamsForMatch` (`src/server/team-generator.ts`) load full `Player` rows (all skills, paypal, phone, notes, …) where only a few fields are consumed — bloating payloads/memory, esp. across N matches.

## Files
- `src/server/match-queries.ts`, `src/server/team-generator.ts`.

## Steps
1. For each query, replace `include: { player: true }` with `select: { player: { select: {…only-used fields…} } }`. Determine the used fields from the consumers (TypeScript will flag any missing field).
   - match views/cards: `id, firstName, lastName, nickname, kind, rank, overall, avatarUrl, paypalName, paypalLink` (+ payment fields already on signup).
   - team-generator: the skills it reads (`overall, defense, offense, speed, stamina, technique, passing, shooting, goalkeeping, position, id, firstName, lastName, kind`).
2. Let `tsc` drive correctness — add any field the build complains about; don't guess-trim.

## Verification
`npm run typecheck` (the real guardrail), `npm test`, `npm run build`. App still renders match/profile/teams.

## Scope
Conservative: include every field a consumer touches. Better to keep a field than break a render. If unsure for a query, leave it as `include` and note it.
