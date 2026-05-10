"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { generateTeamsForMatch } from "./team-generator";

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
  kind: z.enum(["SUBSCRIBER", "WAITLIST"]),
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
        if (existing) throw new Error("Email bereits in Verwendung");
        const passwordHash = await hashPassword(password);
        const user = await tx.user.create({
          data: { email: email.toLowerCase(), passwordHash, role: "PLAYER" },
        });
        userId = user.id;
      }
      await tx.player.create({ data: { ...playerData, userId } });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Konnte Spieler nicht anlegen" };
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
      if (!player) throw new Error("Spieler nicht gefunden");

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
    return { error: e instanceof Error ? e.message : "Konnte Spieler nicht speichern" };
  }

  revalidatePath("/admin/players");
  revalidatePath(`/admin/players/${playerId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deletePlayerAction(playerId: string) {
  await requireAdmin();
  const player = await db.player.findUnique({ where: { id: playerId } });
  if (!player) return;
  await db.$transaction(async (tx) => {
    if (player.userId) {
      await tx.user.delete({ where: { id: player.userId } });
    } else {
      await tx.player.delete({ where: { id: playerId } });
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
  if (Number.isNaN(dt.getTime())) return { error: "Ungültiges Datum" };

  const subs = await db.player.findMany({
    where: { kind: "SUBSCRIBER", active: true },
    orderBy: { rank: "asc" },
    select: { id: true, rank: true },
  });

  const match = await db.match.create({
    data: {
      date: dt,
      durationMin: parsed.data.durationMin,
      location: parsed.data.location || null,
      notes: parsed.data.notes || null,
      teamCount: parsed.data.teamCount,
      signups: {
        create: subs.map((s) => ({
          playerId: s.id,
          status: "IN",
          rank: s.rank,
        })),
      },
    },
  });

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
  if (Number.isNaN(dt.getTime())) return { error: "Ungültiges Datum" };

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

export async function generateTeamsAction(matchId: string) {
  await requireAdmin();
  await generateTeamsForMatch(matchId);
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
