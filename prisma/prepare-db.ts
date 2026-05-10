/**
 * Idempotent DB fixups that need to run BEFORE `prisma db push`.
 *
 * Why this exists: when we rename an enum value in schema.prisma, `db push`
 * does not perform an in-place rename — it tries to drop and recreate the
 * type, which fails if any column references the existing values. Postgres
 * supports `ALTER TYPE ... RENAME VALUE` natively, so we run that here first
 * and then let `db push` see an already-aligned schema.
 *
 * Add new fixups to `fixups` array. Each is wrapped in try/catch and is safe
 * to run multiple times.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type Fixup = { name: string; sql: string };

const fixups: Fixup[] = [
  {
    name: 'rename PlayerKind value SUBSCRIBER -> ABO',
    sql: `ALTER TYPE "PlayerKind" RENAME VALUE 'SUBSCRIBER' TO 'ABO'`,
  },
];

async function run() {
  for (const fix of fixups) {
    try {
      await db.$executeRawUnsafe(fix.sql);
      console.log(`→ applied: ${fix.name}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`→ skipped (${fix.name}): ${msg.split("\n")[0]}`);
    }
  }
}

run()
  .catch((e) => {
    console.error("prepare-db error", e);
    // Never block boot on prep failures.
    process.exit(0);
  })
  .finally(() => db.$disconnect());
