import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PlayersAdmin, type PlayerRow } from "@/components/admin/players-admin";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const players = await db.player.findMany({
    orderBy: [{ kind: "asc" }, { rank: "asc" }, { lastName: "asc" }],
    include: { user: { select: { email: true } } },
  });

  const rows: PlayerRow[] = players.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    nickname: p.nickname,
    avatarUrl: p.avatarUrl,
    kind: p.kind,
    active: p.active,
    rank: p.rank,
    overall: p.overall,
    email: p.user?.email ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl tracking-wide">Players</h2>
        <div className="flex items-center gap-2">
          <a href="/api/admin/players/export" download>
            <Button variant="secondary">
              <Download className="h-4 w-4" /> CSV Export
            </Button>
          </a>
          <Link href="/admin/players/new">
            <Button>
              <Plus className="h-4 w-4" /> New player
            </Button>
          </Link>
        </div>
      </div>

      <PlayersAdmin players={rows} />
    </div>
  );
}
