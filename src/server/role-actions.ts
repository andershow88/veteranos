"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";

export async function promoteToAdminAction(userId: string) {
  await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
  revalidatePath("/admin/players");
  revalidatePath(`/admin/players`);
}

export async function demoteToPlayerAction(userId: string) {
  const session = await requireAdmin();
  // Don't allow demoting yourself - prevents lock-out.
  if (session.userId === userId) {
    throw new Error("You cannot demote yourself.");
  }
  // Don't allow demoting the last admin.
  const adminCount = await db.user.count({ where: { role: "ADMIN" } });
  if (adminCount <= 1) {
    throw new Error("Cannot demote the only remaining admin.");
  }
  await db.user.update({ where: { id: userId }, data: { role: "PLAYER" } });
  revalidatePath("/admin/players");
}

/** Helper for UI: avoid showing "demote" button on yourself. */
export async function getMyUserId(): Promise<string | null> {
  const s = await getSession();
  return s?.userId ?? null;
}
