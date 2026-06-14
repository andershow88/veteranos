import "server-only";
import { db } from "@/lib/db";
import type { Player, PlayerKind, Signup, SignupStatus, PaymentStatus } from "@prisma/client";

export type MatchSlot = {
  signup: Signup & { player: Player };
};

export type ReplacementInfo = {
  /** Abo who declined */
  abo: Player;
  /** Waitlist player who steps in (or null if nobody is available) */
  replacement: (Signup & { player: Player }) | null;
  /** Original signup of the abo (with OUT status) */
  outSignup: Signup;
  /** Payment status between the waitlist player and the abo */
  paymentStatus: PaymentStatus;
  paymentNote: string | null;
};

export type MatchView = {
  id: string;
  date: Date;
  durationMin: number;
  location: string | null;
  notes: string | null;
  locked: boolean;
  teamCount: number;

  /** All active abos who are confirmed (IN status) */
  attendees: Array<Signup & { player: Player }>;
  /** Abos who declined (OUT status), sorted by rank */
  declined: Array<Signup & { player: Player }>;
  /** Waitlist players who signed up for this match */
  waitlist: Array<Signup & { player: Player }>;

  /** Computed replacement assignment */
  replacements: ReplacementInfo[];
  /** Waitlist players that do NOT replace anyone (overflow) */
  waitlistOverflow: Array<Signup & { player: Player }>;

  /** Active ABO players who have NOT yet responded (neither IN nor OUT) for this match */
  pendingAbos: Player[];
  /** Total active ABO players expected to respond (confirmed + declined + pending) */
  aboTotal: number;

  hasTeams: boolean;
};

/**
 * Returns the computed view of a match including the replacement assignment.
 * Strict order: waitlist player 1 -> first declined abo, waitlist 2 -> second, etc.
 */
export async function buildMatchView(matchId: string): Promise<MatchView | null> {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      signups: {
        include: { player: true },
        orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
      },
      teams: { select: { id: true } },
    },
  });
  if (!match) return null;

  const activeAbos = await getActiveAbos();
  return composeMatchView(match, activeAbos);
}

