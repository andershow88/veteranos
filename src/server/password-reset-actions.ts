"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { randomBytes } from "node:crypto";
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
  | { status: "ok"; url: string }
  | { status: "name_mismatch" }
  | { status: "error"; error: string }
  | undefined;

export type ResetState = { status?: "ok"; error?: string } | undefined;

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

async function getBaseUrl() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  return `${proto}://${host}`;
}

/**
 * Public: request a password reset using only first + last name.
 *
 * If we find an unambiguous match (exactly one player with a linked
 * account), we generate a fresh token and return its URL so the user
 * can set a new password immediately on the same device. Zero or
 * multiple matches return name_mismatch so we don't leak account
 * existence either way.
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

  if (matches.length !== 1 || !matches[0].user) {
    return { status: "name_mismatch" };
  }

  const user = matches[0].user!;

  const token = generateToken();
  await db.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      source: "self",
    },
  });

  // Return the relative URL so the form can redirect the user straight
  // to the reset-password page on this device.
  return {
    status: "ok",
    url: `/reset-password?token=${encodeURIComponent(token)}`,
  };
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

  const token = generateToken();
  await db.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      source: session.userId,
    },
  });

  const baseUrl = await getBaseUrl();
  const url = buildPasswordResetUrl(baseUrl, token);

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

/** Public: actually set the new password using the token. */
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
    where: { token: parsed.data.token },
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

/** Helper used by the public reset page. */
export async function findUsableResetToken(token: string) {
  if (!token) return null;
  const row = await db.passwordResetToken.findUnique({ where: { token } });
  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row;
}
