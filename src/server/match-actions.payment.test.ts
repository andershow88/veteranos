import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock everything the actions touch except the real payment-rules logic.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/push", () => ({ sendPushToAll: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => {}),
  requireAdmin: vi.fn(async () => {}),
  getCurrentUser: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    signup: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $executeRaw: vi.fn(),
  },
}));

import {
  claimPaymentAction,
  confirmPaymentReceivedAction,
  remindPaymentAction,
} from "@/server/match-actions";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const ABO = "abo-player-1";
const WL = "wl-player-1";
const SIGNUP = "signup-1";
const MATCH = "match-1";

type Status = "NONE" | "PENDING" | "CLAIMED" | "PAID";

/** Wire findReplacementContext so SIGNUP maps to {abo: ABO, waitlist: WL}. */
function setupReplacement(paymentStatus: Status, status = "WAITLIST") {
  (db.signup.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: SIGNUP,
    status,
    playerId: WL,
    matchId: MATCH,
    paymentStatus,
  });
  (db.signup.findMany as ReturnType<typeof vi.fn>).mockImplementation((args: { where?: { status?: string } }) => {
    if (args?.where?.status === "WAITLIST") return Promise.resolve([{ id: SIGNUP }]);
    return Promise.resolve([{ id: "out-1", player: { id: ABO } }]);
  });
}

function loginAs(playerId: string) {
  (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "user-1",
    role: "PLAYER",
    player: { id: playerId },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("confirmPaymentReceivedAction (subscriber confirms directly)", () => {
  it("lets the subscriber settle a PENDING payment directly to PAID", async () => {
    setupReplacement("PENDING");
    loginAs(ABO);
    (db.signup.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

    await confirmPaymentReceivedAction(SIGNUP);

    expect(db.signup.updateMany).toHaveBeenCalledTimes(1);
    const arg = (db.signup.updateMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.where).toEqual({ id: SIGNUP, paymentStatus: { in: ["PENDING", "CLAIMED"] } });
    expect(arg.data).toEqual({ paymentStatus: "PAID" }); // same terminal state as the two-step flow
  });

  it("works before the replacement marked it paid (atomic guard still allows CLAIMED too)", async () => {
    setupReplacement("PENDING");
    loginAs(ABO);
    (db.signup.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
    await confirmPaymentReceivedAction(SIGNUP);
    const arg = (db.signup.updateMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.where.paymentStatus.in).toContain("PENDING");
  });

  it("rejects the replacement player and writes nothing", async () => {
    setupReplacement("PENDING");
    loginAs(WL);
    await expect(confirmPaymentReceivedAction(SIGNUP)).rejects.toThrow(
      /only the subscription player/i,
    );
    expect(db.signup.updateMany).not.toHaveBeenCalled();
  });

  it("rejects an unrelated player and writes nothing", async () => {
    setupReplacement("PENDING");
    loginAs("stranger");
    await expect(confirmPaymentReceivedAction(SIGNUP)).rejects.toThrow(
      /only the subscription player/i,
    );
    expect(db.signup.updateMany).not.toHaveBeenCalled();
  });

  it("refuses to confirm an already-completed payment", async () => {
    setupReplacement("PAID");
    loginAs(ABO);
    await expect(confirmPaymentReceivedAction(SIGNUP)).rejects.toThrow(/already completed/i);
    expect(db.signup.updateMany).not.toHaveBeenCalled();
  });

  it("is race-safe: a second concurrent confirm cannot double-complete", async () => {
    setupReplacement("PENDING");
    loginAs(ABO);
    // First atomic update flips the row (count 1); the second sees nothing to flip (count 0).
    (db.signup.updateMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await expect(confirmPaymentReceivedAction(SIGNUP)).resolves.toBeUndefined();
    await expect(confirmPaymentReceivedAction(SIGNUP)).rejects.toThrow(/already completed/i);
  });
});

describe("remindPaymentAction (subscriber WhatsApp reminder tracking)", () => {
  function lastRawSql() {
    const call = (db.$executeRaw as ReturnType<typeof vi.fn>).mock.calls[0];
    const strings = call[0] as string[];
    const values = call.slice(1);
    return { sql: strings.join(" ? "), values };
  }

  it("issues a single atomic, guarded increment that updates count and timestamp", async () => {
    setupReplacement("PENDING");
    loginAs(ABO);
    (db.$executeRaw as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    await remindPaymentAction(SIGNUP);

    expect(db.$executeRaw).toHaveBeenCalledTimes(1);
    const { sql, values } = lastRawSql();
    expect(sql).toContain(`"paymentReminderCount" = "paymentReminderCount" + 1`);
    expect(sql).toContain(`"paymentReminderLastAt" = NOW()`);
    // outstanding-state guard + cool-down window guard (duplicate-action protection)
    expect(sql).toContain(`"paymentStatus" IN ('PENDING', 'CLAIMED')`);
    expect(sql).toMatch(/INTERVAL '1 second'/);
    expect(values).toContain(SIGNUP);
  });

  it("records each genuine reminder (second reminder issues another increment)", async () => {
    setupReplacement("PENDING");
    loginAs(ABO);
    (db.$executeRaw as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    await remindPaymentAction(SIGNUP);
    await remindPaymentAction(SIGNUP);
    expect(db.$executeRaw).toHaveBeenCalledTimes(2);
  });

  it("rejects the replacement player and writes nothing", async () => {
    setupReplacement("PENDING");
    loginAs(WL);
    await expect(remindPaymentAction(SIGNUP)).rejects.toThrow(/only the subscription player/i);
    expect(db.$executeRaw).not.toHaveBeenCalled();
  });

  it("rejects an unrelated player and writes nothing", async () => {
    setupReplacement("PENDING");
    loginAs("stranger");
    await expect(remindPaymentAction(SIGNUP)).rejects.toThrow(/only the subscription player/i);
    expect(db.$executeRaw).not.toHaveBeenCalled();
  });

  it("refuses to remind on a completed payment", async () => {
    setupReplacement("PAID");
    loginAs(ABO);
    await expect(remindPaymentAction(SIGNUP)).rejects.toThrow(/already completed/i);
    expect(db.$executeRaw).not.toHaveBeenCalled();
  });
});

describe("existing replacement-player flow is unchanged", () => {
  it("still lets the replacement mark a pending payment as paid (PENDING -> CLAIMED)", async () => {
    setupReplacement("PENDING");
    loginAs(WL);
    (db.signup.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    await claimPaymentAction(SIGNUP);
    const arg = (db.signup.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.data).toEqual({ paymentStatus: "CLAIMED" });
  });

  it("does not let the subscriber use the replacement's mark-as-paid action", async () => {
    setupReplacement("PENDING");
    loginAs(ABO);
    await expect(claimPaymentAction(SIGNUP)).rejects.toThrow(/only the waitlist player/i);
    expect(db.signup.update).not.toHaveBeenCalled();
  });
});
