"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin, requireUser } from "@/lib/auth";
import type { PaymentStatus, SignupStatus } from "@prisma/client";

async function nextWaitlistRank(matchId: string) {
  const top = await db.signup.findFirst({
    where: { matchId, status: "WAITLIST" },
    orderBy: { rank: "desc" },
    select: { rank: true },
  });
  return (top?.rank ?? 0) + 1;
}

/** Abo confirms participation or is freshly signed up. */
export async function setAttendingAction(matchId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("No player profile");

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match not found");
  if (match.locked) throw new Error("Match is locked");

  if (user.player.kind !== "ABO") {
    throw new Error("Only abos can confirm here. Waitlist players use the waitlist.");
  }

  await db.signup.upsert({
    where: { matchId_playerId: { matchId, playerId: user.player.id } },
    create: {
      matchId,
      playerId: user.player.id,
      status: "IN",
      rank: user.player.rank,
    },
    update: { status: "IN", rank: user.player.rank, paymentStatus: "NONE" },
  });

  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
}

/** Abo declines. If a waitlist player is available, payment status flips to PENDING. */
export async function setDeclinedAction(matchId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("No player profile");

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match not found");
  if (match.locked) throw new Error("Match is locked");

  if (user.player.kind !== "ABO") {
    throw new Error("Only abos can decline.");
  }

  // Decline order: count existing OUTs to assign rank
  const outRank = await db.signup.count({
    where: { matchId, status: "OUT", player: { kind: "ABO" } },
  });

  await db.signup.upsert({
    where: { matchId_playerId: { matchId, playerId: user.player.id } },
    create: {
      matchId,
      playerId: user.player.id,
      status: "OUT",
      rank: outRank,
    },
    update: { status: "OUT", rank: outRank },
  });

  // If a waitlist player at position [outRank] exists, mark payment as PENDING.
  await syncWaitlistPaymentStatuses(matchId);

  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
}

/** Waitlist player adds themselves to a match. */
export async function joinWaitlistAction(matchId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("No player profile");

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match not found");
  if (match.locked) throw new Error("Match is locked");

  if (user.player.kind !== "WAITLIST") {
    throw new Error("Only waitlist players can join the waitlist.");
  }

  const rank = await nextWaitlistRank(matchId);

  await db.signup.upsert({
    where: { matchId_playerId: { matchId, playerId: user.player.id } },
    create: {
      matchId,
      playerId: user.player.id,
      status: "WAITLIST",
      rank,
    },
    update: { status: "WAITLIST", rank },
  });

  await syncWaitlistPaymentStatuses(matchId);

  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
}

/** Waitlist player leaves the waitlist. */
export async function leaveWaitlistAction(matchId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("No player profile");

  await db.signup.deleteMany({
    where: { matchId, playerId: user.player.id, status: "WAITLIST" },
  });

  // Renumber waitlist ranks
  await renumberWaitlist(matchId);
  await syncWaitlistPaymentStatuses(matchId);

  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
}

/** Admin: manually set the payment status between waitlist and abo. */
export async function setPaymentStatusAction(input: {
  signupId: string;
  status: PaymentStatus;
  note?: string | null;
}) {
  await requireAdmin();
  const updated = await db.signup.update({
    where: { id: input.signupId },
    data: { paymentStatus: input.status, paymentNote: input.note ?? null },
    select: { matchId: true },
  });
  revalidatePath("/");
  revalidatePath(`/matches/${updated.matchId}`);
  revalidatePath("/admin/matches");
}

/**
 * Sets the payment status to PENDING for the first N waitlist players (N = number of declines).
 * Anyone past that count gets reset to NONE.
 */
async function syncWaitlistPaymentStatuses(matchId: string) {
  const declined = await db.signup.findMany({
    where: { matchId, status: "OUT", player: { kind: "ABO" } },
    orderBy: { rank: "asc" },
    select: { id: true },
  });
  const waitlist = await db.signup.findMany({
    where: { matchId, status: "WAITLIST" },
    orderBy: { rank: "asc" },
    select: { id: true, paymentStatus: true },
  });

  const replacingCount = Math.min(declined.length, waitlist.length);

  await db.$transaction([
    ...waitlist.slice(0, replacingCount).map((w) =>
      db.signup.update({
        where: { id: w.id },
        data: {
          paymentStatus: w.paymentStatus === "PAID" ? "PAID" : "PENDING",
        },
      }),
    ),
    ...waitlist.slice(replacingCount).map((w) =>
      db.signup.update({
        where: { id: w.id },
        data: { paymentStatus: "NONE", paymentNote: null },
      }),
    ),
  ]);
}

async function renumberWaitlist(matchId: string) {
  const wls = await db.signup.findMany({
    where: { matchId, status: "WAITLIST" },
    orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  await db.$transaction(
    wls.map((s, idx) =>
      db.signup.update({ where: { id: s.id }, data: { rank: idx + 1 } }),
    ),
  );
}

/** Admin: lock or unlock a match's sign-up list. */
export async function setMatchLockedAction(matchId: string, locked: boolean) {
  await requireAdmin();
  await db.match.update({ where: { id: matchId }, data: { locked } });
  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/admin/matches");
}

/** Admin: manually sign a player up for / remove from a match. */
export async function adminSetSignupAction(input: {
  matchId: string;
  playerId: string;
  status: SignupStatus | "REMOVE";
}) {
  await requireAdmin();

  if (input.status === "REMOVE") {
    await db.signup.deleteMany({ where: { matchId: input.matchId, playerId: input.playerId } });
    await renumberWaitlist(input.matchId);
    await syncWaitlistPaymentStatuses(input.matchId);
    revalidatePath("/");
    revalidatePath(`/matches/${input.matchId}`);
    revalidatePath("/admin/matches");
    return;
  }

  const player = await db.player.findUnique({ where: { id: input.playerId } });
  if (!player) throw new Error("Player not found");

  let rank = player.rank;
  if (input.status === "WAITLIST") rank = await nextWaitlistRank(input.matchId);
  if (input.status === "OUT") {
    rank = await db.signup.count({
      where: { matchId: input.matchId, status: "OUT", player: { kind: "ABO" } },
    });
  }

  await db.signup.upsert({
    where: { matchId_playerId: { matchId: input.matchId, playerId: input.playerId } },
    create: {
      matchId: input.matchId,
      playerId: input.playerId,
      status: input.status,
      rank,
    },
    update: { status: input.status, rank },
  });

  await syncWaitlistPaymentStatuses(input.matchId);
  revalidatePath("/");
  revalidatePath(`/matches/${input.matchId}`);
  revalidatePath("/admin/matches");
}
