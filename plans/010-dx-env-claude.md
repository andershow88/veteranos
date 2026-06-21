# 010 — DX: `.env.example` guidance + project `CLAUDE.md`

**Against** `d878a27`. **Category** DX/Docs. **Effort** S. **Risk** LOW.

## Problem
- `.env.example` lists keys but lacks generation/usage guidance (e.g. how to make `AUTH_SECRET`, what happens if `RESEND_API_KEY` is unset, `VAPID_*`).
- `CLAUDE.md` is just `@AGENTS.md`; agents lack a single orientation file for the non-standard auth model and critical paths.

## Files
- `.env.example`, `CLAUDE.md` (keep `@AGENTS.md` include, add project guidance).

## Steps
1. Expand `.env.example` with inline comments: `AUTH_SECRET` → `openssl rand -base64 32`; `RESEND_API_KEY` → "blank = console fallback (dev only); set in prod"; `VAPID_*` notes; `SEED_DEMO_PLAYERS`. Add a header "copy to .env.local; never commit .env".
2. Expand `CLAUDE.md`: auth model (edge JWT signature check in `middleware.ts` + DB-backed `requireAdmin/requireUser` in `lib/auth.ts`), critical paths (waitlist rank scheme — OUT ranks 0-based, waitlist 1-based; payment sync), verification commands, "don't change password hashing / invite race logic without tests".

## Verification
Files render; no secrets added.

## Scope
Docs only. Don't add real secret values.
