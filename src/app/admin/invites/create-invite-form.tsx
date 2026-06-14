"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  createInviteAction,
  type InviteFormState,
} from "@/server/invite-actions";

export function CreateInviteForm() {
  const [state, action, pending] = useActionState<InviteFormState, FormData>(
    createInviteAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="label">Label</Label>
          <Input id="label" name="label" placeholder="e.g. Group chat WhatsApp" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxUses">Max uses</Label>
          <Input
            id="maxUses"
            name="maxUses"
            type="number"
            min={1}
            placeholder="unlimited"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expiresInDays">Valid for X days</Label>
          <Input
            id="expiresInDays"
            name="expiresInDays"
            type="number"
            min={1}
            placeholder="never"
          />
        </div>
      </div>

      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">Created. Copy the link below.</Alert>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Create link
      </Button>
    </form>
  );
}
