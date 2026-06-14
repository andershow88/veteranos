"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { Alert } from "@/components/ui/alert";
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
        <Alert tone="success">
          <span>Identity confirmed. Continue to choose a new password — the link expires in one hour.</span>
        </Alert>
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
        <Alert tone="warning">
          <span>
            That first and last name don&apos;t match a player on file (or match more than one). Please contact an admin to generate a reset link for you.
          </span>
        </Alert>
      )}
      {state?.status === "error" && <Alert tone="danger">{state.error}</Alert>}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Generate reset link
      </Button>
    </form>
  );
}
