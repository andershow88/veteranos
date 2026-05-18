import Link from "next/link";
import { Calendar, MapPin, Users, ListOrdered, Lock, Trophy, ArrowRight, Share2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatMatchDate, formatRelativeMatchDate } from "@/lib/utils";
import type { MatchView } from "@/server/match-queries";
import { SignupControls } from "./signup-controls";
import { ReplacementRow } from "./replacement-row";
import { AdminDetailsToggle } from "./admin-details-toggle";

type CurrentPlayerCtx = {
  playerId: string | null;
  kind: "ABO" | "WAITLIST" | null;
  role: "ADMIN" | "PLAYER" | null;
};

export function MatchCard({
  view,
  currentPlayer,
  showDetailsLink = true,
}: {
  view: MatchView;
  currentPlayer: CurrentPlayerCtx;
  /** Whether to render the "Match details" link in the card footer.
   * Pass false when the card is itself displayed inside the match-detail page. */
  showDetailsLink?: boolean;
}) {
  const totalPlaying = view.attendees.length + view.replacements.filter((r) => r.replacement).length;

  return (
    <Card className="hover:ring-pitch transition-shadow">
      <CardHeader className="bg-linear-to-br from-pitch-700/40 to-transparent">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-pitch-300 text-xs font-semibold uppercase tracking-widest">
              <Calendar className="h-3.5 w-3.5" /> {formatRelativeMatchDate(view.date)}
            </div>
            <div className="mt-1 font-display text-3xl tracking-wide text-foreground">
              {formatMatchDate(view.date)}
            </div>
            {view.location && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="h-3.5 w-3.5" /> {view.location}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {view.locked && (
              <Badge tone="warn">
                <Lock className="h-3 w-3" /> locked
              </Badge>
            )}
            {view.hasTeams && (
              <Badge tone="success">
                <Trophy className="h-3 w-3" /> Teams ready
              </Badge>
            )}
            <Badge tone="info">
              <Users className="h-3 w-3" /> {totalPlaying} playing
            </Badge>
            {currentPlayer.role === "ADMIN" && <AdminDetailsToggle />}
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-5">
        <SignupControls
          matchId={view.id}
          locked={view.locked}
          currentPlayer={currentPlayer}
          mySignup={
            currentPlayer.playerId
              ? findMine(view, currentPlayer.playerId)
              : null
          }
        />

        <Section
          title="Confirmed"
          icon={<Users className="h-3.5 w-3.5" />}
          count={view.attendees.length}
        >
          {view.attendees.length === 0 ? (
            <Empty>No confirmations yet.</Empty>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {view.attendees.map((s) => (
                <PlayerChip
                  key={s.id}
                  firstName={s.player.firstName}
                  lastName={s.player.lastName}
                  position={s.player.position}
                  overall={currentPlayer.role === "ADMIN" ? s.player.overall : undefined}
                  src={s.player.avatarUrl}
                />
              ))}
            </div>
          )}
        </Section>

        {view.declined.length > 0 && (
          <Section
            title="Declined"
            icon={<ListOrdered className="h-3.5 w-3.5" />}
            count={view.declined.length}
          >
            <div className="space-y-1">
              {view.declined.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-red-900/40 bg-red-900/10 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-300">#{idx + 1}</span>
                    <Avatar firstName={s.player.firstName} lastName={s.player.lastName} size="sm" src={s.player.avatarUrl} />
                    <span className="text-sm text-foreground/90 line-through decoration-red-400/60">
                      {s.player.firstName} {s.player.lastName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {view.replacements.length > 0 && (
          <Section
            title="Replacements"
            icon={<ArrowRight className="h-3.5 w-3.5" />}
            count={view.replacements.filter((r) => r.replacement).length}
          >
            <div className="space-y-2">
              {view.replacements.map((r, idx) => (
                <ReplacementRow key={idx} info={r} index={idx} currentPlayer={currentPlayer} />
              ))}
            </div>
          </Section>
        )}

        {view.waitlist.length > 0 && (
          <Section
            title="Waitlist"
            icon={<ListOrdered className="h-3.5 w-3.5" />}
            count={view.waitlist.length}
          >
            <div className="space-y-1.5">
              {view.waitlist.map((s, idx) => {
                const isReplacing = idx < view.declined.length;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
                      isReplacing
                        ? "border-pitch-600/60 bg-pitch-700/15"
                        : "border-border/60 bg-surface/40"
                    }`}
                  >
                    <span className="text-xs font-bold text-pitch-300 w-6 number-pill shrink-0">#{idx + 1}</span>
                    <Avatar firstName={s.player.firstName} lastName={s.player.lastName} size="sm" src={s.player.avatarUrl} />
                    <span className="text-sm truncate flex-1 min-w-0">
                      {s.player.firstName} {s.player.lastName}
                    </span>
                    {currentPlayer.role === "ADMIN" && (
                      <span className="admin-ovr number-pill text-xs font-bold text-pitch-400 shrink-0">
                        {s.player.overall}
                      </span>
                    )}
                    {isReplacing && (
                      <Badge tone="success" className="shrink-0">
                        stepping in
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {(showDetailsLink || currentPlayer.role === "ADMIN") && (
          <div className="flex items-center justify-between pt-2">
            {showDetailsLink ? (
              <Link
                href={`/matches/${view.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-pitch-300 hover:text-pitch-200 transition"
              >
                Match details {view.hasTeams ? "& teams" : ""}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span />
            )}
            {currentPlayer.role === "ADMIN" && (
              <div className="flex items-center gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent("Hey guys, just a reminder to sign up for the next game!\n\nhttps://veteranos.club")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted hover:text-emerald-400 transition"
                  title="Send WhatsApp reminder"
                >
                  <Share2 className="h-3 w-3" /> WhatsApp
                </a>
                <Link
                  href={`/admin/matches/${view.id}`}
                  className="text-xs uppercase tracking-widest text-muted hover:text-pitch-300 transition"
                >
                  Admin →
                </Link>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-pitch-300">
        {icon}
        {title}
        {typeof count === "number" && (
          <span className="number-pill text-muted font-medium">· {count}</span>
        )}
      </h3>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 px-4 py-3 text-sm text-subtle">
      {children}
    </div>
  );
}

function PlayerChip({
  firstName,
  lastName,
  position,
  overall,
  src,
}: {
  firstName: string;
  lastName: string | null;
  position: string;
  overall?: number;
  src?: string | null;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface/50 px-3 py-2">
      <Avatar firstName={firstName} lastName={lastName} size="sm" src={src} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {firstName}{lastName ? ` ${lastName}` : ""}
        </div>
        {position !== "ANY" && (
          <div className="text-[10px] uppercase tracking-widest text-muted">
            {labelPosition(position)}
          </div>
        )}
      </div>
      {typeof overall === "number" && (
        <span className="admin-ovr number-pill text-xs font-bold text-pitch-400 shrink-0">
          {overall}
        </span>
      )}
    </div>
  );
}

function labelPosition(p: string) {
  return (
    {
      GOALKEEPER: "Goalkeeper",
      DEFENDER: "Defender",
      MIDFIELDER: "Midfielder",
      STRIKER: "Striker",
      ANY: "—",
    } as Record<string, string>
  )[p] ?? p;
}

function findMine(view: MatchView, playerId: string) {
  const all = [...view.attendees, ...view.declined, ...view.waitlist];
  return all.find((s) => s.playerId === playerId) ?? null;
}
