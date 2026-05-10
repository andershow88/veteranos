import { ArrowRight, CheckCircle2, Clock, CircleDashed, ExternalLink, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ReplacementInfo } from "@/server/match-queries";

export function ReplacementRow({ info, index }: { info: ReplacementInfo; index: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/50 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-pitch-300 number-pill">#{index + 1}</span>

        {/* Out: abo */}
        <div className="flex items-center gap-2 min-w-0">
          <Avatar firstName={info.abo.firstName} lastName={info.abo.lastName} size="sm" />
          <div className="min-w-0">
            <div className="text-sm text-foreground/80 line-through decoration-red-400/50 truncate">
              {info.abo.firstName} {info.abo.lastName}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-red-300/80">
              Abo · declined
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

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <PaymentBadge status={info.paymentStatus} />
          {info.abo.paypalLink && (
            <a
              href={info.abo.paypalLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-pitch-600/50 bg-pitch-700/20 px-2.5 py-1 text-[11px] font-semibold text-pitch-100 hover:bg-pitch-700/40 transition"
            >
              <Wallet className="h-3 w-3" />
              Pay {info.abo.firstName}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {!info.abo.paypalLink && info.abo.paypalName && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface-2 px-2.5 py-1 text-[11px] text-foreground/80">
              <Wallet className="h-3 w-3 text-pitch-300" />
              {info.abo.paypalName}
            </span>
          )}
        </div>
      </div>

      {info.paymentNote && (
        <div className="mt-2 text-xs text-muted italic">&ldquo;{info.paymentNote}&rdquo;</div>
      )}
    </div>
  );
}

function PaymentBadge({ status }: { status: ReplacementInfo["paymentStatus"] }) {
  if (status === "PAID")
    return (
      <Badge tone="success">
        <CheckCircle2 className="h-3 w-3" /> paid
      </Badge>
    );
  if (status === "PENDING")
    return (
      <Badge tone="warn">
        <Clock className="h-3 w-3" /> pending
      </Badge>
    );
  return (
    <Badge tone="outline">
      <CircleDashed className="h-3 w-3" /> –
    </Badge>
  );
}
