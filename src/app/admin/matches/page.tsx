import Link from "next/link";
import { db } from "@/lib/db";
import { Plus, Lock, Trophy } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMatchDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function pastCutoff() {
  return new Date(Date.now() - 1000 * 60 * 60 * 6);
}

export default async function AdminMatchesPage() {
  const cutoff = pastCutoff();
  const upcoming = await db.match.findMany({
    where: { date: { gte: cutoff } },
    orderBy: { date: "asc" },
    include: { _count: { select: { signups: true, teams: true } } },
  });
  const past = await db.match.findMany({
    where: { date: { lt: cutoff } },
    orderBy: { date: "desc" },
    take: 20,
    include: { _count: { select: { signups: true, teams: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wide">Termine</h2>
        <Link href="/admin/matches/new">
          <Button>
            <Plus className="h-4 w-4" /> Neuer Termin
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-display text-xl tracking-wide">Anstehende Termine</h3>
        </CardHeader>
        <CardBody className="space-y-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">Keine anstehenden Termine.</p>
          ) : (
            upcoming.map((m) => <MatchRow key={m.id} match={m} />)
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-display text-xl tracking-wide">Vergangene Termine</h3>
        </CardHeader>
        <CardBody className="space-y-2">
          {past.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Historie.</p>
          ) : (
            past.map((m) => <MatchRow key={m.id} match={m} />)
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function MatchRow({
  match,
}: {
  match: {
    id: string;
    date: Date;
    location: string | null;
    locked: boolean;
    teamCount: number;
    _count: { signups: number; teams: number };
  };
}) {
  return (
    <Link
      href={`/admin/matches/${match.id}`}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-surface/50 px-3 py-2.5 hover:border-pitch-500 transition"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{formatMatchDate(match.date)}</div>
        <div className="text-xs text-muted">{match.location ?? "Ort offen"} · {match.teamCount} Teams geplant</div>
      </div>
      <Badge tone="info">{match._count.signups} Einträge</Badge>
      {match._count.teams > 0 && (
        <Badge tone="success">
          <Trophy className="h-3 w-3" /> Teams
        </Badge>
      )}
      {match.locked && (
        <Badge tone="warn">
          <Lock className="h-3 w-3" /> gesperrt
        </Badge>
      )}
    </Link>
  );
}
