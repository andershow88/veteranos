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

export function balanceCost(teams: TeamDraft[]) {
  const stats = teams.map(teamStats);
  const overallSpread = spread(stats.map((s) => s.overall));
  const defSpread = spread(stats.map((s) => s.defense));
  const offSpread = spread(stats.map((s) => s.offense));
  const speedSpread = spread(stats.map((s) => s.speed));
  // Higher weight on overall, lower weights on individual skills.
  return overallSpread * 3 + defSpread + offSpread + speedSpread * 0.5;
}

/** Single source of truth for "counts as a keeper" — used by the draft, the
 * refiner and the showcase so they can never disagree about who is a goalie. */
const isKeeper = (p: Player) =>
  p.position === "GOALKEEPER" || p.goalkeeping >= 70;

/** Tiny seeded PRNG (mulberry32). A fixed seed makes a draft reproducible
 * (used by the tests); a fresh seed per regenerate gives variety. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rnd: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/** Hard size contract: every team gets `floor(total / teamCount)` players, and
 * the first `total % teamCount` teams get one extra. 15/3 -> [5,5,5],
 * 16/3 -> [6,5,5] — sizes can never differ by more than one (no more 6/5/4). */
export function targetSizes(total: number, teamCount: number): number[] {
  const base = Math.floor(total / teamCount);
  const rem = total % teamCount;
  return Array.from({ length: teamCount }, (_, i) => base + (i < rem ? 1 : 0));
}

/** Sort strong -> weak, but shuffle players whose `overall` is within
 * `tierWidth` of each other. Keeps the strength spread fair across teams while
 * randomising who-goes-where, so each regenerate yields different fair teams. */
function tieredOrder(players: Player[], rnd: () => number, tierWidth = 5): Player[] {
  const sorted = [...players].sort((a, b) => b.overall - a.overall);
  const out: Player[] = [];
  let i = 0;
  while (i < sorted.length) {
    const top = sorted[i].overall;
    let j = i;
    while (j < sorted.length && top - sorted[j].overall < tierWidth) j++;
    const tier = sorted.slice(i, j);
    shuffleInPlace(tier, rnd);
    out.push(...tier);
    i = j;
  }
  return out;
}

/**
 * Size-locked draft. Goalkeepers and field players are dealt through ONE shared
 * seat counter with hard per-team caps (`targetSizes`), so team sizes always
 * differ by at most one — 5/5/5, 6/5/5, never 6/5/4 — for ANY goalkeeper count.
 * Within those caps a tiered shuffle keeps teams balanced by skill while making
 * each regenerate produce different (but equally fair) teams.
 */
export function draftTeams(
  players: Player[],
  teamCount: number,
  seed?: number,
): TeamDraft[] {
  const rnd = mulberry32(seed ?? Date.now());

  const teams: TeamDraft[] = TEAM_COLORS.slice(0, teamCount).map((c) => ({
    color: c,
    name: TEAM_NAMES[c],
    players: [],
  }));
  const caps = targetSizes(players.length, teamCount);
  const allTeams = teams.map((_, i) => i);

  // Pick the team furthest below its cap; random tie-break for variety.
  // Returns -1 if every eligible team is already at its cap.
  function nextSeat(eligible: number[]): number {
    const order = [...eligible];
    shuffleInPlace(order, rnd);
    let best = -1;
    let bestDeficit = 0;
    for (const t of order) {
      const deficit = caps[t] - teams[t].players.length;
      if (deficit > bestDeficit) {
        bestDeficit = deficit;
        best = t;
      }
    }
    return best;
  }

  // Goalkeepers first, but THROUGH the shared seat counter so their seats are
  // counted (this is the actual fix for 6/5/4). Prefer a team that has no
  // keeper yet so keepers spread out before any team gets a second one.
  const keepers = players.filter(isKeeper).sort((a, b) => b.goalkeeping - a.goalkeeping);
  const hasKeeper = new Set<number>();
  for (const gk of keepers) {
    const open = allTeams.filter((t) => teams[t].players.length < caps[t]);
    if (open.length === 0) break; // no seats left (only if keepers > players)
    const preferred = open.filter((t) => !hasKeeper.has(t));
    const target = nextSeat(preferred.length ? preferred : open);
    teams[target].players.push(gk);
    hasKeeper.add(target);
  }

  // Remaining field players, tiered-shuffled, into the remaining seats. The caps
  // guarantee the final sizes equal targetSizes() exactly.
  const drafted = new Set(keepers);
  const field = tieredOrder(players.filter((p) => !drafted.has(p)), rnd);
  for (const p of field) {
    teams[nextSeat(allTeams)].players.push(p);
  }

  return teams;
}

/**
 * Local optimization: random 1-for-1 player swaps between two teams. A swap is
 * accepted as long as it does not WORSEN balance (`newCost <= cost`); accepting
 * equal-cost swaps lets evenly-matched players keep moving around on regenerate
 * instead of freezing in place, while balance can still never get worse.
 * Swaps are 1-for-1, so team sizes are never changed here.
 */
