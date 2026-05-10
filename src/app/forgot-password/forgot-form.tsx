"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  requestPasswordResetAction,
  type ForgotState,
} from "@/server/password-reset-actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(
    requestPasswordResetAction,
    undefined,
  );

  if (state?.status === "ok") {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-pitch-600/40 bg-pitch-700/15 px-3 py-2 text-sm text-pitch-200 inline-flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            {state.emailDelivered
              ? "Reset link sent to the email on file. Check your inbox — it expires in one hour."
              : "Reset link generated. Email delivery is not configured on this server, so please ask the admin for the link."}
          </span>
        </div>
        <p className="text-xs text-subtle">
          You can close this page now.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name *</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name *</Label>
          <Input id="lastName" name="lastName" required />
        </div>
      </div>

      {state?.status === "name_mismatch" && (
        <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-3 py-2 text-sm text-amber-200 inline-flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            That first and last name don&apos;t match a player on file (or match more than one). Please contact an admin to generate a reset link for you.
          </span>
        </div>
      )}
      {state?.status === "error" && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send reset link
      </Button>
    </form>
  );
}
