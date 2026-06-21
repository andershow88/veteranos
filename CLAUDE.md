@AGENTS.md

# Veteranos — agent orientation

Next.js 16 (App Router, RSC, Server Actions) · React 19 · TypeScript · Tailwind v4 · Prisma 6 + PostgreSQL · custom auth · deploy on Railway (Dockerfile). UI is English-only.

## Verify before "done"
`npm run typecheck` · `npm run lint` · `npm test` (vitest) · `npm run build`

## Auth model (non-standard — read before touching auth)
- `src/middleware.ts`: edge JWT **signature** check only (no DB).
- `src/lib/auth.ts`: per-action authorization — `requireUser` / `requireAdmin` (DB-backed). Every mutating server action in `src/server/*` must call one. `requireAdmin` re-checks the DB role so a demoted admin loses access immediately.

## Critical paths / gotchas
- **Waitlist rank scheme**: OUT (decline) ranks are 0-based via `resolveOutRank` (max+1); waitlist ranks are 1-based/contiguous via `renumberWaitlist`. Never use a plain `count` for OUT ranks (collides on gaps). Replacement order: Nth waitlist player ↔ Nth declined abo.
- **Payments**: the state machine + `syncWaitlistPaymentStatuses` (`src/server/match-actions.ts`) — change only with the `*.payment.test.ts` suites.
- **Time zone**: everything is Europe/Berlin via `src/lib/utils.ts` (`berlinDateTimeToUtc` / `utcToBerlinParts`). Never parse a match date/time as server-local (Railway runs UTC).
- **Club theme** colour math is duplicated: the `layout.tsx` FOUC head script (inline string) AND `club-picker.tsx` `applyClubTheme`. Keep them in sync — drift already caused a dark-mode bug.

## Don't
- Don't change password hashing (`bcryptjs`) without a rotation plan.
- Don't touch the invite-consume race (`invite-actions.ts`) without tests.
- Don't run against the Railway **prod** DB; use the test DB.

See `plans/` for the current improvement backlog (`/improve` audit output).
