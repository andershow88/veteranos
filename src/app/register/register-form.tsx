"use client";

import { useActionState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
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
        <div className="space-y-1.5">
          <Label>Player type *</Label>
          <div className="grid sm:grid-cols-2 gap-2">
            <KindRadio value="ABO" label="Subscriber" description="Fixed slot. Confirm or decline per match." />
            <KindRadio value="WAITLIST" label="Waitlist" description="Sign up per match when there is an open spot." />
          </div>
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

      {state?.error && <Alert tone="danger">{state.error}</Alert>}

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

function KindRadio({
  value,
  label,
  description,
}: {
  value: "ABO" | "WAITLIST";
  label: string;
  description: string;
}) {
  return (
    <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 transition hover:border-pitch-500 has-checked:border-pitch-500 has-checked:bg-pitch-700/20 has-checked:ring-1 has-checked:ring-pitch-500/40">
      <input
        type="radio"
        name="kind"
        value={value}
        required
        className="mt-1 h-4 w-4 accent-pitch-500"
      />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-[11px] text-muted leading-snug">{description}</div>
      </div>
    </label>
  );
}
