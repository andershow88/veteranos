import Link from "next/link";
import { CalendarPlus, Sparkles } from "lucide-react";
import { WeatherWidget } from "@/components/weather-widget";
import { RainRadar } from "@/components/rain-radar";
import { listUpcomingMatches, getLockedMatchWithTeams } from "@/server/match-queries";
import { getCurrentUser } from "@/lib/auth";
import { MatchCard } from "@/components/match/match-card";
import { TeamShowcase } from "@/components/team/team-showcase";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMatchDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [matches, user, lockedMatch] = await Promise.all([
    listUpcomingMatches(),
    getCurrentUser(),
    getLockedMatchWithTeams(),
  ]);

  const currentPlayer = {
    playerId: user?.player?.id ?? null,
    kind: user?.player?.kind ?? null,
    role: user?.role ?? null,
  };

  const firstName = user?.player?.firstName ?? null;
  const [nextMatch, ...moreMatches] = matches;
  const showTeams = !!lockedMatch && lockedMatch.teams.length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <Hero firstName={firstName} />

      {matches.length === 0 ? (
        <>
          {showTeams && <TeamsSection lockedMatch={lockedMatch} />}
          <EmptyState
            icon={<CalendarPlus className="h-6 w-6" />}
            title="No matches scheduled yet"
            description="Once a match is created, it will show up here."
            action={
              user?.role === "ADMIN" ? (
                <Link href="/admin/matches/new">
                  <Button>
                    <CalendarPlus className="h-4 w-4" />
                    Create new match
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </>
      ) : (
        <>
          {/* Focus: the next match */}
          <section className="space-y-3">
            <SectionHeading>Next match</SectionHeading>
            <MatchCard view={nextMatch} currentPlayer={currentPlayer} />
          </section>

          {showTeams && <TeamsSection lockedMatch={lockedMatch} />}

          {moreMatches.length > 0 && (
            <section className="space-y-3">
              <SectionHeading>More upcoming</SectionHeading>
              <div className="grid gap-6 lg:grid-cols-2">
                {moreMatches.map((m) => (
                  <MatchCard key={m.id} view={m} currentPlayer={currentPlayer} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Hero({ firstName }: { firstName: string | null }) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-pitch-300">
          <Sparkles className="h-3.5 w-3.5" /> Veteranos
        </div>
        <h1 className="mt-1 font-display text-3xl tracking-wide text-foreground sm:text-4xl">
          {firstName ? (
            <>
              Hi, <span className="text-pitch-300">{firstName}</span>
            </>
          ) : (
            "Upcoming matches"
          )}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Confirm or decline, manage the waitlist, and see balanced teams.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <WeatherWidget />
        <RainRadar />
      </div>
    </section>
  );
}

function TeamsSection({
  lockedMatch,
}: {
  lockedMatch: NonNullable<Awaited<ReturnType<typeof getLockedMatchWithTeams>>>;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-pitch-300">
            {formatMatchDate(lockedMatch.date)}
          </div>
          <h2 className="font-display text-2xl tracking-wide text-foreground sm:text-3xl">
            Teams are set
          </h2>
        </div>
        <Link
          href={`/matches/${lockedMatch.id}`}
          className="text-sm font-semibold text-pitch-300 transition hover:text-pitch-200"
        >
          Match details →
        </Link>
      </div>
      <TeamShowcase teams={lockedMatch.teams} />
    </section>
  );
}