export function refineSwaps(
  teams: TeamDraft[],
  iterations = 800,
  seed?: number,
): TeamDraft[] {
  const rnd = mulberry32(seed ?? Date.now());
  const current = teams.map((t) => ({ ...t, players: [...t.players] }));
  let cost = balanceCost(current);

  for (let i = 0; i < iterations; i++) {
    const a = Math.floor(rnd() * current.length);
    let b = Math.floor(rnd() * current.length);
    if (current.length > 1) while (b === a) b = Math.floor(rnd() * current.length);
    if (current[a].players.length === 0 || current[b].players.length === 0) continue;

    const ia = Math.floor(rnd() * current[a].players.length);
    const ib = Math.floor(rnd() * current[b].players.length);

    const pa = current[a].players[ia];
    const pb = current[b].players[ib];

    // Don't swap goalies if it leaves a team without one
    const isPaKeeper = isKeeper(pa);
    const isPbKeeper = isKeeper(pb);
    if (isPaKeeper !== isPbKeeper) {
      const teamAHasOtherKeeper = current[a].players.some(
        (p, idx) => idx !== ia && isKeeper(p),
      );
      const teamBHasOtherKeeper = current[b].players.some(
        (p, idx) => idx !== ib && isKeeper(p),
      );
      // A lone keeper stays put on purpose — never strand a team without one.
      if (isPaKeeper && !teamAHasOtherKeeper) continue;
      if (isPbKeeper && !teamBHasOtherKeeper) continue;
    }

    current[a].players[ia] = pb;
    current[b].players[ib] = pa;

    const newCost = balanceCost(current);
    if (newCost <= cost) {
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

  const gks = team.players.filter(isKeeper);

  const traits: string[] = [];
  if (isBestDef && isBestOff) traits.push("complete package");
  else if (isBestDef) traits.push("defensively rock-solid");
  else if (isBestOff) traits.push("dangerous up front");
  if (isBestSpeed) traits.push("turbo-fast");
  if (isBestTech) traits.push("technically gifted");
  if (gks.length === 0) traits.push("no proper keeper");

  const phrases = [
    `OVR ${overall}/100 — ${traits.length ? traits.join(", ") : "balanced across the board"}.`,
    isBestOff && isBestDef
      ? "Whoever beats this lot earns it. Favorites tag stamped on."
      : isBestOff
      ? "May leak goals at the back, but the attack is on fire."
      : isBestDef
      ? "Built like a fortress. Get past them first, then talk."
      : isBestSpeed
      ? "If it turns into a foot race, these guys win it."
      : "The team with character — could be today's surprise.",
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
  if (cost < 5) return "Perfectly balanced — anyone can win this.";
  if (cost < 12) return "Very even teams — should be tight.";
  if (cost < 22) return "Solid balance, slight edge possible.";
  return "A bit uneven — one team looks stronger. Consider swapping.";
}

/** Number of players we want per team in the default selection (5 per side). */
const PLAYERS_PER_TEAM = 5;

export type GenerateTeamsOptions = {
  /** If true, include every IN abo + every waitlist signup, regardless of the
   * standard 5×teamCount limit. Extras stretch the teams (e.g. 6 vs 6 vs 6
   * instead of 5 vs 5 vs 5). */
  useAllPlayers?: boolean;
  /** Player ids the admin explicitly excluded from this generation. They
   * stay signed up for the match but are not drafted onto a team. */
  excludePlayerIds?: string[];
};

/** Reads the participating players of a match and generates balanced teams.
 *
 * Selection logic:
 *  1. All IN abos in player-rank order (abos always have priority).
 *  2. Waitlist signups in waitlist-rank order, filling the remaining seats.
 *  3. Truncate to `teamCount * PLAYERS_PER_TEAM` unless `useAllPlayers` is set.
 */
export async function generateTeamsForMatch(
  matchId: string,
  options: GenerateTeamsOptions = {},
) {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      signups: {
        include: { player: true },
        orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!match) throw new Error("Match not found");

  const excluded = new Set(options.excludePlayerIds ?? []);

  const ins = match.signups
    .filter((s) => s.status === "IN" && s.player.kind === "ABO")
    .sort((a, b) => a.player.rank - b.player.rank || a.rank - b.rank);

  const waitlist = match.signups
    .filter((s) => s.status === "WAITLIST")
    .sort((a, b) => a.rank - b.rank || a.player.rank - b.player.rank);

  const pool: Player[] = [
    ...ins.map((s) => s.player),
    ...waitlist.map((s) => s.player),
  ].filter((p) => !excluded.has(p.id));

  const teamCount = Math.max(2, Math.min(4, match.teamCount));
  const standardLimit = teamCount * PLAYERS_PER_TEAM;
  const limit = options.useAllPlayers ? pool.length : Math.min(standardLimit, pool.length);

  const playing = pool.slice(0, limit);

  if (playing.length < teamCount * 2) {
    throw new Error(
      `At least ${teamCount * 2} players required, currently ${playing.length}.`,
    );
  }

  // Fresh seed each regenerate -> different (but equally fair) teams every time.
  const seed = (Date.now() ^ ((Math.random() * 2 ** 31) | 0)) | 0;
  const initial = draftTeams(playing, teamCount, seed);
  const optimized = refineSwaps(initial, 800, seed ^ 0x9e3779b9);

  const verdict = balanceVerdict(optimized);

  // Persist atomically: drop old teams AND create fresh ones in one
  // transaction, so a failure can't leave the match without any teams.
  await db.$transaction(async (tx) => {
    await tx.team.deleteMany({ where: { matchId } });
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

export { TEAM_PALETTE } from "@/lib/team-palette";
