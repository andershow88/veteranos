"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { generateTeamsForMatch } from "./team-generator";
import { sendPushToAll } from "@/lib/push";

const skillsSchema = {
  overall: z.coerce.number().int().min(0).max(100).default(50),
  technique: z.coerce.number().int().min(0).max(100).default(50),
  speed: z.coerce.number().int().min(0).max(100).default(50),
  stamina: z.coerce.number().int().min(0).max(100).default(50),
  defense: z.coerce.number().int().min(0).max(100).default(50),
  offense: z.coerce.number().int().min(0).max(100).default(50),
  passing: z.coerce.number().int().min(0).max(100).default(50),
  shooting: z.coerce.number().int().min(0).max(100).default(50),
  goalkeeping: z.coerce.number().int().min(0).max(100).default(20),
};

const playerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  nickname: z.string().optional().nullable(),
  kind: z.enum(["ABO", "WAITLIST"]),
  rank: z.coerce.number().int().min(0).default(0),
  paypalName: z.string().optional().nullable(),
  paypalLink: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  position: z.enum(["GOALKEEPER", "DEFENDER", "MIDFIELDER", "STRIKER", "ANY"]).default("ANY"),
  active: z.coerce.boolean().default(true),
  ...skillsSchema,
});

const accountSchema = z.object({
  email: z.string().email().optional().nullable().or(z.literal("")),
  password: z.string().min(6).optional().nullable().or(z.literal("")),
});

export type AdminFormState = { error?: string; ok?: boolean } | undefined;

function parseForm(formData: FormData) {
  const obj: Record<string, FormDataEntryValue | null> = {};
  for (const [k, v] of formData.entries()) obj[k] = v;
  obj.active = obj.active === "on" || obj.active === "true" ? "true" : "false";
  return obj;
}

