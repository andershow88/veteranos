import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, Unlock, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchForm } from "@/components/admin/match-form";
import { SignupManager } from "@/components/admin/signup-manager";
import { TeamSection } from "@/components/admin/team-section";
import { DeleteMatchButton } from "@/components/admin/delete-match-button";
import { buildMatchView, getActivePlayersGrouped } from "@/server/match-queries";
import { formatMatchDate, utcToBerlinParts } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await db.match.findUnique({ where: { id } });
  if (!match) notFound();

  const [view, allPlayers, teams] = await Promise.all([
    buildMatchView(id),
    getActivePlayersGrouped(),
    db.team.findMany({
      where: { matchId: id },
      orderBy: { color: "asc" },
      include: { slots: { include: { player: true } } },
    }),
  ]);
  if (!view) notFound();

  // Prefill the form with the German wall-clock date/time, not the server's.
  const { date: dateStr, time: timeStr } = utcToBerlinParts(match.date);
  // Server component: request-time comparison is intentional.
  // eslint-disable-next-line react-hooks/purity
  const isPast = match.date.getTime() < Date.now();
  const readOnly = (match.locked || isPast) as boolean;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/matches"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-pitch-300 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl tracking-wide">{formatMatchDate(match.date)}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {match.locked ? (
                  <Badge tone="warn">
                    <Lock className="h-3 w-3" /> locked
                  </Badge>
                ) : (
                  <Badge tone="success">
                    <Unlock className="h-3 w-3" /> open
                  </Badge>
                )}
                <Badge tone="info">{view.attendees.length + view.replacements.filter(r => r.replacement).length} players in</Badge>
              </div>
            </div>

            {!isPast && (
              <div className="flex flex-wrap gap-2">
                <DeleteMatchButton matchId={id} matchLabel={formatMatchDate(match.date)} />
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {!readOnly && <Card>
        <CardHeader>
          <h3 className="font-display text-xl tracking-wide">Edit match</h3>
        </CardHeader>
        <CardBody>
          <MatchForm
            defaults={{
              id: match.id,
              date: dateStr,
              time: timeStr,
              durationMin: match.durationMin,
              location: match.location,
              notes: match.notes,
              teamCount: match.teamCount,
            }}
          />
        </CardBody>
      </Card>}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl tracking-wide">Manage sign-ups</h3>
            <p className="text-xs text-muted">Manually add, decline or waitlist players, and track payments.</p>
          </div>
        </CardHeader>
        <CardBody>
          <SignupManager view={view} allPlayers={allPlayers} readOnly={readOnly} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-pitch-300" />
            <h3 className="font-display text-xl tracking-wide">Team Generator</h3>
          </div>
          <Badge tone={teams.length > 0 ? "success" : "default"}>
            {teams.length > 0 ? `${teams.length} teams generated` : "No teams yet"}
          </Badge>
        </CardHeader>
        <CardBody>
          <TeamSection
            matchId={id}
            matchDate={match.date}
            hasTeams={teams.length > 0}
            locked={match.locked}
            isPast={isPast}
            teamCount={match.teamCount}
            pool={[
              ...view.attendees.map((s) => ({
                id: s.player.id,
                firstName: s.player.firstName,
                lastName: s.player.lastName,
                avatarUrl: s.player.avatarUrl,
                kind: s.player.kind as "ABO" | "WAITLIST",
                overall: s.player.overall,
              })),
              ...view.waitlist.map((s) => ({
                id: s.player.id,
                firstName: s.player.firstName,
                lastName: s.player.lastName,
                avatarUrl: s.player.avatarUrl,
                kind: s.player.kind as "ABO" | "WAITLIST",
                overall: s.player.overall,
              })),
            ]}
            teams={teams}
          />
        </CardBody>
      </Card>
    </div>
  );
}
