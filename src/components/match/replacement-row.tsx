"use client";

import { useTransition } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CircleDashed,
  ExternalLink,
  Wallet,
  Send,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  claimPaymentAction,
  unclaimPaymentAction,
  confirmPaymentAction,
  disputePaymentAction,
} from "@/server/match-actions";
import type { ReplacementInfo } from "@/server/match-queries";

type CurrentPlayerCtx = {
  playerId: string | null;
  kind: "ABO" | "WAITLIST" | null;
  role: "ADMIN" | "PLAYER" | null;
};

export function ReplacementRow({
  info,
  index,
  currentPlayer,
}: {
  info: ReplacementInfo;
  index: number;
  currentPlayer?: CurrentPlayerCtx;
}) {
  const [pending, start] = useTransition();

  const isWaitlistMe = !!info.replacement && currentPlayer?.playerId === info.replacement.playerId;
  const isAboMe = currentPlayer?.playerId === info.abo.id;
  const signupId = info.replacement?.id ?? "";

  return (
    <div className="rounded-xl border border-border/60 bg-surface/50 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-pitch-300 number-pill">#{index + 1}</span>

        {/* Out: abo */}
        <div className="flex items-center gap-2 min-w-0">
          <Avatar firstName={info.abo.firstName} lastName={info.abo.lastName} size="sm" src={info.abo.avatarUrl} />
          <div className="min-w-0">
            <div className="text-sm text-foreground/80 line-through decoration-red-400/50 truncate">
              {info.abo.firstName} {info.abo.lastName}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-red-300/80">
              Subscriber · declined
            </div>
          </div>
        </div>

        <ArrowRight className="h-4 w-4 text-muted shrink-0" />

        {/* Replacement */}
        {info.replacement ? (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              firstName={info.replacement.player.firstName}
              lastName={info.replacement.player.lastName}
              size="sm"
              src={info.replacement.player.avatarUrl}
            />
            <div className="min-w-0">
              <div className="text-sm font-medium text-pitch-100 truncate">
                {info.replacement.player.firstName} {info.replacement.player.lastName}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-pitch-300/80">
                Waitlist · stepping in
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted italic">No replacement available</div>
        )}

        {/* Payment badge is private to the two parties involved. Bystanders
            (including admins viewing the public homepage card) don't see it.
            Admins still get the full picture in /admin/matches/[id]. */}
        {(isWaitlistMe || isAboMe) && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <PaymentBadge status={info.paymentStatus} />
          </div>
        )}
      </div>

      {/* Payment action bar — only visible to the abo and the waitlist replacement. */}
      {info.replacement && info.paymentStatus !== "NONE" && (isWaitlistMe || isAboMe) && (
        <div className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2 space-y-2">
          {/* Waitlist player's view */}
          {isWaitlistMe && info.paymentStatus === "PENDING" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-0 text-xs text-muted">
                <span className="font-semibold text-foreground">You owe</span> {info.abo.firstName} for taking their spot.
                {!info.abo.paypalLink && !info.abo.paypalName && (
                  <span className="block text-[11px] text-amber-300/80 mt-1">
                    No PayPal info on file — coordinate payment directly, then mark as paid.
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {info.abo.paypalLink && (
                  <a
                    href={info.abo.paypalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-pitch-600/50 bg-pitch-700/20 px-2.5 py-1 text-[11px] font-semibold text-pitch-100 hover:bg-pitch-700/40 transition"
                  >
                    <Wallet className="h-3 w-3" />
                    PayPal {info.abo.firstName}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {!info.abo.paypalLink && info.abo.paypalName && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface-2 px-2.5 py-1 text-[11px] text-foreground/80">
                    <Wallet className="h-3 w-3 text-pitch-300" />
                    {info.abo.paypalName}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  disabled={pending}
                  onClick={() => start(() => claimPaymentAction(signupId))}
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Mark as paid
                </Button>
              </div>
            </div>
          )}

          {isWaitlistMe && info.paymentStatus === "CLAIMED" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-0 text-xs text-muted">
                <span className="font-semibold text-foreground">You marked this as paid.</span>{" "}
                Waiting for {info.abo.firstName} to confirm.
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => start(() => unclaimPaymentAction(signupId))}
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Unmark
              </Button>
            </div>
          )}

          {/* Abo player's view */}
          {isAboMe && info.paymentStatus === "PENDING" && (
            <div className="text-xs text-muted">
              Waiting for <span className="font-semibold text-foreground">{info.replacement.player.firstName}</span> to pay you and mark it.
            </div>
          )}

          {isAboMe && info.paymentStatus === "CLAIMED" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-0 text-xs text-muted">
                <span className="font-semibold text-foreground">{info.replacement.player.firstName}</span> marked this as paid. Did you receive it?
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => start(() => disputePaymentAction(signupId))}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Not received
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={pending}
                  onClick={() => start(() => confirmPaymentAction(signupId))}
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Confirm received
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment note also stays between the two parties. */}
      {info.paymentNote && (isWaitlistMe || isAboMe) && (
        <div className="text-xs text-muted italic">&ldquo;{info.paymentNote}&rdquo;</div>
      )}
    </div>
  );
}

function PaymentBadge({ status }: { status: ReplacementInfo["paymentStatus"] }) {
  if (status === "PAID")
    return (
      <Badge tone="success">
        <CheckCircle2 className="h-3 w-3" /> Paid
      </Badge>
    );
  if (status === "CLAIMED")
    return (
      <Badge tone="info">
        <Clock className="h-3 w-3" /> Awaiting confirmation
      </Badge>
    );
  if (status === "PENDING")
    return (
      <Badge tone="warn">
        <Clock className="h-3 w-3" /> Payment pending
      </Badge>
    );
  return (
    <Badge tone="outline">
      <CircleDashed className="h-3 w-3" /> –
    </Badge>
  );
}
