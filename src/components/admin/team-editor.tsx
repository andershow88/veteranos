"use client";

import { useRef, useState, useTransition } from "react";
import { Trophy, Shield, Sword, Zap, ArrowLeftRight, Loader2, Copy, Check, Share2 } from "lucide-react";
import { toBlob, toPng } from "html-to-image";
import type { Team, TeamSlot, Player, TeamColor } from "@prisma/client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { TEAM_PALETTE } from "@/lib/team-palette";
import { swapTeamPlayersAction } from "@/server/admin-actions";

type TeamWithSlots = Team & { slots: Array<TeamSlot & { player: Player }> };

const TEAM_LABEL: Record<string, string> = { BLUE: "[BLUE]", RED: "[RED]", WHITE: "[WHITE]", BLACK: "[BLACK]" };

export function TeamEditor({
  teams,
  matchDate,
}: {
  teams: TeamWithSlots[];
  matchId: string;
  matchDate?: Date;
}) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const teamsRef = useRef<HTMLDivElement>(null);

  const overalls = teams.map((t) => t.avgOverall);
  const spread = Math.max(...overalls) - Math.min(...overalls);
  const verdict = balanceVerdict(spread);

  // Find the selected player name for the hint bar
  const selectedPlayer = selectedSlotId
    ? teams
        .flatMap((t) => t.slots)
        .find((s) => s.id === selectedSlotId)?.player
    : null;

  function handleSlotClick(slotId: string, teamId: string) {
    if (pending) return;

    // Nothing selected yet -> select this slot
    if (!selectedSlotId) {
      setSelectedSlotId(slotId);
      setSelectedTeamId(teamId);
      return;
    }

    // Clicked the already-selected slot -> deselect
    if (selectedSlotId === slotId) {
      setSelectedSlotId(null);
      setSelectedTeamId(null);
      return;
    }

    // Clicked a slot on the same team -> switch selection
    if (teamId === selectedTeamId) {
      setSelectedSlotId(slotId);
      return;
    }

    // Clicked a slot on a different team -> trigger swap
    setError(null);
    const fromSlot = selectedSlotId;
    setSelectedSlotId(null);
    setSelectedTeamId(null);

    startTransition(async () => {
      try {
        await swapTeamPlayersAction(fromSlot, slotId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Swap failed");
      }
    });
  }

  function copyTeamsAsImage() {
    const el = teamsRef.current;
    if (!el) return;
    setCopying(true);

    const imgOpts = { backgroundColor: "#0c1117", pixelRatio: 2 };

    const canClipboard =
      typeof navigator?.clipboard?.write === "function" &&
      typeof ClipboardItem !== "undefined";

    if (canClipboard) {
      const blobPromise = toBlob(el, imgOpts).then((b) => {
        if (!b) throw new Error("empty");
        return b;
      });
      navigator.clipboard
        .write([new ClipboardItem({ "image/png": blobPromise })])
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(() => downloadFallback(el, imgOpts))
        .finally(() => setCopying(false));
    } else {
      downloadFallback(el, imgOpts);
    }
  }

  function downloadFallback(el: HTMLElement, opts: { backgroundColor: string; pixelRatio: number }) {
    toPng(el, opts)
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "teams.png";
        link.href = dataUrl;
        link.click();
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {})
      .finally(() => setCopying(false));
  }

  function shareViaWhatsApp() {
    const dateStr = matchDate
      ? new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(matchDate))
      : "upcoming match";

    let text = `*Teams for ${dateStr}*\n\n`;
    for (const t of teams) {
      const label = TEAM_LABEL[t.color] ?? t.name;
      text += `${label} *${t.name.toUpperCase()}* (OVR ${Math.round(t.avgOverall)})\n`;
      for (const slot of t.slots) {
        text += `- ${slot.player.firstName} ${slot.player.lastName ?? ""}\n`;
      }
      text += "\n";
    }
    text += "See match details here: https://veteranos.club";

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    copyTeamsAsImage();
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-pitch-300">
            Team Editor
          </div>
          <h2 className="font-display text-3xl sm:text-4xl tracking-wide text-foreground">
            Tap players to swap
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={copyTeamsAsImage}
            disabled={copying}
          >
            {copying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy image"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={shareViaWhatsApp}
            disabled={copying}
          >
            <Share2 className="h-4 w-4" />
            WhatsApp
          </Button>
          <div className="rounded-2xl border border-pitch-600/40 bg-pitch-700/20 px-4 py-2 text-sm font-medium text-pitch-100">
            {verdict}
          </div>
        </div>
      </div>

      {/* Hint bar when a player is selected */}
      {selectedPlayer && (
        <Alert tone="warning">
          <ArrowLeftRight className="mr-2 inline h-4 w-4 shrink-0 text-warning-ink" />
          <span>
            <strong>
              {selectedPlayer.firstName} {selectedPlayer.lastName}
            </strong>{" "}
            selected — tap a player in another team to swap
          </span>
        </Alert>
      )}

      {/* Loading overlay hint */}
      {pending && (
        <div className="flex items-center gap-2 rounded-xl border border-pitch-600/40 bg-pitch-700/20 px-4 py-2.5 text-sm font-medium text-pitch-200">
          <Loader2 className="h-4 w-4 animate-spin text-pitch-400" />
          Swapping players...
        </div>
      )}

      {error && <Alert tone="danger">{error}</Alert>}

      <div
        ref={teamsRef}
        className={`grid gap-5 p-4 ${
          teams.length === 4
            ? "lg:grid-cols-2 xl:grid-cols-4"
            : "lg:grid-cols-3"
        }`}
      >
        {teams.map((t) => (
          <EditorTeamCard
            key={t.id}
            team={t}
            selectedSlotId={selectedSlotId}
            selectedTeamId={selectedTeamId}
            pending={pending}
            onSlotClick={handleSlotClick}
          />
        ))}
      </div>
    </section>
  );
}

