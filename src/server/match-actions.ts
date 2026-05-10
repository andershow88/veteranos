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

/** Abo-Spieler bestätigt Teilnahme oder ist neu eingetragen. */
export async function setAttendingAction(matchId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("Kein Spielerprofil");

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Termin nicht gefunden");
  if (match.locked) throw new Error("Termin ist gesperrt");

  if (user.player.kind !== "SUBSCRIBER") {
    throw new Error("Nur Abo-Spieler können hier zusagen. Wartelisten-Spieler nutzen die Warteliste.");
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

/** Abo-Spieler sagt ab. Falls Wartelisten-Spieler vorhanden: Zahlungsstatus PENDING setzen. */
export async function setDeclinedAction(matchId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("Kein Spielerprofil");

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Termin nicht gefunden");
  if (match.locked) throw new Error("Termin ist gesperrt");

  if (user.player.kind !== "SUBSCRIBER") {
    throw new Error("Nur Abo-Spieler können absagen.");
  }

  // Reihenfolge der Absagen: bestehende Anzahl OUTs zählt -> rank für Zuordnung
  const outRank = await db.signup.count({
    where: { matchId, status: "OUT", player: { kind: "SUBSCRIBER" } },
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

  // Wenn ein Wartelisten-Spieler an Position [outRank] existiert -> Zahlungsstatus PENDING markieren
  await syncWaitlistPaymentStatuses(matchId);

  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
}

/** Wartelisten-Spieler trägt sich ein. */
export async function joinWaitlistAction(matchId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("Kein Spielerprofil");

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Termin nicht gefunden");
  if (match.locked) throw new Error("Termin ist gesperrt");

  if (user.player.kind !== "WAITLIST") {
    throw new Error("Nur Wartelisten-Spieler können sich auf die Warteliste setzen.");
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

/** Wartelisten-Spieler trägt sich aus. */
export async function leaveWaitlistAction(matchId: string) {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.player) throw new Error("Kein Spielerprofil");

  await db.signup.deleteMany({
    where: { matchId, playerId: user.player.id, status: "WAITLIST" },
  });

  // Wartelisten-Ränge neu durchnummerieren
  await renumberWaitlist(matchId);
  await syncWaitlistPaymentStatuses(matchId);

  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
}

/** Admin: Zahlungsstatus zwischen Wartelisten- und Abo-Spieler manuell setzen. */
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
 * Setzt für die jeweils ersten N Wartelisten-Spieler (N = Anzahl Absagen) den
 * Zahlungsstatus auf PENDING (falls noch NONE). Spieler dahinter bleiben NONE.
 */
async function syncWaitlistPaymentStatuses(matchId: string) {
  const declined = await db.signup.findMany({
    where: { matchId, status: "OUT", player: { kind: "SUBSCRIBER" } },
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

/** Admin: Match-Liste sperren / entsperren. */
export async function setMatchLockedAction(matchId: string, locked: boolean) {
  await requireAdmin();
  await db.match.update({ where: { id: matchId }, data: { locked } });
  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/admin/matches");
}

/** Admin: Spieler manuell für einen Termin (de-)anmelden. */
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
  if (!player) throw new Error("Spieler nicht gefunden");

  let rank = player.rank;
  if (input.status === "WAITLIST") rank = await nextWaitlistRank(input.matchId);
  if (input.status === "OUT") {
    rank = await db.signup.count({
      where: { matchId: input.matchId, status: "OUT", player: { kind: "SUBSCRIBER" } },
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
