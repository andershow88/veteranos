import { Trophy, Shield, Sword, Zap } from "lucide-react";
import type { Team, TeamSlot, Player, TeamColor } from "@prisma/client";
import { Avatar } from "@/components/ui/avatar";
import { TEAM_PALETTE } from "@/lib/team-palette";

type TeamWithSlots = Team & { slots: Array<TeamSlot & { player: Player }> };

export function TeamShowcase({ teams }: { teams: TeamWithSlots[] }) {
  const overalls = teams.map((t) => t.avgOverall);
  const spread = Math.max(...overalls) - Math.min(...overalls);
  const verdict = balanceVerdict(spread);

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-pitch-300">
            Team Generator
          </div>
          <h2 className="font-display text-3xl sm:text-4xl tracking-wide text-foreground">
            Teams are set
          </h2>
        </div>
        <div className="rounded-2xl border border-pitch-600/40 bg-pitch-700/20 px-4 py-2 text-sm font-medium text-pitch-100">
          {verdict}
        </div>
      </div>

      <div className={`grid gap-5 ${teams.length === 4 ? "lg:grid-cols-2 xl:grid-cols-4" : "lg:grid-cols-3"}`}>
        {teams.map((t) => (
          <TeamCard key={t.id} team={t} />
        ))}
      </div>
    </section>
  );
}

function TeamCard({ team }: { team: TeamWithSlots }) {
  const palette = TEAM_PALETTE[team.color as TeamColor];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-strong/60 bg-surface/40">
      <div
        className={`relative px-5 py-4 bg-linear-to-br ${palette.chip} animate-shine`}
        style={{
          backgroundImage: `linear-gradient(120deg, ${palette.hex}, ${palette.hex}cc, ${palette.hex})`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div
              className={`text-xs font-bold uppercase tracking-[0.25em] ${
                team.color === "WHITE" ? "text-zinc-900/70" : "text-white/80"
              }`}
            >
              Team
            </div>
            <div
              className={`font-display text-3xl tracking-wide ${
                team.color === "WHITE" ? "text-zinc-900" : "text-white"
              }`}
            >
              {team.name}
            </div>
          </div>
          <div className={`grid h-12 w-12 place-items-center rounded-full ring-4 ring-white/20`} style={{ backgroundColor: team.color === "WHITE" ? "#0f172a" : "rgba(0,0,0,0.25)" }}>
            <Trophy className={`h-6 w-6 ${team.color === "WHITE" ? "text-white" : "text-white"}`} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <StatBadge label="Overall" value={team.avgOverall} icon={<Trophy className="h-3 w-3" />} dark={team.color === "WHITE"} />
          <StatBadge label="Defense" value={team.avgDefense} icon={<Shield className="h-3 w-3" />} dark={team.color === "WHITE"} />
          <StatBadge label="Offense" value={team.avgOffense} icon={<Sword className="h-3 w-3" />} dark={team.color === "WHITE"} />
          <StatBadge label="Speed" value={team.avgSpeed} icon={<Zap className="h-3 w-3" />} dark={team.color === "WHITE"} />
        </div>
      </div>

      <div className="px-5 py-4 space-y-2">
        {team.slots.map((slot) => (
          <PlayerSlot key={slot.id} slot={slot} />
        ))}
      </div>

      {team.comment && (
        <div className="border-t border-border/60 px-5 py-3 text-sm text-muted italic">
          {team.comment}
        </div>
      )}
    </div>
  );
}

function StatBadge({
  label,
  value,
  icon,
  dark,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        dark
          ? "bg-zinc-900/15 text-zinc-900 border border-zinc-900/20"
          : "bg-black/30 text-white border border-white/15"
      }`}
    >
      {icon}
      {label}
      <span className="number-pill ml-1">{Math.round(value)}</span>
    </span>
  );
}

function PlayerSlot({ slot }: { slot: TeamSlot & { player: Player } }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2 transition">
      <Avatar firstName={slot.player.firstName} lastName={slot.player.lastName} size="sm" src={slot.player.avatarUrl} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {slot.player.firstName} {slot.player.lastName}
        </div>
      </div>
    </div>
  );
}

function balanceVerdict(spread: number) {
  if (spread < 2) return "Perfectly balanced — anyone could win this";
  if (spread < 4) return "Well-balanced teams";
  if (spread < 7) return "Solid balance, slight edge possible";
  return "A bit uneven — consider swapping";
}
