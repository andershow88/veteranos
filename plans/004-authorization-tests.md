# 004 — Authorization tests for server actions

**Against** `d878a27`. **Category** Tests. **Effort** L. **Risk** HIGH (untested authz).

## Problem
Critical authorization paths have no automated tests: `auth-actions` (login/register), `admin-actions` (player/match CRUD, team gen), `role-actions` (promote/demote), `invite-actions` (consume race), `avatar-actions` (owner/admin check). A regression that drops a `requireAdmin()`/ownership check would reach prod undetected.

## Files
- New tests under `src/server/*.test.ts`. Mock `@/lib/db`, `@/lib/auth` (so `requireAdmin`/`requireUser` are observable), `next/cache`, `server-only`.

## Steps (incremental — this plan is large; do highest-value first)
1. Core suite now: assert each mutating admin/role action calls `requireAdmin` (and rejects when it throws); each user action calls `requireUser`; avatar actions enforce owner-or-admin. Pattern: mock `requireAdmin` to throw and assert the action rejects and writes nothing.
2. Later: invite `consumeInvite` race (atomic `$executeRaw`), rate-limit edge cases, role last-admin/self-demotion guards.

## Verification
`npm test` green; new tests fail if a `requireAdmin`/ownership guard is removed.

## Status
PARTIAL — core authz suite added; full ~100-150-test coverage tracked here as follow-up.
