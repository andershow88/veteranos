import "server-only";
import { db } from "@/lib/db";
import type { Player, Position, TeamColor } from "@prisma/client";

const TEAM_COLORS: TeamColor[] = ["BLUE", "RED", "WHITE", "BLACK"];
const TEAM_NAMES: Record<TeamColor, string> = {
  BLUE: "Team Blue",
  RED: "Team Red",
  WHITE: "Team White",
  BLACK: "Team Black",
};

type TeamDraft = {
  color: TeamColor;
  name: string;
  players: Player[];
};

type Stats = {
  overall: number;
  defense: number;
  offense: number;
  speed: number;
  technique: number;
  passing: number;
  shooting: number;
  stamina: number;
};

function avg<T>(arr: T[], pick: (t: T) => number) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, x) => s + pick(x), 0) / arr.length;
}

function teamStats(team: TeamDraft): Stats {
  return {
    overall: avg(team.players, (p) => p.overall),
    defense: avg(team.players, (p) => p.defense),
    offense: avg(team.players, (p) => p.offense),
    speed: avg(team.players, (p) => p.speed),
    technique: avg(team.players, (p) => p.technique),
    passing: avg(team.players, (p) => p.passing),
    shooting: avg(team.players, (p) => p.shooting),
    stamina: avg(team.players, (p) => p.stamina),
  };
}

function spread(values: number[]) {
  if (values.length === 0) return 0;
  const max = Math.max(...values);
  const min = Math.min(...values);
  return max - min;
}

function balanceCost(teams: TeamDraft[]) {
  const stats = teams.map(teamStats);
  const overallSpread = spread(stats.map((s) => s.overall));
  const defSpread = spread(stats.map((s) => s.defense));
  const offSpread = spread(stats.map((s) => s.offense));
  const speedSpread = spread(stats.map((s) => s.speed));
  // Größerer Wert für Overall, kleinere Gewichte für Detail-Skills.
  return overallSpread * 3 + defSpread + offSpread + speedSpread * 0.5;
}

/**
 * Snake-Draft: Spieler nach Overall sortieren, in Reihenfolge austeilen,
 * Richtung pro Runde umkehren. Liefert grob ausgeglichene Teams.
 */
function snakeDraft(players: Player[], teamCount: number): TeamDraft[] {
  const teams: TeamDraft[] = TEAM_COLORS.slice(0, teamCount).map((c) => ({
    color: c,
    name: TEAM_NAMES[c],
    players: [],
  }));

  // Torhüter zuerst gleichmäßig verteilen
  const goalkeepers = players
    .filter((p) => p.position === "GOALKEEPER" || p.goalkeeping >= 70)
    .sort((a, b) => b.goalkeeping - a.goalkeeping);
  const fieldPlayers = players
    .filter((p) => !goalkeepers.includes(p))
    .sort((a, b) => b.overall - a.overall);

  goalkeepers.forEach((gk, idx) => {
    teams[idx % teamCount].players.push(gk);
  });

  // Snake draft
  let dir = 1;
  let teamIdx = 0;
  for (const p of fieldPlayers) {
    teams[teamIdx].players.push(p);
    if (dir === 1) {
      if (teamIdx === teamCount - 1) {
        dir = -1;
      } else {
        teamIdx++;
      }
    } else {
      if (teamIdx === 0) {
        dir = 1;
      } else {
        teamIdx--;
      }
    }
  }

  return teams;
}

/**
 * Lokale Optimierung: zufällige Spieler-Tausche zwischen zwei Teams,
 * nur akzeptiert, wenn Balance-Kosten sinken. Schnell & robust.
 */
function refineSwaps(teams: TeamDraft[], iterations = 800): TeamDraft[] {
  const current = teams.map((t) => ({ ...t, players: [...t.players] }));
  let cost = balanceCost(current);

  for (let i = 0; i < iterations; i++) {
    const a = Math.floor(Math.random() * current.length);
    let b = Math.floor(Math.random() * current.length);
    if (current.length > 1) while (b === a) b = Math.floor(Math.random() * current.length);
    if (current[a].players.length === 0 || current[b].players.length === 0) continue;

    const ia = Math.floor(Math.random() * current[a].players.length);
    const ib = Math.floor(Math.random() * current[b].players.length);

    const pa = current[a].players[ia];
    const pb = current[b].players[ib];

    // Goalies nicht tauschen, wenn dadurch ein Team keinen Keeper mehr hat
    const isPaKeeper = pa.position === "GOALKEEPER" || pa.goalkeeping >= 70;
    const isPbKeeper = pb.position === "GOALKEEPER" || pb.goalkeeping >= 70;
    if (isPaKeeper !== isPbKeeper) {
      const teamAHasOtherKeeper = current[a].players.some(
        (p, idx) => idx !== ia && (p.position === "GOALKEEPER" || p.goalkeeping >= 70),
      );
      const teamBHasOtherKeeper = current[b].players.some(
        (p, idx) => idx !== ib && (p.position === "GOALKEEPER" || p.goalkeeping >= 70),
      );
      if (isPaKeeper && !teamAHasOtherKeeper) continue;
      if (isPbKeeper && !teamBHasOtherKeeper) continue;
    }

    current[a].players[ia] = pb;
    current[b].players[ib] = pa;

    const newCost = balanceCost(current);
    if (newCost < cost) {
      cost = newCost;
    } else {
      current[a].players[ia] = pa;
      current[b].players[ib] = pb;
    }
  }

  return current;
}

