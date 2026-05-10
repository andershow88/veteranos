"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Power, PowerOff, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  revokeInviteAction,
  deleteInviteAction,
} from "@/server/invite-actions";

type InviteVM = {
  id: string;
  token: string;
  label: string | null;
  active: boolean;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
  expired: boolean;
  url: string;
};

export function InviteRow({ invite }: { invite: InviteVM }) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const usable = invite.active && !invite.expired && (invite.maxUses == null || invite.uses < invite.maxUses);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invite.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-surface/50 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">
            {invite.label ?? "(no label)"}
          </div>
          <div className="text-xs text-muted truncate">
            {invite.url}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {usable ? (
            <Badge tone="success">active</Badge>
          ) : invite.expired ? (
            <Badge tone="warn">expired</Badge>
          ) : !invite.active ? (
            <Badge tone="default">revoked</Badge>
          ) : (
            <Badge tone="warn">used up</Badge>
          )}
          <Badge tone="outline">
            {invite.uses}{invite.maxUses != null ? `/${invite.maxUses}` : ""} uses
          </Badge>
          {invite.expiresAt && (
            <Badge tone="outline">until {invite.expiresAt}</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={copy} variant="secondary" size="sm">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </Button>

        {invite.active ? (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => revokeInviteAction(invite.id))}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PowerOff className="h-3.5 w-3.5" />}
            Revoke
          </Button>
        ) : (
          <Badge tone="default">
            <Power className="h-3 w-3" /> revoked
          </Badge>
        )}

        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (!confirm("Really delete this invitation?")) return;
            startTransition(() => deleteInviteAction(invite.id));
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}
