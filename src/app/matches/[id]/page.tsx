import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildMatchView } from "@/server/match-queries";
import { MatchCard } from "@/components/match/match-card";
import { TeamShowcase } from "@/components/team/team-showcase";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [view, user, teams] = await Promise.all([
    buildMatchView(id),
    getCurrentUser(),
    db.team.findMany({
      where: { matchId: id },
      orderBy: { color: "asc" },
      include: {
        slots: {
          include: { player: true },
        },
      },
    }),
  ]);

  if (!view) notFound();

  const currentPlayer = {
    playerId: user?.player?.id ?? null,
    kind: user?.player?.kind ?? null,
    role: user?.role ?? null,
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-pitch-300 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
      </Link>

      <MatchCard view={view} currentPlayer={currentPlayer} />

      {teams.length > 0 && <TeamShowcase teams={teams} />}
    </div>
  );
}
