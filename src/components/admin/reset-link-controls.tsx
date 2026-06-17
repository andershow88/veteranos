"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2, Copy, Check, Mail } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { adminGenerateResetLinkAction } from "@/server/password-reset-actions";

export function ResetLinkControls({ userId }: { userId: string }) {
  const [pending, start] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [emailDelivered, setEmailDelivered] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = () => {
    setError(null);
    setCopied(false);
    start(async () => {
      try {
        const result = await adminGenerateResetLinkAction(userId);
        setLink(result.url);
        setEmailDelivered(result.emailDelivered);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate link");
      }
    });
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-3">
      <Button onClick={generate} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Generate password reset link
      </Button>

      {link && (
        <div className="space-y-2 rounded-xl border border-border/60 bg-surface/50 p-3">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-300 inline-flex items-center gap-2">
            {emailDelivered ? (
              <>
                <Mail className="h-3 w-3" /> Sent to user&apos;s email
              </>
            ) : (
              <>
                <Mail className="h-3 w-3" /> Email NOT sent (no provider configured)
              </>
            )}
          </div>
          <code className="block break-all text-xs text-foreground/90">{link}</code>
          <div className="flex flex-wrap gap-2">
            <Button onClick={copy} variant="secondary" size="sm">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
          <p className="text-[11px] text-subtle">
            Link expires in 12 hours. The previous reset links for this user are invalidated as soon as one is used.
          </p>
        </div>
      )}

      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