function describeTeam(team: TeamDraft, all: TeamDraft[]) {
  const s = teamStats(team);
  const overall = Math.round(s.overall);
  const defs = all.map((t) => teamStats(t).defense);
  const offs = all.map((t) => teamStats(t).offense);
  const speeds = all.map((t) => teamStats(t).speed);
  const techs = all.map((t) => teamStats(t).technique);

  const isBestDef = s.defense >= Math.max(...defs);
  const isBestOff = s.offense >= Math.max(...offs);
  const isBestSpeed = s.speed >= Math.max(...speeds);
  const isBestTech = s.technique >= Math.max(...techs);

  const gks = team.players.filter((p) => p.position === "GOALKEEPER" || p.goalkeeping >= 70);

  const traits: string[] = [];
  if (isBestDef && isBestOff) traits.push("komplettes Paket");
  else if (isBestDef) traits.push("defensiv stabil");
  else if (isBestOff) traits.push("offensiv brandgefährlich");
  if (isBestSpeed) traits.push("turbo-schnell");
  if (isBestTech) traits.push("technisch verspielt");
  if (gks.length === 0) traits.push("ohne festen Keeper");

  const phrases = [
    `Stärke ${overall}/100 – ${traits.length ? traits.join(", ") : "ausgeglichen aufgestellt"}.`,
    isBestOff && isBestDef
      ? "Wer hier durchkommt, hat es verdient. Favoritenrolle!"
      : isBestOff
      ? "Hinten wackelt es vielleicht, aber vorne brennt die Hütte."
      : isBestDef
      ? "Festung Marke Eigenbau. Erst durchkommen, dann reden."
      : isBestSpeed
      ? "Wenn es schnell geht, sind sie zuerst da."
      : "Das Team mit Charakter – könnte heute überraschen.",
  ];

  return {
    avgOverall: s.overall,
    avgDefense: s.defense,
    avgOffense: s.offense,
    avgSpeed: s.speed,
    comment: phrases.join(" "),
  };
}

function balanceVerdict(teams: TeamDraft[]) {
  const cost = balanceCost(teams);
  if (cost < 5) return "🔥 Diese Teams sind bombenausgeglichen. Kann jeder gewinnen.";
  if (cost < 12) return "👌 Sehr ausgewogene Teams – wird ein enges Ding.";
  if (cost < 22) return "🤝 Solide Balance, kleine Vorteile für ein Team möglich.";
  return "⚠️ Etwas unausgewogen – ein Team wirkt deutlich stärker. Vielleicht tauschen?";
}

/** Liest die teilnehmenden Spieler eines Termins und generiert balancierte Teams. */
export async function generateTeamsForMatch(matchId: string) {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      signups: {
        include: { player: true },
        orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!match) throw new Error("Termin nicht gefunden");

  // Aktive Teilnehmer = IN-Abo + Wartelisten-Nachrücker (für die ersten N OUTs)
  const ins = match.signups.filter((s) => s.status === "IN" && s.player.kind === "SUBSCRIBER");
  const outs = match.signups.filter((s) => s.status === "OUT" && s.player.kind === "SUBSCRIBER");
  const waitlist = match.signups
    .filter((s) => s.status === "WAITLIST")
    .sort((a, b) => a.rank - b.rank);
  const replacements = waitlist.slice(0, outs.length);

  const playing: Player[] = [
    ...ins.map((s) => s.player),
    ...replacements.map((s) => s.player),
  ];

  const teamCount = Math.max(2, Math.min(4, match.teamCount));
  if (playing.length < teamCount * 2) {
    throw new Error(
      `Mindestens ${teamCount * 2} Spieler nötig, aktuell ${playing.length}.`,
    );
  }

  const initial = snakeDraft(playing, teamCount);
  const optimized = refineSwaps(initial);

  // Persistieren: alte Teams löschen, neue erstellen
  await db.team.deleteMany({ where: { matchId } });
  const verdict = balanceVerdict(optimized);

  await db.$transaction(async (tx) => {
    for (const t of optimized) {
      const meta = describeTeam(t, optimized);
      await tx.team.create({
        data: {
          matchId,
          color: t.color,
          name: t.name,
          avgOverall: meta.avgOverall,
          avgDefense: meta.avgDefense,
          avgOffense: meta.avgOffense,
          avgSpeed: meta.avgSpeed,
          comment: meta.comment,
          slots: {
            create: t.players.map((p) => ({
              playerId: p.id,
              position: pickPosition(p),
            })),
          },
        },
      });
    }
  });

  return { teamCount: optimized.length, verdict };
}

function pickPosition(p: Player): Position {
  if (p.position !== "ANY") return p.position;
  if (p.goalkeeping >= 70) return "GOALKEEPER";
  if (p.defense >= p.offense + 8) return "DEFENDER";
  if (p.offense >= p.defense + 8) return "STRIKER";
  return "MIDFIELDER";
}

export const TEAM_PALETTE: Record<TeamColor, { hex: string; chip: string; ring: string }> = {
  BLUE: {
    hex: "#2563eb",
    chip: "from-blue-400 to-blue-700",
    ring: "ring-blue-500/40",
  },
  RED: {
    hex: "#dc2626",
    chip: "from-red-400 to-red-700",
    ring: "ring-red-500/40",
  },
  WHITE: {
    hex: "#f1f5f9",
    chip: "from-slate-100 to-slate-400",
    ring: "ring-slate-200/40",
  },
  BLACK: {
    hex: "#111827",
    chip: "from-zinc-700 to-zinc-900",
    ring: "ring-zinc-500/40",
  },
};
