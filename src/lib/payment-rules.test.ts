import { describe, expect, it } from "vitest";
import {
  isOutstanding,
  reminderStatusLabel,
  subscriberConfirmError,
  subscriberReminderError,
  type PaymentActorCtx,
} from "./payment-rules";

const ABO = "abo-1";
const WL = "wl-1";

function ctx(paymentStatus: PaymentActorCtx["paymentStatus"]): PaymentActorCtx {
  return { aboPlayerId: ABO, waitlistPlayerId: WL, paymentStatus };
}

describe("isOutstanding", () => {
  it("treats PENDING and CLAIMED as outstanding", () => {
    expect(isOutstanding("PENDING")).toBe(true);
    expect(isOutstanding("CLAIMED")).toBe(true);
  });
  it("treats NONE and PAID as not outstanding", () => {
    expect(isOutstanding("NONE")).toBe(false);
    expect(isOutstanding("PAID")).toBe(false);
  });
});

describe("subscriberConfirmError (direct confirm authorization)", () => {
  it("allows the subscription player while pending", () => {
    expect(subscriberConfirmError(ABO, ctx("PENDING"))).toBeNull();
  });
  it("allows the subscription player even after the replacement claimed", () => {
    expect(subscriberConfirmError(ABO, ctx("CLAIMED"))).toBeNull();
  });
  it("rejects the replacement player", () => {
    expect(subscriberConfirmError(WL, ctx("PENDING"))).toMatch(/only the subscription player/i);
  });
  it("rejects an unrelated player", () => {
    expect(subscriberConfirmError("stranger", ctx("PENDING"))).toMatch(
      /only the subscription player/i,
    );
  });
  it("rejects confirming an already-completed payment", () => {
    expect(subscriberConfirmError(ABO, ctx("PAID"))).toMatch(/already completed/i);
  });
  it("rejects confirming when there is nothing to pay (NONE)", () => {
    expect(subscriberConfirmError(ABO, ctx("NONE"))).toMatch(/cannot be confirmed/i);
  });
});

describe("subscriberReminderError (reminder authorization)", () => {
  it("allows the subscription player while pending", () => {
    expect(subscriberReminderError(ABO, ctx("PENDING"))).toBeNull();
    expect(subscriberReminderError(ABO, ctx("CLAIMED"))).toBeNull();
  });
  it("rejects the replacement player", () => {
    expect(subscriberReminderError(WL, ctx("PENDING"))).toMatch(/only the subscription player/i);
  });
  it("rejects an unrelated player", () => {
    expect(subscriberReminderError("stranger", ctx("PENDING"))).toMatch(
      /only the subscription player/i,
    );
  });
  it("rejects reminding on a completed payment", () => {
    expect(subscriberReminderError(ABO, ctx("PAID"))).toMatch(/already completed/i);
  });
  it("rejects reminding when there is no outstanding payment (NONE)", () => {
    expect(subscriberReminderError(ABO, ctx("NONE"))).toMatch(/no outstanding payment/i);
  });
});

describe("reminderStatusLabel", () => {
  it("returns null when no reminder was opened", () => {
    expect(reminderStatusLabel(0)).toBeNull();
  });
  it("counts each opened reminder, and never says sent/delivered", () => {
    expect(reminderStatusLabel(1)).toBe("Reminder 1 opened");
    expect(reminderStatusLabel(2)).toBe("Reminder 2 opened");
    expect(reminderStatusLabel(3)).not.toMatch(/sent|delivered/i);
  });
});
