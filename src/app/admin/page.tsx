import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, Plus, ListChecks, Lock } from "lucide-react";
import { formatMatchDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

// A match counts as "upcoming" until a few hours after kickoff — keep this in
// sync with /admin/matches so a match that already started today doesn't
// suddenly disappear from the dashboard.
function pastCutoff() {
  return new Date(Date.now() - 1000 * 60 * 60 * 6);
}

export default async function AdminDashboard() {
  const cutoff = pastCutoff();
  const [playerCount, aboCount, waitlistCount, upcomingMatches, lastMatch] = await Promise.all([
    db.player.count({ where: { active: true } }),
    db.player.count({ where: { active: true, kind: "ABO" } }),
    db.player.count({ where: { active: true, kind: "WAITLIST" } }),
    // No limit: the admin must see every upcoming match (box is scrollable).
    db.match.findMany({
      where: { date: { gte: cutoff } },
      orderBy: { date: "asc" },
      include: { _count: { select: { signups: true } } },
    }),
    db.match.findFirst({
      where: { date: { lt: cutoff } },
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Players" value={playerCount} subtitle={`${aboCount} abos · ${waitlistCount} waitlist`} />
        <Stat title="Upcoming matches" value={upcomingMatches.length} />
        <Stat title="Last match" value={lastMatch ? formatMatchDate(lastMatch.date) : "—"} small />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-pitch-300" />
              <h2 className="font-display text-2xl tracking-wide">Matches</h2>
            </div>
            <Link href="/admin/matches/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> New match
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
            {upcomingMatches.length === 0 ? (
              <p className="text-sm text-muted">No upcoming matches.</p>
            ) : (
              upcomingMatches.map((m) => (
                <Link
                  key={m.id}
                  href={`/admin/matches/${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-surface px-3 py-2 hover:border-pitch-500 transition"
                >
                  <div>
                    <div className="text-sm font-medium">{formatMatchDate(m.date)}</div>
                    <div className="text-xs text-muted">{m.location ?? "Location TBD"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.locked && (
                      <span className="inline-flex items-center gap-1 text-xs text-warning-ink">
                        <Lock className="h-3 w-3" /> locked
                      </span>
                    )}
                    <span className="number-pill text-xs text-pitch-300">{m._count.signups} entries</span>
                  </div>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-pitch-300" />
              <h2 className="font-display text-2xl tracking-wide">Players</h2>
            </div>
            <Link href="/admin/players/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> New player
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-muted">
              {playerCount} active players total. {aboCount} abo slots, {waitlistCount} on the waitlist.
            </p>
            <Link href="/admin/players">
              <Button variant="secondary" size="sm">
                <ListChecks className="h-4 w-4" /> Manage all players
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  subtitle,
  small,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border-strong/60 bg-surface/50 p-5">
      <div className="text-xs font-bold uppercase tracking-[0.25em] text-pitch-300">{title}</div>
      <div className={`mt-1 font-display ${small ? "text-xl" : "text-4xl"} tracking-wide text-foreground`}>
        {value}
      </div>
      {subtitle && <div className="mt-1 text-xs text-muted">{subtitle}</div>}
    </div>
  );
}
