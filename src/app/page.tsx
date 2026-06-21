import Link from "next/link";
import Image from "next/image";
import { CalendarPlus, Sparkles } from "lucide-react";
import { WeatherWidget } from "@/components/weather-widget";
import { RainRadar } from "@/components/rain-radar";
import { TricolorStripe } from "@/components/tricolor-stripe";
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

  const [nextMatch, ...moreMatches] = matches;
  const showTeams = !!lockedMatch && lockedMatch.teams.length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <Hero />

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
          {/* Once teams are published (generated + match locked), they take the
              top spot, above the match details. */}
          {showTeams && <TeamsSection lockedMatch={lockedMatch} />}

          {/* Focus: the next match */}
          <section className="space-y-3">
            <SectionHeading>Next match</SectionHeading>
            <MatchCard view={nextMatch} currentPlayer={currentPlayer} />
          </section>

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

function Hero() {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
      {/* Restored info box around the headline (placement kept; weather beside). */}
      <div className="relative flex-1 overflow-hidden rounded-3xl border border-border-strong/60 glass pitch-stripes p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pitch-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-56 w-56 rounded-full bg-pitch-400/15 blur-3xl" />
        <Image
          src="/bild_ball.png"
          alt=""
          aria-hidden
          width={96}
          height={96}
          className="pointer-events-none absolute right-3 top-3 h-16 w-16 select-none object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)] sm:right-5 sm:top-5 sm:h-24 sm:w-24"
        />
        <div className="relative flex flex-col gap-2.5 pr-14 sm:pr-24">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-pitch-500/40 bg-pitch-700/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-pitch-200">
            <Sparkles className="h-3 w-3" /> Upcoming matches
          </div>
          <h1 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">
            Veteranos. <span className="text-pitch-300">Play.</span> Win.
          </h1>
          <p className="text-base font-medium text-muted sm:text-lg">
            Older, wiser, still winning.
          </p>
        </div>
        <TricolorStripe className="hero-tricolor" />
      </div>

      {/* Weather stays beside the box — centered row on mobile, stacked on desktop. */}
      <div className="flex flex-row flex-wrap items-center justify-center gap-4 lg:flex-col lg:items-end lg:justify-center">
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
