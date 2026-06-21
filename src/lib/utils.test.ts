import { describe, expect, it } from "vitest";
import {
  buildPaymentReminderText,
  berlinDateTimeToUtc,
  utcToBerlinParts,
  formatMatchDate,
} from "./utils";

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

describe("German time zone handling (Europe/Berlin)", () => {
  it("parses summer (CEST, UTC+2) wall-clock to the correct UTC instant", () => {
    // 10:15 in Berlin on 2026-06-21 is 08:15 UTC — this is the reported bug.
    expect(berlinDateTimeToUtc("2026-06-21", "10:15").toISOString()).toBe(
      "2026-06-21T08:15:00.000Z",
    );
  });

  it("parses winter (CET, UTC+1) wall-clock to the correct UTC instant", () => {
    expect(berlinDateTimeToUtc("2026-01-15", "10:15").toISOString()).toBe(
      "2026-01-15T09:15:00.000Z",
    );
  });

  it("splits a stored UTC instant back into German wall-clock parts", () => {
    expect(utcToBerlinParts(new Date("2026-06-21T08:15:00Z"))).toEqual({
      date: "2026-06-21",
      time: "10:15",
    });
  });

  it("round-trips wall-clock -> UTC -> wall-clock", () => {
    for (const [d, t] of [
      ["2026-06-21", "10:15"],
      ["2026-01-15", "20:00"],
      ["2026-12-31", "23:30"],
    ] as const) {
      expect(utcToBerlinParts(berlinDateTimeToUtc(d, t))).toEqual({ date: d, time: t });
    }
  });

  it("formatMatchDate renders in German time, not the server's UTC", () => {
    const label = formatMatchDate(new Date("2026-06-21T08:15:00Z"));
    expect(label).toContain("10:15"); // Berlin
    expect(label).not.toContain("08:15"); // not UTC
  });
});
