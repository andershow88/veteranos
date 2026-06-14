import Link from "next/link";
import { Calendar, MapPin, Users, ListOrdered, Lock, Trophy, ArrowRight, ArrowRightLeft, Share2, Clock, Check, X } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatMatchDate, formatRelativeMatchDate } from "@/lib/utils";
import type { MatchView } from "@/server/match-queries";
import { SignupControls } from "./signup-controls";
import { ReplacementRow } from "./replacement-row";

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

        <StatusSummary view={view} />

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

        {view.pendingAbos.length > 0 && (
          <Section
            title="Offen"
            icon={<Clock className="h-3.5 w-3.5" />}
            count={view.pendingAbos.length}
          >
            <div className="flex flex-wrap gap-1.5">
              {view.pendingAbos.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/40 bg-amber-900/10 px-2 py-1 text-sm text-amber-100/90"
                >
                  <Avatar firstName={p.firstName} lastName={p.lastName} size="sm" src={p.avatarUrl} />
                  <span className="truncate max-w-[140px]">
                    {p.firstName}{p.lastName ? ` ${p.lastName}` : ""}
                  </span>
                </span>
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
                        {s.player.position !== "ANY" ? labelPosition(s.player.position).slice(0, 3).toUpperCase() + " " : ""}{s.player.overall}
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

        {view.replacements.length > 0 && (
          <Section
            title="Replacements"
            icon={<ArrowRightLeft className="h-3.5 w-3.5" />}
            count={view.replacements.filter((r) => r.replacement).length}
          >
            <div className="space-y-2">
              {view.replacements.map((r, idx) => (
                <ReplacementRow key={idx} info={r} index={idx} currentPlayer={currentPlayer} />
              ))}
            </div>
          </Section>
        )}

        {view.declined.length > 0 && (
          <Section
            title="Declined"
            icon={<X className="h-3.5 w-3.5" />}
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
          {position !== "ANY" ? labelPosition(position).slice(0, 3).toUpperCase() + " " : ""}{overall}
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

/**
 * Smarte, kompakte Status-Übersicht pro Spiel.
 * Reihenfolge: Confirmed → Offen → Waitlist → Replacements → Declined.
 * "Offen" = aktive Abo-Spieler, die für DIESES Spiel weder zu- noch abgesagt haben.
 * Pills für Waitlist/Replacements/Declined erscheinen nur, wenn relevant (>0);
 * Confirmed und Offen werden immer gezeigt. Darunter eine feine Fortschrittsleiste
 * (grün = zugesagt, rot = abgesagt, Rest = offen) der Abo-Rückmeldungen.
 */
function StatusSummary({ view }: { view: MatchView }) {
  const confirmed = view.attendees.length;
  const declined = view.declined.length;
  const pending = view.pendingAbos.length;
  const waitlist = view.waitlist.length;
  const replacements = view.replacements.filter((r) => r.replacement).length;

  const responded = confirmed + declined;
  const total = view.aboTotal || responded + pending;
  const confPct = total > 0 ? (confirmed / total) * 100 : 0;
  const decPct = total > 0 ? (declined / total) * 100 : 0;

  const stats = [
    { key: "confirmed", label: "Confirmed", value: confirmed, tone: "bg-pitch-700/25 text-pitch-100 border-pitch-600/50", icon: <Check className="h-4 w-4" />, always: true },
    { key: "pending", label: "Offen", value: pending, tone: "bg-amber-900/25 text-amber-100 border-amber-700/50", icon: <Clock className="h-4 w-4" />, always: true },
    { key: "waitlist", label: "Waitlist", value: waitlist, tone: "bg-sky-900/25 text-sky-100 border-sky-700/50", icon: <ListOrdered className="h-4 w-4" /> },
    { key: "replacements", label: "Replacements", value: replacements, tone: "bg-indigo-900/25 text-indigo-100 border-indigo-700/50", icon: <ArrowRightLeft className="h-4 w-4" /> },
    { key: "declined", label: "Declined", value: declined, tone: "bg-red-900/25 text-red-100 border-red-700/50", icon: <X className="h-4 w-4" /> },
  ].filter((s) => s.always || s.value > 0);

  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 p-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {stats.map((s) => (
          <div
            key={s.key}
            className={cn("flex flex-1 min-w-[84px] items-center gap-2 rounded-lg border px-2.5 py-2", s.tone)}
          >
            <span className="shrink-0 opacity-80">{s.icon}</span>
            <div className="leading-none">
              <div className="text-xl font-bold tabular-nums">{s.value}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-80">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div className="bg-pitch-500 transition-all" style={{ width: `${confPct}%` }} />
            <div className="bg-red-500/70 transition-all" style={{ width: `${decPct}%` }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
            <span>
              {responded}/{total} Abos haben geantwortet
            </span>
            <span className={pending > 0 ? "font-semibold text-amber-300" : "font-semibold text-pitch-300"}>
              {pending > 0 ? `${pending} offen` : "Alle geantwortet ✓"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
