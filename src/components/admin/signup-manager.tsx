"use client";

import { useTransition, useState } from "react";
import { Check, X, ListPlus, Trash2, CheckCircle2, Clock, CircleDashed, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import {
  adminSetSignupAction,
  setPaymentStatusAction,
} from "@/server/match-actions";
import type { MatchView } from "@/server/match-queries";
import type { Player, PaymentStatus, SignupStatus } from "@prisma/client";

type Props = {
  view: MatchView;
  allPlayers: { abos: Player[]; waitlisters: Player[] };
};

export function SignupManager({ view, allPlayers }: Props) {
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
      {/* Add manually */}
      <div className="rounded-xl border border-border-strong/60 bg-surface/50 p-4">
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-300 mb-3">
          Add player manually
        </h4>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-45">
            <Select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
              <option value="">Choose player…</option>
              {availableSubs.length > 0 && (
                <optgroup label="Abos">
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

      <SignupSection
        title={`Confirmed (${view.attendees.length})`}
        rows={view.attendees}
        renderActions={(s) => (
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

      <SignupSection
        title={`Declined (${view.declined.length})`}
        rows={view.declined}
        renderActions={(s) => (
          <>
            <IconBtn onClick={() => setStatus(s.playerId, "IN")} title="Mark as in">
              <Check className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn onClick={() => setStatus(s.playerId, "REMOVE")} variant="danger" title="Remove">
              <Trash2 className="h-3.5 w-3.5" />
            </IconBtn>
          </>
        )}
      />

      <SignupSection
        title={`Waitlist (${view.waitlist.length})`}
        rows={view.waitlist}
        renderActions={(s) => (
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

function SignupSection({
  title,
  rows,
  renderActions,
}: {
  title: string;
  rows: MatchView["attendees"];
  renderActions: (row: MatchView["attendees"][number]) => React.ReactNode;
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
              <Avatar firstName={s.player.firstName} lastName={s.player.lastName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {s.player.firstName} {s.player.lastName}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted">
                  {s.player.kind === "ABO" ? "Abo" : "Waitlist"} · OVR {s.player.overall}
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">{renderActions(s)}</div>
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
    <Button onClick={onClick} variant={variant} size="sm" title={title}>
      {children}
    </Button>
  );
}

function PaymentControls({ signupId, status }: { signupId: string; status: PaymentStatus }) {
  const [pending, start] = useTransition();
  const cycle = () => {
    const next: PaymentStatus = status === "PAID" ? "PENDING" : status === "PENDING" ? "PAID" : "PENDING";
    start(() => setPaymentStatusAction({ signupId, status: next }));
  };
  const labels: Record<PaymentStatus, { tone: "success" | "warn" | "outline"; icon: React.ReactNode; label: string }> = {
    PAID: { tone: "success", icon: <CheckCircle2 className="h-3 w-3" />, label: "paid" },
    PENDING: { tone: "warn", icon: <Clock className="h-3 w-3" />, label: "pending" },
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