/** All active ABO players — the set expected to confirm/decline each match. */
async function getActiveAbos(): Promise<Player[]> {
  return db.player.findMany({
    where: { active: true, kind: "ABO" },
    orderBy: [{ rank: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function listUpcomingMatches(): Promise<MatchView[]> {
  const [matches, activeAbos] = await Promise.all([
    db.match.findMany({
      where: { date: { gte: new Date(Date.now() - 1000 * 60 * 60 * 6) } }, // up to 6h after kick-off still counts as upcoming
      orderBy: { date: "asc" },
      include: {
        signups: {
          include: { player: true },
          orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
        },
        teams: { select: { id: true } },
      },
    }),
    getActiveAbos(),
  ]);
  return matches.map((m) => composeMatchView(m, activeAbos));
}

export async function listPastMatches(limit = 20): Promise<MatchView[]> {
  const [matches, activeAbos] = await Promise.all([
    db.match.findMany({
      where: { date: { lt: new Date(Date.now() - 1000 * 60 * 60 * 6) } },
      orderBy: { date: "desc" },
      take: limit,
      include: {
        signups: {
          include: { player: true },
          orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
        },
        teams: { select: { id: true } },
      },
    }),
    getActiveAbos(),
  ]);
  return matches.map((m) => composeMatchView(m, activeAbos));
}

function composeMatchView(
  match: {
    id: string;
    date: Date;
    durationMin: number;
    location: string | null;
    notes: string | null;
    locked: boolean;
    teamCount: number;
    signups: Array<Signup & { player: Player }>;
    teams: Array<{ id: string }>;
  },
  activeAbos: Player[] = [],
): MatchView {
  const attendees = match.signups
    .filter((s) => s.status === "IN" && s.player.kind === "ABO")
    .sort((a, b) => a.player.rank - b.player.rank || a.rank - b.rank);

  // Decline order = signup.rank (the order players declined), matching the
  // payment/replacement logic in match-actions. Must NOT use player.rank here,
  // or the displayed replacement would diverge from the payment attribution.
  const declined = match.signups
    .filter((s) => s.status === "OUT" && s.player.kind === "ABO")
    .sort((a, b) => a.rank - b.rank || a.player.rank - b.player.rank);

  const waitlist = match.signups
    .filter((s) => s.status === "WAITLIST")
    .sort((a, b) => a.rank - b.rank || a.player.rank - b.player.rank);

  // "Pending" = active ABO players who have neither confirmed (IN) nor declined (OUT).
  const respondedAboIds = new Set<string>([
    ...attendees.map((s) => s.playerId),
    ...declined.map((s) => s.playerId),
  ]);
  const pendingAbos = activeAbos.filter((p) => !respondedAboIds.has(p.id));

  // Waitlist order: the first listed waitlist player replaces the first declined abo.
  const replacements: ReplacementInfo[] = declined.map((out, idx) => {
    const replacement = waitlist[idx] ?? null;
    return {
      abo: out.player,
      outSignup: out,
      replacement,
      paymentStatus: replacement?.paymentStatus ?? "NONE",
      paymentNote: replacement?.paymentNote ?? null,
    };
  });

  const waitlistOverflow = waitlist.slice(declined.length);

  return {
    id: match.id,
    date: match.date,
    durationMin: match.durationMin,
    location: match.location,
    notes: match.notes,
    locked: match.locked,
    teamCount: match.teamCount,
    attendees,
    declined,
    waitlist,
    replacements,
    waitlistOverflow,
    pendingAbos,
    aboTotal: activeAbos.length,
    hasTeams: match.teams.length > 0,
  };
}

export type MyMatchSignup = {
  status: SignupStatus;
  paymentStatus: PaymentStatus;
};

export function findMySignup(
  view: MatchView,
  playerId: string | null,
): (Signup & { player: Player }) | null {
  if (!playerId) return null;
  const all = [...view.attendees, ...view.declined, ...view.waitlist];
  return all.find((s) => s.playerId === playerId) ?? null;
}

export type PlayerKindGroup = {
  abos: Player[];
  waitlisters: Player[];
};

export async function getActivePlayersGrouped(): Promise<PlayerKindGroup> {
  const players = await db.player.findMany({
    where: { active: true },
    orderBy: [{ kind: "asc" }, { rank: "asc" }, { lastName: "asc" }],
  });
  return {
    abos: players.filter((p) => p.kind === "ABO"),
    waitlisters: players.filter((p) => p.kind === "WAITLIST"),
  };
}

export type PaymentEntry = {
  signupId: string;
  matchId: string;
  matchDate: Date;
  status: "PENDING" | "CLAIMED" | "PAID";
  /** The waitlist player who replaced an abo. */
  waitlistPlayer: Player;
  /** The abo player whose slot is being taken. */
  aboPlayer: Player;
};

/**
 * Returns all replacement payments for which the given player is either
 * the waitlist replacement (owes) or the abo being replaced (is owed).
 * Only includes matches in the future or recent past.
 */
export async function getPaymentsForPlayer(playerId: string): Promise<{
  youOwe: PaymentEntry[];
  owedToYou: PaymentEntry[];
}> {
  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30); // last 30 days + future

  const matches = await db.match.findMany({
    where: { date: { gte: cutoff } },
    orderBy: { date: "asc" },
    include: {
      signups: {
        include: { player: true },
        orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  const youOwe: PaymentEntry[] = [];
  const owedToYou: PaymentEntry[] = [];

  for (const m of matches) {
    const declined = m.signups
      .filter((s) => s.status === "OUT" && s.player.kind === "ABO")
      .sort((a, b) => a.rank - b.rank);
    const waitlist = m.signups
      .filter((s) => s.status === "WAITLIST")
      .sort((a, b) => a.rank - b.rank);

    declined.forEach((out, idx) => {
      const wl = waitlist[idx];
      if (!wl) return;
      if (wl.paymentStatus !== "PENDING" && wl.paymentStatus !== "CLAIMED" && wl.paymentStatus !== "PAID") return;

      const entry: PaymentEntry = {
        signupId: wl.id,
        matchId: m.id,
        matchDate: m.date,
        status: wl.paymentStatus as PaymentEntry["status"],
        waitlistPlayer: wl.player,
        aboPlayer: out.player,
      };

      if (wl.playerId === playerId) youOwe.push(entry);
      if (out.playerId === playerId) owedToYou.push(entry);
    });
  }

  return { youOwe, owedToYou };
}

export async function getLockedMatchWithTeams() {
  const match = await db.match.findFirst({
    where: {
      locked: true,
      date: { gte: new Date(Date.now() - 1000 * 60 * 60 * 6) },
      teams: { some: {} },
    },
    orderBy: { date: "asc" },
    include: {
      teams: {
        orderBy: { color: "asc" },
        include: { slots: { include: { player: true } } },
      },
    },
  });
  return match;
}

export type { Player, PlayerKind, Signup, SignupStatus, PaymentStatus };
