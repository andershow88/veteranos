# 012 — Direction roadmap (SPIKES / PLAN ONLY)

**Against** `d878a27`. **Category** Direction. **Status** plan only — these are product features for the maintainer to schedule; each needs a design/spike before building.

Grounded in repo evidence; not implemented in this pass.

1. **REST API for mobile** (L). README states `src/server/*` is UI-free for REST reuse; only 3 api routes exist. Spike: wrap read endpoints (matches, match detail, profile) as `src/app/api/*` route handlers returning JSON; define auth (the JWT cookie vs bearer), then mutations. Define an OpenAPI surface.
2. **Participation stats** (M). `Player.lastPlayedAt` is tracked but never surfaced. Spike: appearance/cancellation counts per period; admin `/admin/stats` + a profile section; optionally feed no-show signal into team generation.
3. **Bulk player CSV import** (M). Export exists, import doesn't. Spike: CSV upload → Zod validate → dry-run preview ("5 new, 2 updates") → transactional upsert.
4. **Team-balance analytics over time** (M). `Team.avg*` stored per match, never aggregated. Spike: `/admin/analytics` balance-cost trend + spread per stat.
5. **Player lifecycle/season states** (M). `Player.active` boolean only. Spike: season/status model + bulk transitions; filter match generation by availability.

## Next step
Pick one; run `/improve plan "<feature>"` (or ask) to turn it into a build plan with API/data-model design and open questions.
