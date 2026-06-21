import { describe, expect, it, vi } from "vitest";

// team-generator.ts pulls in "server-only" and the Prisma db client at import
// time; neither is resolvable / wanted in the node test env. The functions
// under test are pure and never touch the db, so empty mocks are enough.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));

import { draftTeams, refineSwaps, balanceCost, targetSizes } from "@/server/team-generator";
import type { Player } from "@prisma/client";

function mkPlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    userId: null,
    firstName: id,
    lastName: null,
    nickname: null,
    avatarUrl: null,
    kind: "ABO",
    rank: 0,
    paypalName: null,
    paypalLink: null,
    phone: null,
    notes: null,
    overall: 50,
    technique: 50,
    speed: 50,
    stamina: 50,
    defense: 50,
    offense: 50,
    passing: 50,
    shooting: 50,
    goalkeeping: 20,
    position: "ANY",
    active: true,
    clubSlug: null,
    lastPlayedAt: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

/** A pool of `total` players with `gkCount` goalkeepers and varied, tiered skills. */
function makePool(total: number, gkCount: number): Player[] {
  return Array.from({ length: total }, (_, i) =>
    mkPlayer(`p${i}`, {
      overall: 80 - (i % 5) * 10, // tiers at 80/70/60/50/40
      defense: 40 + ((i * 7) % 41),
      offense: 40 + ((i * 13) % 41),
      speed: 40 + ((i * 5) % 41),
      position: i < gkCount ? "GOALKEEPER" : "ANY",
      goalkeeping: i < gkCount ? 85 : 20,
    }),
  );
}

type Team = ReturnType<typeof draftTeams>[number];

const sortedSizes = (teams: Team[]) => teams.map((t) => t.players.length).sort((a, b) => a - b);
const keeperCount = (t: Team) =>
  t.players.filter((p) => p.position === "GOALKEEPER" || p.goalkeeping >= 70).length;
const signature = (teams: Team[]) =>
  teams
    .map((t) => `${t.color}:${t.players.map((p) => p.id).sort().join(",")}`)
    .sort()
    .join("|");

describe("targetSizes", () => {
  it("spreads the remainder one-per-team, never differing by more than one", () => {
    expect(targetSizes(15, 3)).toEqual([5, 5, 5]);
    expect(targetSizes(16, 3)).toEqual([6, 5, 5]); // never [6, 5, 4]
    expect(targetSizes(17, 3)).toEqual([6, 6, 5]);
    expect(targetSizes(20, 4)).toEqual([5, 5, 5, 5]);
    expect(targetSizes(22, 4)).toEqual([6, 6, 5, 5]);
  });
});

describe("draftTeams — size invariant (the 6/5/4 regression)", () => {
  // The exact reported bug: 15 players, 3 teams, with goalkeepers in the pool.
  it.each([0, 1, 2, 3])("15 players / 3 teams with %i keeper(s) -> 5/5/5", (gkCount) => {
    const pool = makePool(15, gkCount);
    for (const seed of [1, 2, 3, 7, 42]) {
      const teams = draftTeams(pool, 3, seed);
      expect(sortedSizes(teams)).toEqual([5, 5, 5]);
    }
  });

  it("20 players / 4 teams with 2 keepers -> 5/5/5/5", () => {
    const teams = draftTeams(makePool(20, 2), 4, 99);
    expect(sortedSizes(teams)).toEqual([5, 5, 5, 5]);
  });

  it("uneven pool stays balanced (16 / 3 -> 6/5/5, never 6/5/4)", () => {
    const teams = draftTeams(makePool(16, 1), 3, 5);
    expect(sortedSizes(teams)).toEqual([5, 5, 6]);
  });

  it("drafts every player exactly once (no loss, no duplicate)", () => {
    const pool = makePool(15, 2);
    const ids = draftTeams(pool, 3, 11).flatMap((t) => t.players.map((p) => p.id));
    expect(ids).toHaveLength(15);
    expect(new Set(ids).size).toBe(15);
  });
});

describe("draftTeams — goalkeeper distribution", () => {
  it.each([1, 2, 3])("spreads %i keeper(s) onto distinct teams, none doubled up", (gkCount) => {
    const teams = draftTeams(makePool(15, gkCount), 3, 4);
    const teamsWithKeeper = teams.filter((t) => keeperCount(t) >= 1).length;
    expect(teamsWithKeeper).toBe(gkCount); // each keeper on its own team
    expect(Math.max(...teams.map(keeperCount))).toBe(1); // no team has two
  });
});

describe("draftTeams — variety vs reproducibility", () => {
  it("produces different teams across different seeds", () => {
    const pool = makePool(15, 1);
    const sigs = new Set([1, 2, 3, 4, 5].map((s) => signature(draftTeams(pool, 3, s))));
    expect(sigs.size).toBeGreaterThan(1); // not frozen into one layout
  });

  it("is reproducible for a fixed seed", () => {
    const pool = makePool(15, 1);
    expect(signature(draftTeams(pool, 3, 42))).toBe(signature(draftTeams(pool, 3, 42)));
  });
});

describe("refineSwaps", () => {
  it("never changes team sizes (1-for-1 swaps only)", () => {
    const initial = draftTeams(makePool(15, 1), 3, 8);
    const refined = refineSwaps(initial, 800, 8);
    expect(sortedSizes(refined)).toEqual([5, 5, 5]);
  });

  it("never worsens balance", () => {
    const initial = draftTeams(makePool(15, 2), 3, 3);
    const refined = refineSwaps(initial, 800, 3);
    expect(balanceCost(refined)).toBeLessThanOrEqual(balanceCost(initial) + 1e-9);
  });
});
