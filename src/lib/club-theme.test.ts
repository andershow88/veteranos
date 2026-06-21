import { describe, expect, it } from "vitest";
import { computeClubVars, hexToRgb, luminance } from "@/lib/club-theme";
import { CLUBS } from "@/lib/clubs";

const lumOf = (hex: string) => luminance(hexToRgb(hex));

describe("computeClubVars", () => {
  it("dark mode: Grêmio surfaces are dark (regression for the light-grey bug)", () => {
    const v = computeClubVars("#0d47a1", "#1a1a1a", "#ffffff", true);
    expect(v["--surface"]).toBe("#020d1d");
    expect(lumOf(v["--surface"])).toBeLessThan(0.05);
  });

  it("dark mode: EVERY club yields dark surfaces (channels stay low)", () => {
    for (const c of CLUBS) {
      if (!c.primaryColor || c.slug === "none") continue;
      const v = computeClubVars(c.primaryColor, c.secondaryColor, c.tertiaryColor ?? null, true);
      expect(lumOf(v["--surface"]), `${c.name} --surface=${v["--surface"]}`).toBeLessThan(0.06);
      expect(lumOf(v["--surface-2"]), `${c.name} --surface-2=${v["--surface-2"]}`).toBeLessThan(0.1);
    }
  });

  it("light mode: surface is a light tint", () => {
    const v = computeClubVars("#0d47a1", "#1a1a1a", "#ffffff", false);
    expect(lumOf(v["--surface"])).toBeGreaterThan(0.6);
  });

  it("swaps a too-light primary to the secondary for readability", () => {
    const v = computeClubVars("#ffffff", "#1a1a1a", null, true);
    expect(v["--club-primary"]).toBe("#1a1a1a");
  });

  it("includes --club-tertiary only when a tertiary colour is given", () => {
    expect(computeClubVars("#0d47a1", "#1a1a1a", "#ffffff", true)["--club-tertiary"]).toBe("#ffffff");
    expect("--club-tertiary" in computeClubVars("#0d47a1", "#1a1a1a", null, true)).toBe(false);
  });
});
