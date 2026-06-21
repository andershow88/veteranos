"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
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
          <Input id="firstName" name="firstName" autoComplete="given-name" defaultValue={defaults.firstName} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name (optional)</Label>
          <Input id="lastName" name="lastName" autoComplete="family-name" defaultValue={defaults.lastName ?? ""} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nickname">Nickname (optional)</Label>
        <Input id="nickname" name="nickname" autoComplete="nickname" defaultValue={defaults.nickname ?? ""} />
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
        <Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" defaultValue={defaults.phone ?? ""} />
      </div>

      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">Saved.</Alert>}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save
      </Button>
    </form>
  );
}
