"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { registerAction } from "@/server/auth-actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Vorname</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Nachname</Label>
          <Input id="lastName" name="lastName" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Passwort</Label>
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
        Account anlegen
      </Button>
    </form>
  );
}
