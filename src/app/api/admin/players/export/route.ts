import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    await requireAdmin();

    const players = await db.player.findMany({
        orderBy: [{ kind: "asc" }, { rank: "asc" }, { lastName: "asc" }],
    });

    const header = [
        "Name",
        "Type",
        "Rank",
        "Position",
        "Overall",
        "Technique",
        "Speed",
        "Stamina",
        "Defense",
        "Offense",
        "Passing",
        "Shooting",
        "Goalkeeping",
        "Active",
    ].join(";");

    const rows = players.map((p) =>
        [
            `${p.firstName} ${p.lastName ?? ""}`.trim(),
            p.kind,
            p.rank,
            p.position,
            p.overall,
            p.technique,
            p.speed,
            p.stamina,
            p.defense,
            p.offense,
            p.passing,
            p.shooting,
            p.goalkeeping,
            p.active ? "Yes" : "No",
        ].join(";"),
    );

    const bom = "﻿";
    const csv = bom + [header, ...rows].join("\r\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="veteranos-players-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
    });
}
