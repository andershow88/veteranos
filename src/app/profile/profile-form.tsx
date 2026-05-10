"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/server/profile-actions";

type Defaults = {
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  paypalName: string | null;
  paypalLink: string | null;
  phone: string | null;
};

export function ProfileForm({ defaults }: { defaults: Defaults }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" defaultValue={defaults.firstName} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name (optional)</Label>
          <Input id="lastName" name="lastName" defaultValue={defaults.lastName ?? ""} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nickname">Nickname (optional)</Label>
        <Input id="nickname" name="nickname" defaultValue={defaults.nickname ?? ""} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="paypalName">PayPal name</Label>
          <Input
            id="paypalName"
            name="paypalName"
            placeholder="e.g. John Smith"
            defaultValue={defaults.paypalName ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="paypalLink">PayPal link</Label>
          <Input
            id="paypalLink"
            name="paypalLink"
            type="url"
            placeholder="https://paypal.me/..."
            defaultValue={defaults.paypalLink ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" defaultValue={defaults.phone ?? ""} />
      </div>

      {state?.error && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-lg border border-pitch-600/40 bg-pitch-700/20 px-3 py-2 text-sm text-pitch-200 inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Saved.
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save
      </Button>
    </form>
  );
}
