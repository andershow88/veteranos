/**
 * Canonical club-theme colour math. Produces the CSS-variable map applied for a
 * selected club. The FOUC head script in `src/app/layout.tsx` is an inline
 * string (it runs before hydration and cannot import), so it duplicates these
 * formulas BY NECESSITY — keep the two in sync. `club-theme.test.ts` locks the
 * dark-surface invariant that drift previously broke.
 */

export type RGB = { r: number; g: number; b: number };

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function mixColor(c: RGB, white: number): RGB {
  return {
    r: Math.round(c.r + (255 - c.r) * white),
    g: Math.round(c.g + (255 - c.g) * white),
    b: Math.round(c.b + (255 - c.b) * white),
  };
}

function darkenColor(c: RGB, amount: number): RGB {
  return { r: Math.round(c.r * (1 - amount)), g: Math.round(c.g * (1 - amount)), b: Math.round(c.b * (1 - amount)) };
}

function rgbHex(c: RGB): string {
  return `#${c.r.toString(16).padStart(2, "0")}${c.g.toString(16).padStart(2, "0")}${c.b.toString(16).padStart(2, "0")}`;
}

function rgba(c: RGB, a: number): string {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

export function luminance(c: RGB): number {
  const [rs, gs, bs] = [c.r, c.g, c.b].map((ch) => {
    const s = ch / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Primary colour, swapping to secondary (or a dark grey) when the primary is
 * too light to read white-on. */
function effectivePrimary(primaryHex: string, secondaryHex: string): { color: RGB; hex: string } {
  const p = hexToRgb(primaryHex);
  if (luminance(p) > 0.7) {
    const s = hexToRgb(secondaryHex);
    if (luminance(s) < 0.7) return { color: s, hex: secondaryHex };
    return { color: { r: 55, g: 55, b: 55 }, hex: "#373737" };
  }
  return { color: p, hex: primaryHex };
}

/** All club CSS variables this module manages — used to clear a theme. */
export const CLUB_VARS = [
  "--p50", "--p100", "--p200", "--p300", "--p400", "--p500", "--p600", "--p700", "--p800", "--p900",
  "--accent", "--accent-2", "--body-gradient-a", "--body-gradient-b",
  "--surface", "--surface-2", "--border", "--glass-from", "--glass-to", "--stripe-a", "--stripe-b",
  "--club-primary", "--club-primary-raw", "--club-secondary", "--club-tertiary",
  "--selection-bg", "--ring-glow", "--border-strong", "--glass-border", "--btn-primary-text",
] as const;

/** Compute the full CSS-variable map for a club in the given theme. Pure. */
export function computeClubVars(
  primaryHex: string,
  secondaryHex: string,
  tertiaryHex: string | null,
  isDark: boolean,
): Record<string, string> {
  const { color: primary, hex } = effectivePrimary(primaryHex, secondaryHex);
  const lum = luminance(primary);
  const v: Record<string, string> = {};

  if (isDark) {
    v["--p50"] = rgbHex(mixColor(primary, 0.95));
    v["--p100"] = rgbHex(mixColor(primary, 0.88));
    v["--p200"] = rgbHex(mixColor(primary, 0.75));
    v["--p300"] = rgbHex(mixColor(primary, 0.55));
    v["--p400"] = rgbHex(mixColor(primary, 0.35));
    v["--p500"] = hex;
    v["--p600"] = rgbHex(darkenColor(primary, 0.2));
    v["--p700"] = rgbHex(darkenColor(primary, 0.45));
    v["--p800"] = rgbHex(darkenColor(primary, 0.6));
    v["--p900"] = rgbHex(darkenColor(primary, 0.75));
    v["--accent"] = rgbHex(mixColor(primary, 0.55));
    v["--accent-2"] = rgbHex(mixColor(primary, 0.35));
    v["--body-gradient-a"] = rgba(primary, 0.1);
    v["--body-gradient-b"] = rgba(primary, 0.12);
    // Dark surfaces must stay dark (white text sits on them).
    v["--surface"] = rgbHex(darkenColor(primary, 0.82));
    v["--surface-2"] = rgbHex(darkenColor(primary, 0.72));
    v["--border"] = rgbHex(darkenColor(primary, 0.5));
    v["--glass-from"] = rgba(darkenColor(primary, 0.7), 0.6);
    v["--glass-to"] = rgba(darkenColor(primary, 0.8), 0.7);
    v["--stripe-a"] = rgba(primary, 0.03);
    v["--stripe-b"] = rgba(primary, 0.06);
  } else {
    v["--p50"] = rgbHex(darkenColor(primary, 0.65));
    v["--p100"] = rgbHex(darkenColor(primary, 0.45));
    v["--p200"] = rgbHex(darkenColor(primary, 0.25));
    v["--p300"] = hex;
    v["--p400"] = hex;
    v["--p500"] = hex;
    v["--p600"] = rgbHex(mixColor(primary, 0.25));
    v["--p700"] = rgbHex(mixColor(primary, 0.82));
    v["--p800"] = rgbHex(mixColor(primary, 0.88));
    v["--p900"] = rgbHex(mixColor(primary, 0.93));
    v["--accent"] = rgbHex(darkenColor(primary, 0.1));
    v["--accent-2"] = rgbHex(darkenColor(primary, 0.25));
    v["--body-gradient-a"] = rgba(primary, 0.1);
    v["--body-gradient-b"] = rgba(primary, 0.07);
    v["--surface"] = rgbHex(mixColor(primary, 0.85));
    v["--surface-2"] = rgbHex(mixColor(primary, 0.78));
    v["--border"] = rgbHex(mixColor(primary, 0.75));
    v["--glass-from"] = rgba(mixColor(primary, 0.92), 0.82);
    v["--glass-to"] = rgba(mixColor(primary, 0.95), 0.9);
    v["--stripe-a"] = rgba(primary, 0.03);
    v["--stripe-b"] = rgba(primary, 0.05);
  }

  v["--club-primary"] = hex;
  v["--club-primary-raw"] = `${primary.r},${primary.g},${primary.b}`;
  v["--club-secondary"] = secondaryHex;
  v["--selection-bg"] = hex;
  v["--ring-glow"] = rgba(primary, 0.4);
  v["--border-strong"] = rgbHex(isDark ? mixColor(primary, 0.35) : darkenColor(primary, 0.15));
  v["--glass-border"] = rgba(primary, 0.35);
  v["--btn-primary-text"] = lum > 0.4 ? "#0a0a0a" : "#ffffff";
  if (tertiaryHex) v["--club-tertiary"] = tertiaryHex;

  return v;
}
