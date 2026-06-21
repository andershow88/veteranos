# 005 — Rate-limit hardening

**Against** `d878a27`. **Category** Security. **Effort** M. **Risk** MED.

## Problem
`src/lib/rate-limit.ts` `clientIp()` trusts `x-forwarded-for`/`x-real-ip` directly (spoofable if not strictly behind a trusted proxy → per-request IP rotation bypasses login/register/reset limits). Also the limiter is an in-memory `Map` (per-instance; multi-instance/serverless multiplies the effective limit). At Veteranos' scale behind Railway this is low practical risk, but it's worth documenting and tightening.

## Files
- `src/lib/rate-limit.ts`.

## Steps
1. Take the **last** hop of `x-forwarded-for` (closest trusted proxy) rather than the client-controlled first entry, or gate trust behind a `TRUSTED_PROXY` env flag; fall back to a stable per-key value. Document the Railway-proxy assumption in a comment.
2. Add a clear comment that the in-memory store is single-instance only; if the app scales horizontally, move buckets to Redis/Postgres (out of scope here — note in 009).

## Verification
`npm run typecheck/test/build`. Existing rate-limit behaviour (login/register/reset) still functions for normal requests.

## Scope
Don't introduce Redis now. Keep the fixed-window algorithm.
