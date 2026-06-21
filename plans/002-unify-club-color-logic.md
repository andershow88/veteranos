# 002 — Single source of truth for club colour math

**Against** `d878a27`. **Category** Tech debt. **Effort** M. **Risk** MED.

## Problem
The club-theme palette math exists twice: the FOUC head script (string) in `src/app/layout.tsx` and the TS `applyClubTheme` in `src/components/club-picker.tsx`. They already drifted once and produced the light-grey dark-mode surfaces bug. Any future change must touch both or they diverge again.

## Constraint
The head script must stay an inline string that runs before hydration (no imports). So we can't fully share a module with it. Strategy: extract the **pure colour helpers + the palette-rule list** into one TS module (`src/lib/club-theme.ts`) used by `applyClubTheme`, and have the head script call the SAME rule list by serialising it — OR, pragmatically, keep both but add a single shared `clubThemeVars(primary, secondary, tertiary, dark)` function used by the client, plus a test that asserts the head-script output equals the client output for a sample club so drift is caught.

## Files
- `src/app/layout.tsx` (head script), `src/components/club-picker.tsx` (`applyClubTheme` + helpers), new `src/lib/club-theme.ts`, new test.

## Steps
1. Create `src/lib/club-theme.ts` exporting `computeClubVars(primaryHex, secondaryHex, tertiaryHex|null, isDark): Record<string,string>` — the canonical mapping (mix/darken/luminance + the dark/light branches).
2. Refactor `applyClubTheme` to call it and apply the returned vars.
3. Add a vitest that asserts `computeClubVars` for a sample club (e.g. Grêmio `#0d47a1`, dark) yields dark `--surface` (channel ≤ ~46) and matches the head-script formulas — locking the contract.
4. (Optional follow-up) Generate the head-script body from the same constants.

## Verification
`npm run typecheck/test/build`; headless check that dark club surfaces stay dark.

## Scope
Don't change the *values* (no visual regression) — pure refactor. Keep the head script behaviour identical.
