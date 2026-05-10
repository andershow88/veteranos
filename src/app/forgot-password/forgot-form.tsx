"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
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
      <div className="space-y-4">
        <div className="rounded-lg border border-pitch-600/40 bg-pitch-700/15 px-3 py-2 text-sm text-pitch-200 inline-flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Identity confirmed. Continue to choose a new password — the link expires in one hour.</span>
        </div>
        <Link href={state.url}>
          <Button size="lg" className="w-full">
            Set new password
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
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
