import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guard for the requirement that everything introduced by the subscriber
 * payment feature is in English. Scans the files this feature touches for
 * common German tokens. (Player names in the live DB may contain umlauts, but
 * the static source strings introduced here must not be German.)
 */
const FILES = [
  "src/components/match/replacement-row.tsx",
  "src/lib/payment-rules.ts",
  "src/lib/utils.ts",
];

const GERMAN_TOKENS = [
  "zahlung",
  "erinnerung",
  "bestätigen",
  "bezahlt",
  "ausstehend",
  "empfänger",
  "nachricht",
  "abonnent",
  "abbrechen",
  "quittung",
  "fällig",
  "erhalten",
];

describe("feature source is English only", () => {
  for (const file of FILES) {
    it(`${file} contains no German tokens`, () => {
      const text = readFileSync(join(process.cwd(), file), "utf8").toLowerCase();
      for (const token of GERMAN_TOKENS) {
        expect(text, `unexpected German token "${token}" in ${file}`).not.toContain(token);
      }
    });
  }

  it("the new subscriber menu labels are present in English", () => {
    const ui = readFileSync(
      join(process.cwd(), "src/components/match/replacement-row.tsx"),
      "utf8",
    );
    expect(ui).toContain("Confirm payment received");
    expect(ui).toContain("Send WhatsApp reminder");
    expect(ui).toContain("Payment options");
  });
});
