"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import {
  resetPasswordAction,
  type ResetState,
} from "@/server/password-reset-actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(
    resetPasswordAction,
    undefined,
  );

  if (state?.status === "ok") {
    return (
      <div className="space-y-3">
        <Alert tone="success">
          <span>Password updated. You can now log in.</span>
        </Alert>
        <Link href="/login">
          <Button size="lg" className="w-full">Go to login</Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <PasswordField id="password" name="password" label="New password" autoComplete="new-password" minLength={6} required />

      {state?.error && <Alert tone="danger">{state.error}</Alert>}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Set new password
      </Button>
    </form>
  );
}
