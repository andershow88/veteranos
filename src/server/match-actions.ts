"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin, requireUser } from "@/lib/auth";
import type { PaymentStatus, SignupStatus } from "@prisma/client";
import { sendPushToAll } from "@/lib/push";

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

  const name = `${user.player.firstName} ${user.player.lastName ?? ""}`.trim();
  sendPushToAll("😔 Player declined", `${name} can't make it`, `/matches/${matchId}`).catch(() => {});

  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
}

/** Abo declines and picks a specific replacement — either an existing player
 *  or a guest (no account). Bypasses the automatic waitlist assignment for
 *  this particular slot. */
export async function declineWithReplacementAction(input: {
  matchId: string;
  mode: "guest" | "existing";
  /** mode=guest */
  guestFirstName?: string;
  guestLastName?: string;
  guestOverall?: number;
  /** mode=existing — the playerId of the chosen replacement */
  existingPlayerId?: string;
}) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("No player profile");

  const match = await db.match.findUnique({ where: { id: input.matchId } });
  if (!match) throw new Error("Match not found");
  if (match.locked) throw new Error("Match is locked");
  if (user.player.kind !== "ABO") throw new Error("Only abos can decline.");

  const outRank = await db.signup.count({
    where: { matchId: input.matchId, status: "OUT", player: { kind: "ABO" } },
  });

  await db.signup.upsert({
    where: { matchId_playerId: { matchId: input.matchId, playerId: user.player.id } },
    create: { matchId: input.matchId, playerId: user.player.id, status: "OUT", rank: outRank },
    update: { status: "OUT", rank: outRank },
  });

  let replacementPlayerId: string;

  if (input.mode === "guest") {
    if (!input.guestFirstName?.trim()) throw new Error("Guest name required");
    const guest = await db.player.create({
      data: {
        firstName: input.guestFirstName.trim(),
        lastName: input.guestLastName?.trim() || null,
        kind: "WAITLIST",
        rank: 999,
        overall: Math.max(0, Math.min(100, input.guestOverall ?? 50)),
        active: false,
      },
    });
    replacementPlayerId = guest.id;
  } else {
    if (!input.existingPlayerId) throw new Error("Player selection required");
    replacementPlayerId = input.existingPlayerId;
  }

  const waitlist = await db.signup.findMany({
    where: { matchId: input.matchId, status: "WAITLIST" },
    orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
    select: { id: true, rank: true },
  });

  const insertRank =
    outRank < waitlist.length
      ? waitlist[outRank].rank
      : (waitlist.length > 0 ? waitlist[waitlist.length - 1].rank + 1 : 1);

  await db.$transaction(async (tx) => {
    for (let i = waitlist.length - 1; i >= 0; i--) {
      if (waitlist[i].rank >= insertRank) {
        await tx.signup.update({
          where: { id: waitlist[i].id },
          data: { rank: waitlist[i].rank + 1 },
        });
      }
    }
    await tx.signup.upsert({
      where: { matchId_playerId: { matchId: input.matchId, playerId: replacementPlayerId } },
      create: { matchId: input.matchId, playerId: replacementPlayerId, status: "WAITLIST", rank: insertRank },
      update: { status: "WAITLIST", rank: insertRank },
    });
  });

  await syncWaitlistPaymentStatuses(input.matchId);

  const replacement = await db.player.findUnique({ where: { id: replacementPlayerId } });
  if (replacement) {
    const rName = `${replacement.firstName} ${replacement.lastName ?? ""}`.trim();
    sendPushToAll("🔄 New player in!", `${rName} is joining the match`, `/matches/${input.matchId}`).catch(() => {});
  }

  revalidatePath("/");
  revalidatePath(`/matches/${input.matchId}`);
}