export async function createPlayerAction(
  _: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const raw = parseForm(formData);
  const parsedPlayer = playerSchema.safeParse(raw);
  const parsedAccount = accountSchema.safeParse(raw);
  if (!parsedPlayer.success) return { error: parsedPlayer.error.issues[0].message };
  if (!parsedAccount.success) return { error: parsedAccount.error.issues[0].message };

  const playerData = {
    ...parsedPlayer.data,
    paypalLink: parsedPlayer.data.paypalLink || null,
  };
  const { email, password } = parsedAccount.data;

  try {
    await db.$transaction(async (tx) => {
      let userId: string | null = null;
      if (email && password) {
        const existing = await tx.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existing) throw new Error("Email already in use");
        const passwordHash = await hashPassword(password);
        const user = await tx.user.create({
          data: { email: email.toLowerCase(), passwordHash, role: "PLAYER" },
        });
        userId = user.id;
      }
      await tx.player.create({ data: { ...playerData, userId } });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create player" };
  }

  revalidatePath("/admin/players");
  revalidatePath("/");
  redirect("/admin/players");
}

export async function updatePlayerAction(
  playerId: string,
  _: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const raw = parseForm(formData);
  const parsedPlayer = playerSchema.safeParse(raw);
  const parsedAccount = accountSchema.safeParse(raw);
  if (!parsedPlayer.success) return { error: parsedPlayer.error.issues[0].message };
  if (!parsedAccount.success) return { error: parsedAccount.error.issues[0].message };

  const playerData = {
    ...parsedPlayer.data,
    paypalLink: parsedPlayer.data.paypalLink || null,
  };
  const { email, password } = parsedAccount.data;

  try {
    await db.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { id: playerId },
        include: { user: true },
      });
      if (!player) throw new Error("Player not found");

      let userId = player.userId;
      if (email && email.toLowerCase() !== player.user?.email) {
        if (player.userId) {
          await tx.user.update({
            where: { id: player.userId },
            data: { email: email.toLowerCase() },
          });
        } else {
          const passwordHash = await hashPassword(password || Math.random().toString(36).slice(2));
          const user = await tx.user.create({
            data: { email: email.toLowerCase(), passwordHash, role: "PLAYER" },
          });
          userId = user.id;
        }
      }
      if (password && player.userId) {
        await tx.user.update({
          where: { id: player.userId },
          data: { passwordHash: await hashPassword(password) },
        });
      }
      await tx.player.update({ where: { id: playerId }, data: { ...playerData, userId } });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save player" };
  }

  revalidatePath("/admin/players");
  revalidatePath(`/admin/players/${playerId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deletePlayerAction(playerId: string) {
  const session = await requireAdmin();
  const player = await db.player.findUnique({ where: { id: playerId } });
  if (!player) {
    revalidatePath("/admin/players");
    redirect("/admin/players");
  }

  // Block self-deletion to prevent admins from locking themselves out.
  if (player.userId && player.userId === session.userId) {
    throw new Error("You cannot delete your own account.");
  }

  // Player.userId uses onDelete: SetNull, so deleting the user does NOT
  // remove the player. We must delete the player record explicitly, and
  // also drop the user row when one is linked. Signups and TeamSlots
  // cascade via the Player relation.
  await db.$transaction(async (tx) => {
    await tx.player.delete({ where: { id: playerId } });
    if (player.userId) {
      await tx.user.delete({ where: { id: player.userId } });
    }
  });

  revalidatePath("/admin/players");
  revalidatePath("/");
  redirect("/admin/players");
}

const matchSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  durationMin: z.coerce.number().int().min(30).max(240).default(90),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  teamCount: z.coerce.number().int().min(2).max(4).default(2),
});

export async function createMatchAction(
  _: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = matchSchema.safeParse({
    date: formData.get("date"),
    time: formData.get("time"),
    durationMin: formData.get("durationMin"),
    location: formData.get("location"),
    notes: formData.get("notes"),
    teamCount: formData.get("teamCount"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const dt = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  if (Number.isNaN(dt.getTime())) return { error: "Invalid date" };

  // New matches start with an empty sign-up list. Every player must
  // actively confirm or decline themselves.
  const match = await db.match.create({
    data: {
      date: dt,
      durationMin: parsed.data.durationMin,
      location: parsed.data.location || null,
      notes: parsed.data.notes || null,
      teamCount: parsed.data.teamCount,
    },
  });

  const dateStr = dt.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
  sendPushToAll("⚽ New match!", `${dateStr} — Sign up now!`, `/matches/${match.id}`).catch(() => {});

  revalidatePath("/");
  revalidatePath("/admin/matches");
  redirect(`/admin/matches/${match.id}`);
}

export async function updateMatchAction(
  matchId: string,
  _: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = matchSchema.safeParse({
    date: formData.get("date"),
    time: formData.get("time"),
    durationMin: formData.get("durationMin"),
    location: formData.get("location"),
    notes: formData.get("notes"),
    teamCount: formData.get("teamCount"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const dt = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  if (Number.isNaN(dt.getTime())) return { error: "Invalid date" };

  await db.match.update({
    where: { id: matchId },
    data: {
      date: dt,
      durationMin: parsed.data.durationMin,
      location: parsed.data.location || null,
      notes: parsed.data.notes || null,
      teamCount: parsed.data.teamCount,
    },
  });

  const dateStr = dt.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
  sendPushToAll("📋 Match updated", `${dateStr} — details changed`, `/matches/${matchId}`).catch(() => {});

  revalidatePath("/");
  revalidatePath(`/admin/matches/${matchId}`);
  revalidatePath(`/matches/${matchId}`);
  return { ok: true };
}

export async function deleteMatchAction(matchId: string) {
  await requireAdmin();
  await db.match.delete({ where: { id: matchId } });
  revalidatePath("/");
  revalidatePath("/admin/matches");
  redirect("/admin/matches");
}

export async function generateTeamsAction(
  matchId: string,
  options: { useAllPlayers?: boolean; excludePlayerIds?: string[] } = {},
) {
  await requireAdmin();
  await generateTeamsForMatch(matchId, options);

  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath(`/admin/matches/${matchId}`);
}

export async function deleteTeamsAction(matchId: string) {
  await requireAdmin();
  await db.team.deleteMany({ where: { matchId } });
  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath(`/admin/matches/${matchId}`);
}

const quickSkillSchema = z.object({
  position: z.enum(["GOALKEEPER", "DEFENDER", "MIDFIELDER", "STRIKER", "ANY"]),
  overall: z.coerce.number().int().min(0).max(100),
  technique: z.coerce.number().int().min(0).max(100),
  speed: z.coerce.number().int().min(0).max(100),
  stamina: z.coerce.number().int().min(0).max(100),
  defense: z.coerce.number().int().min(0).max(100),
  offense: z.coerce.number().int().min(0).max(100),
  passing: z.coerce.number().int().min(0).max(100),
  shooting: z.coerce.number().int().min(0).max(100),
  goalkeeping: z.coerce.number().int().min(0).max(100),
});

export async function updatePlayerSkillsAction(
  playerId: string,
  data: z.infer<typeof quickSkillSchema>,
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const parsed = quickSkillSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.player.update({
    where: { id: playerId },
    data: parsed.data,
  });

  revalidatePath("/admin/skills");
  revalidatePath("/");
  return { ok: true };
}

export async function swapTeamPlayersAction(slotIdA: string, slotIdB: string) {
  await requireAdmin();

  const matchId = await db.$transaction(async (tx) => {
    // 1. Fetch both slots with team + player data
    const slotA = await tx.teamSlot.findUnique({
      where: { id: slotIdA },
      include: { team: true, player: true },
    });
    const slotB = await tx.teamSlot.findUnique({
      where: { id: slotIdB },
      include: { team: true, player: true },
    });

    if (!slotA || !slotB) throw new Error("Slot not found");
    if (slotA.teamId === slotB.teamId)
      throw new Error("Both slots belong to the same team");
    // Never swap across matches — would corrupt unrelated teams.
    if (slotA.team.matchId !== slotB.team.matchId)
      throw new Error("Slots belong to different matches");

    // 2. Determine new positions based on the swapped player
    const pickPos = (p: typeof slotA.player) => {
      if (p.position !== "ANY") return p.position;
      if (p.goalkeeping >= 70) return "GOALKEEPER" as const;
      if (p.defense >= p.offense + 8) return "DEFENDER" as const;
      if (p.offense >= p.defense + 8) return "STRIKER" as const;
      return "MIDFIELDER" as const;
    };

    const posForB = pickPos(slotA.player); // player A going to team B
    const posForA = pickPos(slotB.player); // player B going to team A

    // 3. Swap playerIds and update positions
    // Use a temp disconnect to avoid unique constraint conflicts
    await tx.teamSlot.update({
      where: { id: slotIdA },
      data: { playerId: slotB.playerId, position: posForA },
    });
    await tx.teamSlot.update({
      where: { id: slotIdB },
      data: { playerId: slotA.playerId, position: posForB },
    });

    // 4. Recalculate stats for both affected teams
    const matchId = slotA.team.matchId;
    const affectedTeamIds = [slotA.teamId, slotB.teamId];

    // Fetch all teams for the match (needed for comment generation)
    const allTeams = await tx.team.findMany({
      where: { matchId },
      include: { slots: { include: { player: true } } },
    });

    for (const teamId of affectedTeamIds) {
      const team = allTeams.find((t) => t.id === teamId);
      if (!team) continue;

      // Re-fetch fresh slots after swap
      const freshSlots = await tx.teamSlot.findMany({
        where: { teamId },
        include: { player: true },
      });
      const players = freshSlots.map((s) => s.player);

      const avgFn = (fn: (p: typeof players[0]) => number) =>
        players.length
          ? players.reduce((s, p) => s + fn(p), 0) / players.length
          : 0;

      const avgOverall = avgFn((p) => p.overall);
      const avgDefense = avgFn((p) => p.defense);
      const avgOffense = avgFn((p) => p.offense);
      const avgSpeed = avgFn((p) => p.speed);

      // Build comment: compare this team to all others
      const avgTechnique = avgFn((p) => p.technique);
      const allDefs = allTeams.map((t) => {
        if (t.id === teamId) return avgDefense;
        const ps = t.slots.map((s) => s.player);
        return ps.length ? ps.reduce((s, p) => s + p.defense, 0) / ps.length : 0;
      });
      const allOffs = allTeams.map((t) => {
        if (t.id === teamId) return avgOffense;
        const ps = t.slots.map((s) => s.player);
        return ps.length ? ps.reduce((s, p) => s + p.offense, 0) / ps.length : 0;
      });
      const allSpeeds = allTeams.map((t) => {
        if (t.id === teamId) return avgSpeed;
        const ps = t.slots.map((s) => s.player);
        return ps.length ? ps.reduce((s, p) => s + p.speed, 0) / ps.length : 0;
      });
      const allTechs = allTeams.map((t) => {
        if (t.id === teamId) return avgTechnique;
        const ps = t.slots.map((s) => s.player);
        return ps.length ? ps.reduce((s, p) => s + p.technique, 0) / ps.length : 0;
      });

      const isBestDef = avgDefense >= Math.max(...allDefs);
      const isBestOff = avgOffense >= Math.max(...allOffs);
      const isBestSpeed = avgSpeed >= Math.max(...allSpeeds);
      const isBestTech = avgTechnique >= Math.max(...allTechs);

      const traits: string[] = [];
      if (isBestDef && isBestOff) traits.push("complete package");
      else if (isBestDef) traits.push("defensively rock-solid");
      else if (isBestOff) traits.push("dangerous up front");
      if (isBestSpeed) traits.push("turbo-fast");
      if (isBestTech) traits.push("technically gifted");
      const gks = players.filter(
        (p) => p.position === "GOALKEEPER" || p.goalkeeping >= 70,
      );
      if (gks.length === 0) traits.push("no proper keeper");

      const ovr = Math.round(avgOverall);
      const phrases = [
        `OVR ${ovr}/100 — ${traits.length ? traits.join(", ") : "balanced across the board"}.`,
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

      await tx.team.update({
        where: { id: teamId },
        data: {
          avgOverall,
          avgDefense,
          avgOffense,
          avgSpeed,
          comment: phrases.join(" "),
        },
      });
    }

    return matchId;
  });

  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath(`/admin/matches/${matchId}`);
}
