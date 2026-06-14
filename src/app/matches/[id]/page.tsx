import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildMatchView, findMySignup } from "@/server/match-queries";
import { MatchCard } from "@/components/match/match-card";
import { MatchSignupBar } from "@/components/match/match-signup-bar";
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

  const mySignup = currentPlayer.playerId ? findMySignup(view, currentPlayer.playerId) : null;
  const showSignupBar =
    !!currentPlayer.playerId && !view.locked &&
    (currentPlayer.kind === "ABO" || currentPlayer.kind === "WAITLIST");

  return (
    <>
      <div
        className={`mx-auto w-full max-w-7xl space-y-8 px-4 pt-8 sm:px-6 sm:pt-12 ${
          showSignupBar ? "pb-36 md:pb-12" : "pb-8 sm:pb-12"
        }`}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-pitch-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to overview
        </Link>

        <MatchCard view={view} currentPlayer={currentPlayer} showDetailsLink={false} />

        {teams.length > 0 && <TeamShowcase teams={teams} />}
      </div>

      {showSignupBar && (
        <MatchSignupBar matchId={view.id} kind={currentPlayer.kind} status={mySignup?.status ?? null} />
      )}
    </>
  );
}
