import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const players = await db.player.findMany({
    orderBy: [{ kind: "asc" }, { rank: "asc" }, { lastName: "asc" }],
    include: { user: { select: { email: true } } },
  });
  const subs = players.filter((p) => p.kind === "ABO");
  const waitlist = players.filter((p) => p.kind === "WAITLIST");

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

      <PlayerListSection title="Subscribers" players={subs} tone="success" />
      <PlayerListSection title="Waitlist" players={waitlist} tone="info" />
    </div>
  );
}

type PlayerWithUser = Awaited<
  ReturnType<typeof db.player.findMany<{ include: { user: { select: { email: true } } } }>>
>[number];

function PlayerListSection({
  title,
  players,
  tone,
}: {
  title: string;
  players: PlayerWithUser[];
  tone: "success" | "info";
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl tracking-wide">{title}</h3>
          <Badge tone={tone}>{players.length}</Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-1.5">
        {players.length === 0 ? (
          <p className="text-sm text-muted">Nobody here yet.</p>
        ) : (
          players.map((p) => (
            <Link
              key={p.id}
              href={`/admin/players/${p.id}`}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-surface/50 px-3 py-2.5 hover:border-pitch-500 transition"
            >
              <Avatar firstName={p.firstName} lastName={p.lastName} size="md" src={p.avatarUrl} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">
                  {p.firstName} {p.lastName}
                  {p.nickname && <span className="text-muted font-normal"> &ldquo;{p.nickname}&rdquo;</span>}
                </div>
                <div className="text-xs text-muted">
                  Rank #{p.rank} · {p.user?.email ?? "no login"} · OVR {p.overall}
                </div>
              </div>
              {!p.active && <Badge tone="warn">inactive</Badge>}
              <Pencil className="h-4 w-4 text-muted" />
            </Link>
          ))
        )}
      </CardBody>
    </Card>
  );
}
