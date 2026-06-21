# 003 — Stop logging reset tokens / emails to the server console

**Against** `d878a27`. **Category** Security. **Effort** S. **Risk** LOW.

## Problem
`src/lib/email.ts` logs the full email body (incl. password-reset URL with token) and recipient address to stdout when `RESEND_API_KEY` is unset. It's a deliberate dev fallback, but Railway archives stdout in its dashboard — if the key is ever missing in prod, valid email+token pairs leak (account takeover). Admin-triggered resets already surface the link in the UI, so the console body is not needed there.

## Files
- `src/lib/email.ts` (~:21-26).

## Steps
1. In the no-API-key branch, log only a redacted line: `[email] delivery skipped (RESEND_API_KEY unset) to=<redacted> subject="..."` — never the body/token. Optionally include the full body only when `process.env.NODE_ENV !== "production"`.
2. Keep returning `{ delivered: false, reason }` so the admin UI fallback (which shows the link in-browser) still works.

## Verification
`npm run typecheck/test/build`. Grep confirms no `console.log` of `text`/token remains in `email.ts`.

## Scope
Only the logging branch. Don't change the Resend delivery path or the admin UI link surfacing.
