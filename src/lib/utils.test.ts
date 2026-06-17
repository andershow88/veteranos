import { describe, expect, it } from "vitest";
import { buildPaymentReminderText } from "./utils";

describe("buildPaymentReminderText", () => {
  const date = new Date("2026-07-15T19:30:00Z");

  it("produces the English reminder template with the player's name and the date", () => {
    const text = buildPaymentReminderText("Eduardo", date);
    expect(text).toContain("Hi Eduardo,");
    expect(text).toContain("outstanding payment");
    expect(text).toContain("replacement spot");
    expect(text).toContain("Thank you!");
    // the formatted match date is embedded
    expect(text).toContain("Jul");
    expect(text).toContain("2026");
  });

  it("is entirely English (no German wording)", () => {
    const text = buildPaymentReminderText("Tom", date).toLowerCase();
    for (const german of ["zahlung", "erinnerung", "spieler", "bitte", "danke", "ausstehend"]) {
      expect(text).not.toContain(german);
    }
  });
});