/** Admin: assign an existing registered player to a specific declined abo slot. */
export async function addExistingPlayerToMatchAction(input: {
  matchId: string;
  declinedIndex: number;
  playerId: string;
}) {
  await requireAdmin();

  const player = await db.player.findUnique({ where: { id: input.playerId } });
  if (!player) throw new Error("Player not found");

  const waitlist = await db.signup.findMany({
    where: { matchId: input.matchId, status: "WAITLIST" },
    orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
    select: { id: true, rank: true },
  });

  const insertRank =
    input.declinedIndex < waitlist.length
      ? waitlist[input.declinedIndex].rank
      : (waitlist.length > 0 ? waitlist[waitlist.length - 1].rank + 1 : 1);

  await db.$transaction(async (tx) => {
    for (let i = waitlist.length - 1; i >= 0; i--) {
      if (waitlist[i].rank >= insertRank) {
        await tx.signup.update({
          where: { id: waitlist[i].id },
          data: { rank: waitlist[i].rank + 1 },
        });
      }
    }
    await tx.signup.upsert({
      where: { matchId_playerId: { matchId: input.matchId, playerId: input.playerId } },
      create: { matchId: input.matchId, playerId: input.playerId, status: "WAITLIST", rank: insertRank },
      update: { status: "WAITLIST", rank: insertRank },
    });
  });

  await syncWaitlistPaymentStatuses(input.matchId);

  revalidatePath("/");
  revalidatePath(`/matches/${input.matchId}`);
  revalidatePath(`/admin/matches/${input.matchId}`);
}

/** Returns waitlist players available for manual assignment on a match. */
export async function getWaitlistPlayersForMatch(matchId: string) {
  const signedUpIds = (
    await db.signup.findMany({
      where: { matchId },
      select: { playerId: true },
    })
  ).map((s) => s.playerId);

  return db.player.findMany({
    where: {
      active: true,
      kind: "WAITLIST",
      id: { notIn: signedUpIds },
    },
    orderBy: [{ rank: "asc" }, { lastName: "asc" }],
    select: { id: true, firstName: true, lastName: true, overall: true },
  });
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
 * Already-CLAIMED or already-PAID rows are preserved. Anyone past that count gets reset to NONE.
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
          // Don't downgrade existing claim/paid state.
          paymentStatus:
            w.paymentStatus === "PAID"
              ? "PAID"
              : w.paymentStatus === "CLAIMED"
              ? "CLAIMED"
              : "PENDING",
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

  if (locked) {
    sendPushToAll("🔒 Sign-ups locked", "The lineup is set — teams coming soon!", `/matches/${matchId}`).catch(() => {});
  }

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

/** Admin: assign a guest player (no account) to a specific declined abo slot.
 *  Creates a Player record and inserts them into the waitlist at the given
 *  position, pushing existing waitlist players down by one rank. */
export async function addGuestToMatchAction(input: {
  matchId: string;
  /** 0-based position in the declined list this guest replaces */
  declinedIndex: number;
  firstName: string;
  lastName: string;
  overall: number;
}) {
  await requireAdmin();

  const guest = await db.player.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim() || null,
      kind: "WAITLIST",
      rank: 999,
      overall: Math.max(0, Math.min(100, input.overall)),
      active: false,
    },
  });

  const waitlist = await db.signup.findMany({
    where: { matchId: input.matchId, status: "WAITLIST" },
    orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
    select: { id: true, rank: true },
  });

  const insertRank =
    input.declinedIndex < waitlist.length
      ? waitlist[input.declinedIndex].rank
      : (waitlist.length > 0 ? waitlist[waitlist.length - 1].rank + 1 : 1);

  await db.$transaction(async (tx) => {
    for (let i = waitlist.length - 1; i >= 0; i--) {
      if (waitlist[i].rank >= insertRank) {
        await tx.signup.update({
          where: { id: waitlist[i].id },
          data: { rank: waitlist[i].rank + 1 },
        });
      }
    }
    await tx.signup.create({
      data: {
        matchId: input.matchId,
        playerId: guest.id,
        status: "WAITLIST",
        rank: insertRank,
      },
    });
  });

  await syncWaitlistPaymentStatuses(input.matchId);

  revalidatePath("/");
  revalidatePath(`/matches/${input.matchId}`);
  revalidatePath(`/admin/matches/${input.matchId}`);
}