function EditorTeamCard({
  team,
  selectedSlotId,
  selectedTeamId,
  pending,
  onSlotClick,
}: {
  team: TeamWithSlots;
  selectedSlotId: string | null;
  selectedTeamId: string | null;
  pending: boolean;
  onSlotClick: (slotId: string, teamId: string) => void;
}) {
  const palette = TEAM_PALETTE[team.color as TeamColor];
  const isTargetTeam = selectedTeamId !== null && selectedTeamId !== team.id;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-surface/40 transition-all duration-200 ${
        isTargetTeam
          ? "border-pitch-400/60 shadow-lg shadow-pitch-500/10"
          : "border-border-strong/60"
      }`}
    >
      {/* Team header */}
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
          <div
            className="grid h-12 w-12 place-items-center rounded-full ring-4 ring-white/20"
            style={{
              backgroundColor:
                team.color === "WHITE" ? "#0f172a" : "rgba(0,0,0,0.25)",
            }}
          >
            <Trophy
              className={`h-6 w-6 ${
                team.color === "WHITE" ? "text-white" : "text-white"
              }`}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <StatBadge
            label="Overall"
            value={team.avgOverall}
            icon={<Trophy className="h-3 w-3" />}
            dark={team.color === "WHITE"}
          />
          <StatBadge
            label="Defense"
            value={team.avgDefense}
            icon={<Shield className="h-3 w-3" />}
            dark={team.color === "WHITE"}
          />
          <StatBadge
            label="Offense"
            value={team.avgOffense}
            icon={<Sword className="h-3 w-3" />}
            dark={team.color === "WHITE"}
          />
          <StatBadge
            label="Speed"
            value={team.avgSpeed}
            icon={<Zap className="h-3 w-3" />}
            dark={team.color === "WHITE"}
          />
        </div>
      </div>

      {/* Player slots */}
      <div className="px-5 py-4 space-y-2">
        {team.slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          const isSwapTarget =
            selectedTeamId !== null &&
            selectedTeamId !== team.id &&
            !pending;

          return (
            <button
              key={slot.id}
              type="button"
              disabled={pending}
              onClick={() => onSlotClick(slot.id, team.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-all duration-150 ${
                isSelected
                  ? "ring-2 ring-pitch-400 bg-pitch-700/20"
                  : isSwapTarget
                  ? "hover:bg-pitch-700/15 hover:ring-1 hover:ring-pitch-500/40 cursor-pointer"
                  : "hover:bg-surface-2 cursor-pointer"
              } ${pending ? "opacity-60 cursor-wait" : ""}`}
            >
              <Avatar
                firstName={slot.player.firstName}
                lastName={slot.player.lastName}
                size="sm"
                src={slot.player.avatarUrl}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {slot.player.firstName} {slot.player.lastName}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Team comment */}
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

function balanceVerdict(spread: number) {
  if (spread < 2) return "Perfectly balanced — anyone could win this";
  if (spread < 4) return "Well-balanced teams";
  if (spread < 7) return "Solid balance, slight edge possible";
  return "A bit uneven — consider swapping";
}
