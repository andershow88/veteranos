"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

const createSchema = z.object({
  label: z.string().max(80).optional().nullable(),
  maxUses: z.coerce.number().int().min(1).max(1000).optional().nullable(),
  expiresInDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
});

export type InviteFormState = { error?: string; ok?: boolean } | undefined;

function generateToken(): string {
  // ~22 url-safe chars, lots of entropy
  return randomBytes(16).toString("base64url");
}

export async function createInviteAction(
  _: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  await requireAdmin();
  const parsed = createSchema.safeParse({
    label: formData.get("label"),
    maxUses: formData.get("maxUses"),
    expiresInDays: formData.get("expiresInDays"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const me = await getCurrentUser();
  const expiresAt = parsed.data.expiresInDays
    ? new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  await db.invitation.create({
    data: {
      token: generateToken(),
      label: parsed.data.label || null,
      maxUses: parsed.data.maxUses ?? null,
      expiresAt,
      createdById: me?.id ?? null,
    },
  });

  revalidatePath("/admin/invites");
  return { ok: true };
}

export async function revokeInviteAction(id: string) {
  await requireAdmin();
  await db.invitation.update({
    where: { id },
    data: { active: false },
  });
  revalidatePath("/admin/invites");
}

export async function deleteInviteAction(id: string) {
  await requireAdmin();
  await db.invitation.delete({ where: { id } });
  revalidatePath("/admin/invites");
}

/** Validate a token from the public register page. Returns the invite if usable. */
export async function findUsableInvite(token: string) {
  if (!token) return null;
  const invite = await db.invitation.findUnique({ where: { token } });
  if (!invite) return null;
  if (!invite.active) return null;
  if (invite.expiresAt && invite.expiresAt < new Date()) return null;
  if (invite.maxUses != null && invite.uses >= invite.maxUses) return null;
  return invite;
}

/** Atomically consume one invite use. Returns true if the invite is still usable. */
export async function consumeInvite(token: string): Promise<boolean> {
  const result = await db.$executeRaw`
    UPDATE "Invitation"
    SET "uses" = "uses" + 1, "updatedAt" = NOW()
    WHERE "token" = ${token}
      AND "active" = TRUE
      AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
      AND ("maxUses" IS NULL OR "uses" < "maxUses")
  `;
  return Number(result) === 1;
}
