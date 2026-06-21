"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-[11px] font-semibold text-pitch-300 hover:text-pitch-200 transition"
          >
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle" />
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            className="pl-9"
          />
        </div>
      </div>

      {state?.error && <Alert tone="danger">{state.error}</Alert>}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Sign in
      </Button>
    </form>
  );
}
