"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { buildPasswordResetUrl, sendEmail } from "@/lib/email";

const TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

const forgotSchema = z.object({
  firstName: z.string().min(1, "First name missing"),
  lastName: z.string().min(1, "Last name missing"),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "At least 6 characters"),
});

export type ForgotState =
  | { status: "sent" }
  | { status: "error"; error: string }
  | undefined;

export type ResetState = { status?: "ok"; error?: string } | undefined;

/** Raw token goes into the link/email; only its hash is ever stored. */
function generateToken(): string {
  return randomBytes(32).toString("base64url");
}
function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Invalidate all open tokens for a user, then create a fresh (hashed) one. */
async function issueResetToken(userId: string, source: string): Promise<string> {
  const raw = generateToken();
  await db.$transaction([
    db.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.passwordResetToken.create({
      data: {
        token: hashToken(raw),
        userId,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        source,
      },
    }),
  ]);
  return raw;
}

async function getBaseUrl() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  return `${proto}://${host}`;
}

/**
 * Public: request a password reset by name.
 *
 * SECURITY: never returns a token/link to the requester. If there's an
 * unambiguous match with a linked account, the link is emailed to the
 * registered address (or logged server-side when email isn't configured).
 * The response is ALWAYS a generic "sent" so account existence isn't leaked.
 */
export async function requestPasswordResetAction(
  _: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const parsed = forgotSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  const first = parsed.data.firstName.trim();
  const last = parsed.data.lastName.trim();

  const matches = await db.player.findMany({
    where: {
      firstName: { equals: first, mode: "insensitive" },
      lastName: { equals: last, mode: "insensitive" },
    },
    include: { user: true },
    take: 2, // we only care whether it's exactly 1
  });

  if (matches.length === 1 && matches[0].user) {
    const user = matches[0].user;
    try {
      const raw = await issueResetToken(user.id, "self");
      const url = buildPasswordResetUrl(await getBaseUrl(), raw);
      await sendEmail({
        to: user.email,
        subject: "Veteranos: reset your password",
        text: [
          `Hi ${matches[0].firstName},`,
          "",
          "You (or someone) requested a password reset for your Veteranos account.",
          "Open the link below to choose a new password. It expires in one hour.",
          "",
          url,
          "",
          "If you didn't request this, you can safely ignore this email.",
        ].join("\n"),
      });
    } catch {
      // Swallow — never reveal success/failure or existence to the requester.
    }
  }

  // Always generic — no token, no existence leak.
  return { status: "sent" };
}

/** Admin-triggered: generate a reset token for a specific user and email it. */
export async function adminGenerateResetLinkAction(userId: string): Promise<{
  url: string;
  emailDelivered: boolean;
}> {
  const session = await requireAdmin();

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { player: true },
  });
  if (!user) throw new Error("User not found");

  const raw = await issueResetToken(user.id, session.userId);
  const baseUrl = await getBaseUrl();
  const url = buildPasswordResetUrl(baseUrl, raw);

  const text = [
    `Hi ${user.player?.firstName ?? "there"},`,
    "",
    "An admin generated a password reset link for your Veteranos account.",
    "Open the link below to choose a new password. It expires in one hour.",
    "",
    url,
    "",
    "If you did not expect this, ignore this email or contact the admin.",
  ].join("\n");

  const send = await sendEmail({
    to: user.email,
    subject: "Veteranos: a reset link was generated for you",
    text,
  });

  revalidatePath(`/admin/players`);
  return { url, emailDelivered: send.delivered };
}

/** Public: actually set the new password using the (raw) token from the link. */
export async function resetPasswordAction(
  _: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const tokenRow = await db.passwordResetToken.findUnique({
    where: { token: hashToken(parsed.data.token) },
  });

  if (!tokenRow || tokenRow.usedAt) {
    return { error: "Reset link is invalid or already used" };
  }
  if (tokenRow.expiresAt.getTime() < Date.now()) {
    return { error: "Reset link has expired" };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.$transaction([
    db.user.update({
      where: { id: tokenRow.userId },
      data: { passwordHash },
    }),
    db.passwordResetToken.update({
      where: { id: tokenRow.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate any other open reset tokens for this user.
    db.passwordResetToken.updateMany({
      where: {
        userId: tokenRow.userId,
        usedAt: null,
        NOT: { id: tokenRow.id },
      },
      data: { usedAt: new Date() },
    }),
  ]);

  return { status: "ok" };
}

/** Helper used by the public reset page — validates the raw token from the URL. */
export async function findUsableResetToken(token: string) {
  if (!token) return null;
  const row = await db.passwordResetToken.findUnique({ where: { token: hashToken(token) } });
  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row;
}
