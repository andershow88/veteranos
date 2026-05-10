"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";

// Cap on the data URL length. ~600KB is plenty for a 256x256 JPEG/PNG avatar.
const MAX_DATA_URL = 600 * 1024;

const ALLOWED_MIME = /^data:image\/(jpeg|png|webp);base64,/;

async function assertCanEdit(playerId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required");
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && user.player?.id !== playerId) {
    throw new Error("You can only edit your own avatar");
  }
}

export async function updateAvatarAction(playerId: string, dataUrl: string) {
  await assertCanEdit(playerId);

  if (typeof dataUrl !== "string" || !ALLOWED_MIME.test(dataUrl)) {
    throw new Error("Invalid image format");
  }
  if (dataUrl.length > MAX_DATA_URL) {
    throw new Error("Image is too large after cropping");
  }

  await db.player.update({
    where: { id: playerId },
    data: { avatarUrl: dataUrl },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/admin/players/${playerId}`);
  revalidatePath("/admin/players");
}

export async function removeAvatarAction(playerId: string) {
  await assertCanEdit(playerId);

  await db.player.update({
    where: { id: playerId },
    data: { avatarUrl: null },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/admin/players/${playerId}`);
  revalidatePath("/admin/players");
}
