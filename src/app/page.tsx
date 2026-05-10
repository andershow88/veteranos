import Link from "next/link";
import { CalendarPlus, Sparkles } from "lucide-react";
import { listUpcomingMatches } from "@/server/match-queries";
import { getCurrentUser } from "@/lib/auth";
import { MatchCard } from "@/components/match/match-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [matches, user] = await Promise.all([listUpcomingMatches(), getCurrentUser()]);

  const currentPlayer = {
    playerId: user?.player?.id ?? null,
    kind: user?.player?.kind ?? null,
    role: user?.role ?? null,
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <Hero />

      {matches.length === 0 ? (
        <EmptyState isAdmin={user?.role === "ADMIN"} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {matches.map((m) => (
            <MatchCard key={m.id} view={m} currentPlayer={currentPlayer} />
          ))}
        </div>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative mb-10 overflow-hidden rounded-3xl border border-border-strong/60 glass pitch-stripes p-6 sm:p-10">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pitch-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 h-56 w-56 rounded-full bg-pitch-400/15 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col gap-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-pitch-500/40 bg-pitch-700/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-pitch-200">
          <Sparkles className="h-3 w-3" /> Upcoming matches
        </div>
        <h1 className="font-display text-4xl sm:text-6xl tracking-wide text-foreground">
          Veteranos. <span className="text-pitch-300">Play.</span> Win.
        </h1>
        <p className="max-w-2xl text-base sm:text-lg text-muted">
          Your football matches in one place. Confirm, decline or queue up &mdash; Edu handle balanced teams,
          waitlists and payments.
        </p>
      </div>
    </section>
  );
}

function EmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong/60 bg-surface/40 px-6 py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-pitch-700/30 text-pitch-300">
        <CalendarPlus className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-display text-2xl tracking-wide">No matches scheduled yet</h2>
      <p className="mt-1 text-sm text-muted">
        Once a match is created, it will show up here.
      </p>
      {isAdmin && (
        <Link href="/admin/matches/new" className="mt-6 inline-block">
          <Button>
            <CalendarPlus className="h-4 w-4" />
            Create new match
          </Button>
        </Link>
      )}
    </div>
  );
}
