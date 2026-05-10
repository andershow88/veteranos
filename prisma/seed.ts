/**
 * Seed script. Creates an admin user and (optionally) demo players + a demo match.
 *
 * Configure via env:
 *   ADMIN_EMAIL, ADMIN_PASSWORD       - admin credentials (required)
 *   SEED_DEMO_PLAYERS=true            - also seed 12 demo subscribers + 4 waitlisters + 1 match
 *
 * Run:
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@veteranos.local").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  console.log("Seeding admin user:", adminEmail);

  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
      console.log("→ existing user upgraded to ADMIN");
    } else {
      console.log("→ admin already exists, skipping");
    }
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await db.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        player: {
          create: {
            firstName: "Admin",
            lastName: "Veteranos",
            kind: "SUBSCRIBER",
            rank: 0,
            overall: 75,
            position: "ANY",
          },
        },
      },
    });
    console.log("→ admin created");
  }

  if (process.env.SEED_DEMO_PLAYERS === "true") {
    await seedDemoPlayers();
  }
}

async function seedDemoPlayers() {
  const subs = [
    ["Liam", "Walker", "MIDFIELDER", { overall: 78, technique: 82, speed: 70, defense: 60, offense: 80, passing: 85, shooting: 72 }],
    ["Marcus", "Reed", "GOALKEEPER", { overall: 75, technique: 60, speed: 55, defense: 70, offense: 30, passing: 70, shooting: 40, goalkeeping: 90 }],
    ["Felix", "Brooks", "DEFENDER", { overall: 74, technique: 65, speed: 72, defense: 85, offense: 50, passing: 70, shooting: 55 }],
    ["Jonah", "Carter", "STRIKER", { overall: 80, technique: 78, speed: 85, defense: 45, offense: 88, passing: 70, shooting: 87 }],
    ["David", "Hayes", "MIDFIELDER", { overall: 72, technique: 75, speed: 68, defense: 60, offense: 70, passing: 80, shooting: 65 }],
    ["Nick", "Klein", "DEFENDER", { overall: 70, technique: 60, speed: 65, defense: 80, offense: 45, passing: 65, shooting: 50 }],
    ["Tom", "Weaver", "STRIKER", { overall: 76, technique: 75, speed: 80, defense: 40, offense: 85, passing: 70, shooting: 82 }],
    ["Paul", "Fisher", "MIDFIELDER", { overall: 73, technique: 78, speed: 72, defense: 55, offense: 72, passing: 78, shooting: 70 }],
    ["Max", "Lang", "DEFENDER", { overall: 71, technique: 65, speed: 70, defense: 82, offense: 50, passing: 68, shooting: 55 }],
    ["Tim", "Schultz", "STRIKER", { overall: 77, technique: 76, speed: 82, defense: 42, offense: 86, passing: 68, shooting: 84 }],
    ["Ben", "Krieger", "MIDFIELDER", { overall: 74, technique: 80, speed: 70, defense: 58, offense: 74, passing: 82, shooting: 68 }],
    ["Leo", "Werner", "DEFENDER", { overall: 73, technique: 68, speed: 73, defense: 84, offense: 48, passing: 70, shooting: 55 }],
  ];
  const wl = [
    ["Joel", "Brand", "MIDFIELDER", { overall: 70 }],
    ["Kevin", "Lehman", "STRIKER", { overall: 71 }],
    ["Jacob", "Sawyer", "DEFENDER", { overall: 69 }],
    ["Luka", "Hartman", "MIDFIELDER", { overall: 72 }],
  ];

  let rank = 1;
  for (const [first, last, position, skills] of subs) {
    const p = skills as Record<string, number>;
    await db.player.upsert({
      where: { id: `seed-sub-${rank}` },
      create: {
        id: `seed-sub-${rank}`,
        firstName: first as string,
        lastName: last as string,
        position: position as never,
        kind: "SUBSCRIBER",
        rank,
        paypalLink: `https://paypal.me/${(first as string).toLowerCase()}`,
        paypalName: `${first} ${last}`,
        overall: p.overall ?? 70,
        technique: p.technique ?? 65,
        speed: p.speed ?? 65,
        stamina: p.stamina ?? 70,
        defense: p.defense ?? 60,
        offense: p.offense ?? 60,
        passing: p.passing ?? 65,
        shooting: p.shooting ?? 60,
        goalkeeping: p.goalkeeping ?? 25,
      },
      update: {},
    });
    rank++;
  }

  rank = 1;
  for (const [first, last, position, skills] of wl) {
    const p = skills as Record<string, number>;
    await db.player.upsert({
      where: { id: `seed-wl-${rank}` },
      create: {
        id: `seed-wl-${rank}`,
        firstName: first as string,
        lastName: last as string,
        position: position as never,
        kind: "WAITLIST",
        rank,
        overall: p.overall ?? 65,
      },
      update: {},
    });
    rank++;
  }

  console.log("→ demo players seeded");

  // Demo match in 5 days
  const inFiveDays = new Date();
  inFiveDays.setDate(inFiveDays.getDate() + 5);
  inFiveDays.setHours(20, 0, 0, 0);

  const existingMatch = await db.match.findFirst({
    where: { date: inFiveDays },
  });
  if (!existingMatch) {
    const subsAll = await db.player.findMany({
      where: { kind: "SUBSCRIBER", active: true },
      orderBy: { rank: "asc" },
      select: { id: true, rank: true },
    });
    await db.match.create({
      data: {
        date: inFiveDays,
        location: "Veteranos pitch",
        durationMin: 90,
        teamCount: 3,
        signups: {
          create: subsAll.map((s) => ({
            playerId: s.id,
            status: "IN",
            rank: s.rank,
          })),
        },
      },
    });
    console.log("→ demo match created");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
