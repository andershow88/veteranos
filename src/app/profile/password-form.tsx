"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { PasswordField } from "@/components/ui/password-field";
import { Button } from "@/components/ui/button";
import { changePasswordAction } from "@/server/profile-actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <PasswordField id="currentPassword" name="currentPassword" label="Current password" autoComplete="current-password" required />
        <PasswordField id="newPassword" name="newPassword" label="New password" autoComplete="new-password" minLength={6} required />
      </div>

      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">Password changed.</Alert>}

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Change password
      </Button>
    </form>
  );
}
