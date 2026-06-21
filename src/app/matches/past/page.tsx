import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { listPastMatches } from "@/server/match-queries";
import { getCurrentUser } from "@/lib/auth";
import { MatchCard } from "@/components/match/match-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function PastMatchesPage() {
  const [matches, user] = await Promise.all([listPastMatches(), getCurrentUser()]);
  const currentPlayer = {
    playerId: user?.player?.id ?? null,
    kind: user?.player?.kind ?? null,
    role: user?.role ?? null,
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-pitch-300">
        <ArrowLeft className="h-4 w-4" /> Back to overview
      </Link>

      <section className="space-y-3">
        <SectionHeading>Past matches</SectionHeading>
        {matches.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="No past matches yet"
            description="Finished matches will show up here."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {matches.map((m) => (
              <MatchCard key={m.id} view={m} currentPlayer={currentPlayer} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
