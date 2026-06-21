"use client";

import { useTransition, useState } from "react";
import {
  Check,
  X,
  ListPlus,
  Trash2,
  CheckCircle2,
  Clock,
  CircleDashed,
  Loader2,
  UserPlus,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/input";
import {
  adminSetSignupAction,
  setPaymentStatusAction,
  addGuestToMatchAction,
} from "@/server/match-actions";
import type { MatchView } from "@/server/match-queries";
import type { Player, PaymentStatus, SignupStatus } from "@prisma/client";

type Props = {
  view: MatchView;
  allPlayers: { abos: Player[]; waitlisters: Player[] };
  readOnly?: boolean;
};

export function SignupManager({ view, allPlayers, readOnly }: Props) {
  const [pending, startTransition] = useTransition();
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<SignupStatus>("IN");

  const allSignedUpIds = new Set([
    ...view.attendees.map((s) => s.playerId),
    ...view.declined.map((s) => s.playerId),
    ...view.waitlist.map((s) => s.playerId),
  ]);
  const availableSubs = allPlayers.abos.filter((p) => !allSignedUpIds.has(p.id));
  const availableWls = allPlayers.waitlisters.filter((p) => !allSignedUpIds.has(p.id));

  const setStatus = (playerId: string, status: SignupStatus | "REMOVE") => {
    startTransition(() =>
      adminSetSignupAction({ matchId: view.id, playerId, status }),
    );
  };

  return (
    <div className="space-y-5">
      {/* Add manually — hidden when read-only */}
      {!readOnly && (
        <div className="rounded-xl border border-border-strong/60 bg-surface/50 p-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-300 mb-3">
            Add player manually
          </h4>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-45">
              <Select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
                <option value="">Choose player…</option>
                {availableSubs.length > 0 && (
                  <optgroup label="Subscribers">
                    {availableSubs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </optgroup>
                )}
                {availableWls.length > 0 && (
                  <optgroup label="Waitlist">
                    {availableWls.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </optgroup>
                )}
              </Select>
            </div>
            <div className="w-44">
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as SignupStatus)}
              >
                <option value="IN">In</option>
                <option value="OUT">Out</option>
                <option value="WAITLIST">Waitlist</option>
              </Select>
            </div>
            <Button
              disabled={!selectedPlayer || pending}
              onClick={() => {
                if (!selectedPlayer) return;
                setStatus(selectedPlayer, selectedStatus);
                setSelectedPlayer("");
              }}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              <ListPlus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      )}

      <SignupSection
        title={`Confirmed (${view.attendees.length})`}
        rows={view.attendees}
        renderActions={readOnly ? undefined : (s) => (
          <>
            <IconBtn onClick={() => setStatus(s.playerId, "OUT")} title="Mark as out">
              <X className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn onClick={() => setStatus(s.playerId, "REMOVE")} variant="danger" title="Remove">
              <Trash2 className="h-3.5 w-3.5" />
            </IconBtn>
          </>
        )}
      />

      <DeclinedSection
        matchId={view.id}
        rows={view.declined}
        replacements={view.replacements}
        allPlayers={allPlayers}
        onSetStatus={setStatus}
        readOnly={readOnly}
      />

      <SignupSection
        title={`Waitlist (${view.waitlist.length})`}
        rows={view.waitlist}
        renderActions={readOnly ? undefined : (s) => (
          <>
            <PaymentControls signupId={s.id} status={s.paymentStatus} />
            <IconBtn onClick={() => setStatus(s.playerId, "REMOVE")} variant="danger" title="Remove">
              <Trash2 className="h-3.5 w-3.5" />
            </IconBtn>
          </>
        )}
      />
    </div>
  );
}

function DeclinedSection({
  matchId,
  rows,
  replacements,
  allPlayers,
  onSetStatus,
  readOnly,
}: {
  matchId: string;
  rows: MatchView["declined"];
  replacements: MatchView["replacements"];
  allPlayers: { abos: Player[]; waitlisters: Player[] };
  onSetStatus: (playerId: string, status: SignupStatus | "REMOVE") => void;
  readOnly?: boolean;
}) {
  const [overrideIdx, setOverrideIdx] = useState<number | null>(null);

  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-300 mb-2">
        Declined ({rows.length})
      </h4>
      {rows.length === 0 ? (
        <p className="text-sm text-subtle">—</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((s, idx) => {
            const rep = replacements[idx];
            return (
              <div key={s.id}>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-surface/50 px-3 py-2">
                  <span className="number-pill text-xs text-muted w-6">#{idx + 1}</span>
                  <Avatar firstName={s.player.firstName} lastName={s.player.lastName} size="sm" src={s.player.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {s.player.firstName} {s.player.lastName}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-muted">
                      Subscriber · OVR {s.player.overall}
                      {rep?.replacement && (
                        <span className="text-pitch-400 ml-2">
                          → {rep.replacement.player.firstName} {rep.replacement.player.lastName}
                        </span>
                      )}
                    </div>
                    <SignupTimestamp signup={s} />
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Button
                        variant="secondary"
                        size="sm"
                        title="Override replacement"
                        onClick={() => setOverrideIdx(overrideIdx === idx ? null : idx)}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </Button>
                      <IconBtn onClick={() => onSetStatus(s.playerId, "IN")} title="Mark as in">
                        <Check className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn onClick={() => onSetStatus(s.playerId, "REMOVE")} variant="danger" title="Remove">
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconBtn>
                    </div>
                  )}
                </div>
                {overrideIdx === idx && (
                  <ReplacementOverrideForm
                    matchId={matchId}
                    declinedIndex={idx}
                    allPlayers={allPlayers}
                    onDone={() => setOverrideIdx(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReplacementOverrideForm({
  matchId,
  declinedIndex,
  allPlayers,
  onDone,
}: {
  matchId: string;
  declinedIndex: number;
  allPlayers: { abos: Player[]; waitlisters: Player[] };
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"guest" | "existing">("existing");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [overall, setOverall] = useState(50);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");

  const submit = () => {
    if (mode === "guest" && !firstName.trim()) return;
    if (mode === "existing" && !selectedPlayerId) return;
    start(async () => {
      if (mode === "guest") {
        await addGuestToMatchAction({
          matchId,
          declinedIndex,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          overall,
        });
      } else {
        const { addExistingPlayerToMatchAction } = await import("@/server/match-actions");
        await addExistingPlayerToMatchAction({
          matchId,
          declinedIndex,
          playerId: selectedPlayerId,
        });
      }
      onDone();
    });
  };

  const canSubmit =
    (mode === "guest" && firstName.trim().length > 0) ||
    (mode === "existing" && selectedPlayerId);

  return (
    <div className="ml-8 mt-1.5 rounded-lg border border-pitch-600/40 bg-pitch-900/20 p-3 space-y-3">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-300">
        Override replacement
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition ${
            mode === "existing" ? "border-pitch-500 bg-pitch-700/20" : "border-border/60 hover:border-pitch-500/40"
          }`}
        >
          <div className="font-semibold">Existing player</div>
          <div className="text-[10px] text-muted">Pick from registered players</div>
        </button>
        <button
          type="button"
          onClick={() => setMode("guest")}
          className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition ${
            mode === "guest" ? "border-pitch-500 bg-pitch-700/20" : "border-border/60 hover:border-pitch-500/40"
          }`}
        >
          <div className="font-semibold">Guest player</div>
          <div className="text-[10px] text-muted">No account needed</div>
        </button>
      </div>

      {mode === "existing" && (
        <div className="grid gap-1.5 max-h-48 overflow-auto scrollbar-thin">
          {allPlayers.waitlisters.map((p) => (
            <label
              key={p.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition ${
                selectedPlayerId === p.id
                  ? "border-pitch-500 bg-pitch-700/20"
                  : "border-border/60 bg-surface/30 hover:border-pitch-500/40"
              }`}
            >
              <input
                type="radio"
                name="overridePlayer"
                value={p.id}
                checked={selectedPlayerId === p.id}
                onChange={() => setSelectedPlayerId(p.id)}
                className="sr-only"
              />
              <Avatar firstName={p.firstName} lastName={p.lastName} size="sm" src={p.avatarUrl} />
              <span className="text-sm flex-1 truncate">{p.firstName} {p.lastName}</span>
              <span className="number-pill text-xs text-muted">OVR {p.overall}</span>
            </label>
          ))}
          {allPlayers.waitlisters.length === 0 && (
            <p className="text-xs text-muted py-2">No waitlist players available.</p>
          )}
        </div>
      )}

      {mode === "guest" && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-32">
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1">First name *</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Name" />
          </div>
          <div className="flex-1 min-w-32">
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1">Last name</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Optional" />
          </div>
          <div className="w-24">
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1">OVR</label>
            <Input type="number" min={0} max={100} value={overall} onChange={(e) => setOverall(Number(e.target.value))} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button onClick={submit} disabled={pending || !canSubmit} size="sm">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
          Assign
        </Button>
        <Button variant="secondary" size="sm" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
      <p className="text-[10px] text-muted">
        Inserts the player into the waitlist at this position. The current replacement shifts to the next slot.
      </p>
    </div>
  );
}

function SignupSection({
  title,
  rows,
  renderActions,
}: {
  title: string;
  rows: MatchView["attendees"];
  renderActions?: (row: MatchView["attendees"][number]) => React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-300 mb-2">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-subtle">—</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((s, idx) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-surface/50 px-3 py-2"
            >
              <span className="number-pill text-xs text-muted w-6">#{idx + 1}</span>
              <Avatar firstName={s.player.firstName} lastName={s.player.lastName} size="sm" src={s.player.avatarUrl} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {s.player.firstName} {s.player.lastName}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted">
                  {s.player.kind === "ABO" ? "Subscriber" : "Waitlist"} · OVR {s.player.overall}
                </div>
                <SignupTimestamp signup={s} />
              </div>
              {renderActions && <div className="flex items-center gap-1.5 ml-auto">{renderActions(s)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  onClick,
  children,
  variant = "secondary",
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "secondary" | "danger";
  title?: string;
}) {
  return (
    <Button onClick={onClick} variant={variant} size="sm" title={title} aria-label={title} className="h-11 w-11 p-0">
      {children}
    </Button>
  );
}

function PaymentControls({ signupId, status }: { signupId: string; status: PaymentStatus }) {
  const [pending, start] = useTransition();
  const cycle = () => {
    const next: PaymentStatus =
      status === "PAID"
        ? "PENDING"
        : status === "CLAIMED"
        ? "PAID"
        : status === "PENDING"
        ? "CLAIMED"
        : "PENDING";
    start(() => setPaymentStatusAction({ signupId, status: next }));
  };
  const labels: Record<PaymentStatus, { tone: "success" | "warn" | "info" | "outline"; icon: React.ReactNode; label: string }> = {
    PAID: { tone: "success", icon: <CheckCircle2 className="h-3 w-3" />, label: "Paid" },
    CLAIMED: { tone: "info", icon: <Clock className="h-3 w-3" />, label: "Awaiting confirmation" },
    PENDING: { tone: "warn", icon: <Clock className="h-3 w-3" />, label: "Payment pending" },
    NONE: { tone: "outline", icon: <CircleDashed className="h-3 w-3" />, label: "no payment" },
  };
  const cur = labels[status];
  return (
    <button
      type="button"
      onClick={cycle}
      disabled={pending}
      className="cursor-pointer disabled:opacity-50"
      title="Cycle payment status"
    >
      <Badge tone={cur.tone}>
        {cur.icon}
        {cur.label}
      </Badge>
    </button>
  );
}

function SignupTimestamp({ signup }: { signup: { createdAt: Date | string; updatedAt: Date | string; status: string } }) {
  const created = new Date(signup.createdAt);
  const updated = new Date(signup.updatedAt);
  const isStatusChange = signup.status === "IN" || signup.status === "OUT";
  const date = isStatusChange && updated.getTime() > created.getTime() ? updated : created;
  const label = signup.status === "IN" ? "Confirmed" : signup.status === "OUT" ? "Declined" : "Joined";
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
  return (
    <div className="text-[10px] text-muted mt-0.5">
      {label} {fmt.format(date)}
    </div>
  );
}
