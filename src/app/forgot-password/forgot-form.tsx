"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
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

  if (state?.status === "sent") {
    return (
      <Alert tone="success">
        <span>
          If a matching account exists, a password reset link has been emailed to its
          registered address. The link expires in 12 hours. If you don&apos;t receive it,
          contact an admin.
        </span>
      </Alert>
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

      {state?.status === "error" && <Alert tone="danger">{state.error}</Alert>}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Email me a reset link
      </Button>
    </form>
  );
}
