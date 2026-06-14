"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changePasswordAction } from "@/server/profile-actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input id="currentPassword" name="currentPassword" type="password" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" name="newPassword" type="password" minLength={6} required />
        </div>
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
