# 007 — Remove personal email from VAPID fallback

**Against** `d878a27`. **Category** Security/PII. **Effort** S. **Risk** LOW.

## Problem
`src/lib/push.ts` hardcodes a personal Gmail as the `VAPID_EMAIL` fallback. PII in source. (The `VAPID_PUBLIC` key next to it is fine — VAPID public keys are meant to be public.)

## Files
- `src/lib/push.ts` (~:6).

## Steps
1. Change the fallback to a neutral value, e.g. `process.env.VAPID_EMAIL ?? "mailto:admin@veteranos.app"`.
2. (Owner action, outside code) Set `VAPID_EMAIL` in Railway env to the real contact address.

## Verification
`npm run typecheck/build`; grep confirms no personal email remains in source.

## Scope
Only the fallback string. Don't touch the public/private key handling.
