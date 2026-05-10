"use client";

import { useActionState } from "react";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { loginAction } from "@/server/auth-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle" />
          <Input id="email" name="email" type="email" autoComplete="email" required className="pl-9" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Passwort</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="pl-9"
          />
        </div>
      </div>

      {state?.error && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Einloggen
      </Button>
    </form>
  );
}
