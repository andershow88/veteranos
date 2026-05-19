"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword, requireUser } from "@/lib/auth";

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().nullable(),
  nickname: z.string().optional().nullable(),
  paypalName: z.string().optional().nullable(),
  paypalLink: z.string().url().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export type ProfileState = { error?: string; ok?: boolean } | undefined;

export async function updateProfileAction(_: ProfileState, formData: FormData): Promise<ProfileState> {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) return { error: "No player profile" };

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    nickname: formData.get("nickname"),
    paypalName: formData.get("paypalName"),
    paypalLink: formData.get("paypalLink"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.player.update({
    where: { id: user.player.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      nickname: parsed.data.nickname || null,
      phone: parsed.data.phone || null,
      paypalName: parsed.data.paypalName || null,
      paypalLink: parsed.data.paypalLink || null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true };
}

export async function setClubAction(clubSlug: string | null): Promise<{ ok?: boolean; error?: string }> {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) return { error: "No player profile" };

  await db.player.update({
    where: { id: user.player.id },
    data: { clubSlug: clubSlug || null },
  });

  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true };
}

export async function changePasswordAction(_: ProfileState, formData: FormData): Promise<ProfileState> {
  await requireUser();
  const user = await getCurrentUser();
  if (!user) return { error: "No account" };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const bcrypt = await import("bcryptjs");
  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { error: "Current password is wrong" };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return { ok: true };
}
