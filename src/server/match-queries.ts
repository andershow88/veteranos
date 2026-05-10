import "server-only";
import { db } from "@/lib/db";
import type { Player, PlayerKind, Signup, SignupStatus, PaymentStatus } from "@prisma/client";

export type MatchSlot = {
  signup: Signup & { player: Player };
};

export type ReplacementInfo = {
  /** Abo-Spieler, der abgesagt hat */
  subscriber: Player;
  /** Wartelisten-Spieler, der nachrückt (oder null, falls keiner verfügbar) */
  replacement: (Signup & { player: Player }) | null;
  /** Original-Signup des Abo-Spielers (mit OUT-Status) */
  outSignup: Signup;
  /** Zahlungsstatus zwischen Wartelisten-Spieler und Abo-Spieler */
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

  /** Alle aktiven Abo-Spieler, die teilnehmen (IN-Status) */
  attendees: Array<Signup & { player: Player }>;
  /** Abo-Spieler, die abgesagt haben (OUT-Status), sortiert nach rank */
  declined: Array<Signup & { player: Player }>;
  /** Wartelisten-Spieler, die sich für diesen Termin eingetragen haben */
  waitlist: Array<Signup & { player: Player }>;

  /** Berechnete Nachrück-Zuordnung */
  replacements: ReplacementInfo[];
  /** Wartelisten-Spieler, die NICHT nachrücken (überzählig) */
  waitlistOverflow: Array<Signup & { player: Player }>;

  hasTeams: boolean;
};

/**
 * Liefert die berechnete Sicht auf einen Termin – inkl. Nachrücker-Zuordnung
 * gemäß strikter Reihenfolge: Wartelisten-Spieler 1 → erster abgesagter Abo-Spieler usw.
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

  return composeMatchView(match);
}

export async function listUpcomingMatches(): Promise<MatchView[]> {
  const matches = await db.match.findMany({
    where: { date: { gte: new Date(Date.now() - 1000 * 60 * 60 * 6) } }, // bis 6h nach Start zählt noch als "kommend"
    orderBy: { date: "asc" },
    include: {
      signups: {
        include: { player: true },
        orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
      },
      teams: { select: { id: true } },
    },
  });
  return matches.map(composeMatchView);
}

export async function listPastMatches(limit = 20): Promise<MatchView[]> {
  const matches = await db.match.findMany({
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
  });
  return matches.map(composeMatchView);
}

function composeMatchView(match: {
  id: string;
  date: Date;
  durationMin: number;
  location: string | null;
  notes: string | null;
  locked: boolean;
  teamCount: number;
  signups: Array<Signup & { player: Player }>;
  teams: Array<{ id: string }>;
}): MatchView {
  const attendees = match.signups
    .filter((s) => s.status === "IN" && s.player.kind === "SUBSCRIBER")
    .sort((a, b) => a.player.rank - b.player.rank || a.rank - b.rank);

  const declined = match.signups
    .filter((s) => s.status === "OUT" && s.player.kind === "SUBSCRIBER")
    .sort((a, b) => a.player.rank - b.player.rank || a.rank - b.rank);

  const waitlist = match.signups
    .filter((s) => s.status === "WAITLIST")
    .sort((a, b) => a.rank - b.rank || a.player.rank - b.player.rank);

  // Reihenfolge der Wartelisten-Spieler: erster der Liste rückt für ersten abgesagten Abo nach
  const replacements: ReplacementInfo[] = declined.map((out, idx) => {
    const replacement = waitlist[idx] ?? null;
    return {
      subscriber: out.player,
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
  subscribers: Player[];
  waitlisters: Player[];
};

export async function getActivePlayersGrouped(): Promise<PlayerKindGroup> {
  const players = await db.player.findMany({
    where: { active: true },
    orderBy: [{ kind: "asc" }, { rank: "asc" }, { lastName: "asc" }],
  });
  return {
    subscribers: players.filter((p) => p.kind === "SUBSCRIBER"),
    waitlisters: players.filter((p) => p.kind === "WAITLIST"),
  };
}

export type { Player, PlayerKind, Signup, SignupStatus, PaymentStatus };
