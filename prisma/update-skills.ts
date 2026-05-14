/**
 * Spieler-Skills aktualisieren.
 *
 * Aufruf:
 *   DATABASE_URL="postgresql://..." npx tsx prisma/update-skills.ts
 *
 * Matcht Spieler anhand firstName + lastName (case-insensitive,
 * Umlaute/Akzente werden beruecksichtigt). Gibt eine Zusammenfassung
 * aus: welche Spieler aktualisiert wurden und welche nicht gefunden.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type SkillUpdate = {
    name: string;
    overall: number;
    technique: number;
    speed: number;
    stamina: number;
    defense: number;
    offense: number;
    passing: number;
    shooting: number;
    goalkeeping: number;
};

const UPDATES: SkillUpdate[] = [
    { name: "Anderson Büttenbender",    overall: 70, technique: 70, speed: 60, stamina: 50, defense: 80, offense: 60, passing: 70, shooting: 60, goalkeeping: 20 },
    { name: "Anderson Dorow",           overall: 67, technique: 70, speed: 70, stamina: 60, defense: 60, offense: 70, passing: 70, shooting: 70, goalkeeping: 20 },
    { name: "Daniel de Castro",         overall: 67, technique: 70, speed: 60, stamina: 60, defense: 60, offense: 70, passing: 70, shooting: 70, goalkeeping: 20 },
    { name: "Eduardo Marron",           overall: 67, technique: 70, speed: 70, stamina: 70, defense: 70, offense: 60, passing: 70, shooting: 60, goalkeeping: 20 },
    { name: "Enrique Portela",          overall: 57, technique: 50, speed: 50, stamina: 50, defense: 70, offense: 50, passing: 50, shooting: 50, goalkeeping: 20 },
    { name: "Francesco Truono",         overall: 73, technique: 70, speed: 80, stamina: 80, defense: 80, offense: 70, passing: 70, shooting: 70, goalkeeping: 20 },
    { name: "Frederico Ferlini",        overall: 67, technique: 60, speed: 60, stamina: 60, defense: 80, offense: 60, passing: 60, shooting: 60, goalkeeping: 20 },
    { name: "Humberto B Felizzola",     overall: 63, technique: 70, speed: 60, stamina: 60, defense: 50, offense: 70, passing: 70, shooting: 70, goalkeeping: 20 },
    { name: "Jihad Hann",               overall: 70, technique: 70, speed: 90, stamina: 80, defense: 60, offense: 80, passing: 70, shooting: 80, goalkeeping: 20 },
    { name: "Lucas Caldi",              overall: 63, technique: 60, speed: 70, stamina: 70, defense: 70, offense: 60, passing: 60, shooting: 60, goalkeeping: 20 },
    { name: "Martin Brandstetter",      overall: 60, technique: 60, speed: 50, stamina: 50, defense: 60, offense: 60, passing: 60, shooting: 60, goalkeeping: 20 },
    { name: "Mohammad Enayat",          overall: 70, technique: 70, speed: 50, stamina: 50, defense: 60, offense: 80, passing: 70, shooting: 80, goalkeeping: 20 },
    { name: "Oberdan Lima Rosenstein",  overall: 70, technique: 70, speed: 70, stamina: 60, defense: 60, offense: 80, passing: 70, shooting: 80, goalkeeping: 20 },
    { name: "Pedro Dinhani",            overall: 67, technique: 70, speed: 80, stamina: 80, defense: 70, offense: 60, passing: 70, shooting: 60, goalkeeping: 20 },
    { name: "Rafael Carvalho",          overall: 63, technique: 60, speed: 60, stamina: 60, defense: 70, offense: 60, passing: 60, shooting: 60, goalkeeping: 20 },
    { name: "Vince Ro",                 overall: 63, technique: 70, speed: 70, stamina: 70, defense: 60, offense: 60, passing: 70, shooting: 60, goalkeeping: 20 },
    { name: "Vitor Braescher",          overall: 67, technique: 70, speed: 70, stamina: 70, defense: 60, offense: 70, passing: 70, shooting: 70, goalkeeping: 20 },
    { name: "Alessandro Terracciano",  overall: 53, technique: 50, speed: 60, stamina: 60, defense: 60, offense: 50, passing: 50, shooting: 50, goalkeeping: 20 },
    { name: "Tobias Brandstetter",     overall: 63, technique: 60, speed: 70, stamina: 70, defense: 70, offense: 60, passing: 60, shooting: 60, goalkeeping: 20 },
];

function normalize(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

async function main() {
    const allPlayers = await db.player.findMany({
        select: { id: true, firstName: true, lastName: true },
    });

    const updated: string[] = [];
    const notFound: string[] = [];

    for (const upd of UPDATES) {
        const parts = upd.name.split(" ");
        const inputFirst = parts[0];
        const inputLast = parts.slice(1).join(" ");
        const inputNorm = normalize(upd.name);

        // Match: normalized full name (firstName + " " + lastName)
        const match = allPlayers.find((p) => {
            const dbFull = normalize(`${p.firstName} ${p.lastName ?? ""}`.trim());
            return dbFull === inputNorm;
        });

        // Fallback: firstName match + lastName starts-with
        const fallback = !match
            ? allPlayers.find((p) => {
                  const dbFirst = normalize(p.firstName);
                  const dbLast = normalize(p.lastName ?? "");
                  const inFirst = normalize(inputFirst);
                  const inLast = normalize(inputLast);
                  return dbFirst === inFirst && (dbLast.startsWith(inLast) || inLast.startsWith(dbLast));
              })
            : null;

        const player = match ?? fallback;

        if (!player) {
            notFound.push(upd.name);
            continue;
        }

        await db.player.update({
            where: { id: player.id },
            data: {
                overall:     upd.overall,
                technique:   upd.technique,
                speed:       upd.speed,
                stamina:     upd.stamina,
                defense:     upd.defense,
                offense:     upd.offense,
                passing:     upd.passing,
                shooting:    upd.shooting,
                goalkeeping: upd.goalkeeping,
            },
        });

        updated.push(`${upd.name} → matched DB: "${player.firstName} ${player.lastName ?? ""}".trim()`);
    }

    console.log("\n=== Ergebnis ===\n");
    console.log(`✓ Aktualisiert: ${updated.length}`);
    for (const u of updated) console.log(`  ${u}`);
    if (notFound.length > 0) {
        console.log(`\n✗ Nicht gefunden: ${notFound.length}`);
        for (const n of notFound) console.log(`  ${n}`);
    }
    console.log(`\nGesamt: ${UPDATES.length} Einträge, ${updated.length} aktualisiert, ${notFound.length} übersprungen.\n`);
}

main()
    .catch((err) => {
        console.error("Fehler:", err);
        process.exit(1);
    })
    .finally(() => db.$disconnect());
