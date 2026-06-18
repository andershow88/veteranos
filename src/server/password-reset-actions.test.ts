import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock framework + side-effect deps; keep node:crypto REAL so the hashing is
// genuine and a double-hash bug actually fails the test.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Map()) }));
vi.mock("@/lib/email", () => ({
  buildPasswordResetUrl: vi.fn(() => "https://veteranos.club/reset-password?token=x"),
  sendEmail: vi.fn(async () => ({ delivered: true })),
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(() => true), clientIp: vi.fn(async () => "0.0.0.0") }));
vi.mock("@/lib/auth", () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
  requireAdmin: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    passwordResetToken: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}));

import { resetPasswordAction } from "@/server/password-reset-actions";
import { db } from "@/lib/db";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

const RAW = "raw-reset-token-abc123";
const STORED_HASH = sha256(RAW); // what the DB actually holds

/** The DB only "finds" a row when queried by the correct stored hash. */
function rowForStoredHash(row: Record<string, unknown> | null) {
  (db.passwordResetToken.findUnique as ReturnType<typeof vi.fn>).mockImplementation(
    ({ where }: { where: { token: string } }) =>
      Promise.resolve(where.token === STORED_HASH ? row : null),
  );
}

function form(token: string, password = "new-password-1") {
  const fd = new FormData();
  fd.set("token", token);
  fd.set("password", password);
  return fd;
}

beforeEach(() => vi.clearAllMocks());

describe("resetPasswordAction token handling", () => {
  it("succeeds with the RAW token from the link (hashed once -> matches stored hash)", async () => {
    rowForStoredHash({ id: "t1", userId: "u1", token: STORED_HASH, usedAt: null, expiresAt: new Date(Date.now() + 60_000) });

    const res = await resetPasswordAction(undefined, form(RAW));

    expect(res).toEqual({ status: "ok" });
    expect(db.user.update).toHaveBeenCalled(); // password actually updated
  });

  it("FAILS if the form submits the STORED HASH instead of the raw token (double-hash regression)", async () => {
    rowForStoredHash({ id: "t1", userId: "u1", token: STORED_HASH, usedAt: null, expiresAt: new Date(Date.now() + 60_000) });

    // This is exactly the old bug: the page passed row.token (the stored hash).
    const res = await resetPasswordAction(undefined, form(STORED_HASH));

    expect(res?.error).toMatch(/invalid or already used/i);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects an already-used token", async () => {
    rowForStoredHash({ id: "t1", userId: "u1", token: STORED_HASH, usedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) });
    const res = await resetPasswordAction(undefined, form(RAW));
    expect(res?.error).toMatch(/invalid or already used/i);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    rowForStoredHash({ id: "t1", userId: "u1", token: STORED_HASH, usedAt: null, expiresAt: new Date(Date.now() - 1) });
    const res = await resetPasswordAction(undefined, form(RAW));
    expect(res?.error).toMatch(/expired/i);
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
