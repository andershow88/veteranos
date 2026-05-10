"use client";

import { useActionState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { registerAction } from "@/server/auth-actions";

export function RegisterForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="invite" value={token} />

      <div className="rounded-lg border border-pitch-600/40 bg-pitch-700/15 px-3 py-2 text-xs text-pitch-200 inline-flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5" /> Invitation valid
      </div>

      <Section title="Required">
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
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
      </Section>

      <Section title="Optional">
        <div className="space-y-1.5">
          <Label htmlFor="nickname">Nickname</Label>
          <Input id="nickname" name="nickname" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="paypalName">PayPal name</Label>
            <Input id="paypalName" name="paypalName" placeholder="e.g. John Smith" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paypalLink">PayPal link</Label>
            <Input
              id="paypalLink"
              name="paypalLink"
              type="url"
              placeholder="https://paypal.me/..."
            />
          </div>
        </div>
      </Section>

      {state?.error && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Create account
      </Button>

      <p className="text-[11px] text-subtle text-center">
        Skills, position and admin notes are managed by an admin and visible in your profile.
      </p>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-2xl border border-border/60 bg-surface/40 p-4">
      <legend className="px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-pitch-300">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
