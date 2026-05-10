"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
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
        <div className="rounded-lg border border-pitch-600/40 bg-pitch-700/15 px-3 py-2 text-sm text-pitch-200 inline-flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Password updated. You can now log in.</span>
        </div>
        <Link href="/login">
          <Button size="lg" className="w-full">Go to login</Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-1.5">
        <Label htmlFor="password">New password *</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>

      {state?.error && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Set new password
      </Button>
    </form>
  );
}