/**
 * Looks up the abo signup that a given waitlist signup is replacing.
 * Match by rank: waitlist[i] replaces declined[i] when both lists are sorted.
 * Returns null if this signup isn't a replacement.
 */
async function findReplacementContext(signupId: string) {
  const wl = await db.signup.findUnique({
    where: { id: signupId },
    include: { player: true },
  });
  if (!wl || wl.status !== "WAITLIST") return null;

  const [waitlist, outs] = await Promise.all([
    db.signup.findMany({
      where: { matchId: wl.matchId, status: "WAITLIST" },
      orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    }),
    db.signup.findMany({
      where: { matchId: wl.matchId, status: "OUT", player: { kind: "ABO" } },
      orderBy: { rank: "asc" },
      include: { player: true },
    }),
  ]);

  const idx = waitlist.findIndex((s) => s.id === wl.id);
  const out = idx >= 0 ? outs[idx] : null;
  if (!out) return null;

  return { waitlist: wl, out, abo: out.player };
}

function pathBust(matchId: string) {
  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/profile");
  revalidatePath(`/admin/matches/${matchId}`);
}

/**
 * Waitlist player marks their replacement payment as paid.
 * Transitions PENDING -> CLAIMED. The abo player still needs to confirm.
 */
export async function claimPaymentAction(signupId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("No player profile");

  const ctx = await findReplacementContext(signupId);
  if (!ctx) throw new Error("Not a replacement signup");
  if (ctx.waitlist.playerId !== user.player.id) {
    throw new Error("Only the waitlist player can claim payment");
  }
  if (ctx.waitlist.paymentStatus !== "PENDING") {
    throw new Error("Payment is not pending");
  }

  await db.signup.update({
    where: { id: signupId },
    data: { paymentStatus: "CLAIMED" },
  });

  pathBust(ctx.waitlist.matchId);
}

/**
 * Waitlist player undoes their paid claim.
 * Transitions CLAIMED -> PENDING.
 */
export async function unclaimPaymentAction(signupId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("No player profile");

  const ctx = await findReplacementContext(signupId);
  if (!ctx) throw new Error("Not a replacement signup");
  if (ctx.waitlist.playerId !== user.player.id) {
    throw new Error("Only the waitlist player can revoke a claim");
  }
  if (ctx.waitlist.paymentStatus !== "CLAIMED") {
    throw new Error("Payment is not claimed");
  }

  await db.signup.update({
    where: { id: signupId },
    data: { paymentStatus: "PENDING" },
  });

  pathBust(ctx.waitlist.matchId);
}

/**
 * Abo player confirms they received payment.
 * Transitions CLAIMED -> PAID.
 */
export async function confirmPaymentAction(signupId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("No player profile");

  const ctx = await findReplacementContext(signupId);
  if (!ctx) throw new Error("Not a replacement signup");
  if (ctx.abo.id !== user.player.id) {
    throw new Error("Only the abo can confirm receipt");
  }
  if (ctx.waitlist.paymentStatus !== "CLAIMED") {
    throw new Error("Payment is not in a confirmable state");
  }

  await db.signup.update({
    where: { id: signupId },
    data: { paymentStatus: "PAID" },
  });

  pathBust(ctx.waitlist.matchId);
}

/**
 * Abo player rejects a paid claim (CLAIMED -> PENDING).
 * Used when waitlist marked paid but the abo never received it.
 */
export async function disputePaymentAction(signupId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("No player profile");

  const ctx = await findReplacementContext(signupId);
  if (!ctx) throw new Error("Not a replacement signup");
  if (ctx.abo.id !== user.player.id) {
    throw new Error("Only the abo can dispute");
  }
  if (ctx.waitlist.paymentStatus !== "CLAIMED") {
    throw new Error("Nothing to dispute");
  }

  await db.signup.update({
    where: { id: signupId },
    data: { paymentStatus: "PENDING" },
  });

  pathBust(ctx.waitlist.matchId);
}
