"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useUnsavedWarning } from "@/components/use-unsaved-warning";
import {
  createPlayerAction,
  updatePlayerAction,
  type AdminFormState,
} from "@/server/admin-actions";
import type { Player } from "@prisma/client";

type Defaults = Partial<Player> & { email?: string | null };

export function PlayerForm({ player }: { player?: Defaults }) {
  const isEdit = Boolean(player?.id);
  const action = isEdit ? updatePlayerAction.bind(null, player!.id!) : createPlayerAction;
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    action,
    undefined,
  );
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  useUnsavedWarning(dirty && !pending);
  useEffect(() => {
    // Reset the unsaved-changes flag after a successful save (intentional).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state?.ok) setDirty(false);
  }, [state]);

  function cancel() {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    router.back();
  }

  const skill = (k: keyof Player, label: string) => (
    <SkillField name={k as string} label={label} defaultValue={(player?.[k] as number) ?? 50} />
  );

  return (
    <form action={formAction} onInput={() => setDirty(true)} className="space-y-6">
      <FormSection title="Personal details">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field name="firstName" label="First name" required defaultValue={player?.firstName ?? ""} />
          <Field name="lastName" label="Last name" required defaultValue={player?.lastName ?? ""} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field name="nickname" label="Nickname" defaultValue={player?.nickname ?? ""} />
          <Field name="phone" label="Phone" type="tel" defaultValue={player?.phone ?? ""} />
        </div>
      </FormSection>

      <FormSection title="Player type">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="kind">Type</Label>
            <Select id="kind" name="kind" defaultValue={player?.kind ?? "ABO"}>
              <option value="ABO">Subscriber</option>
              <option value="WAITLIST">Waitlist</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rank">Order (rank)</Label>
            <Input id="rank" name="rank" type="number" min={0} defaultValue={player?.rank ?? 0} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="position">Preferred position</Label>
            <Select id="position" name="position" defaultValue={player?.position ?? "ANY"}>
              <option value="ANY">Any</option>
              <option value="GOALKEEPER">Goalkeeper</option>
              <option value="DEFENDER">Defender</option>
              <option value="MIDFIELDER">Midfielder</option>
              <option value="STRIKER">Striker</option>
            </Select>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 mt-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={player?.active ?? true}
            className="h-4 w-4 rounded border-border-strong bg-surface"
          />
          active (visible in match lists)
        </label>
      </FormSection>

      <FormSection title="Payment">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field name="paypalName" label="PayPal name" defaultValue={player?.paypalName ?? ""} />
          <Field name="paypalLink" label="PayPal link" type="url" placeholder="https://paypal.me/..." defaultValue={player?.paypalLink ?? ""} />
        </div>
      </FormSection>

      <FormSection title="Skills (0–100)">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skill("overall", "Overall")}
          {skill("technique", "Technique")}
          {skill("speed", "Speed")}
          {skill("stamina", "Stamina")}
          {skill("defense", "Defense")}
          {skill("offense", "Offense")}
          {skill("passing", "Passing")}
          {skill("shooting", "Shooting")}
          {skill("goalkeeping", "Goalkeeping")}
        </div>
      </FormSection>

      <FormSection title="Notes">
        <Textarea name="notes" defaultValue={player?.notes ?? ""} placeholder="Other traits, play style, ..." />
      </FormSection>

      <FormSection title="Account (optional)">
        <p className="text-xs text-muted mb-3">
          Set email and password if this player should be able to log in.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            name="email"
            label="Email"
            type="email"
            defaultValue={player?.email ?? ""}
            placeholder="player@example.com"
          />
          <Field
            name="password"
            label={isEdit ? "New password (leave blank to keep)" : "Password"}
            type="password"
          />
        </div>
      </FormSection>

      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">Saved.</Alert>}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save" : "Create player"}
        </Button>
        <Button type="button" variant="ghost" onClick={cancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
  type,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        type={type}
        placeholder={placeholder}
      />
    </div>
  );
}

function SkillField({ name, label, defaultValue }: { name: string; label: string; defaultValue: number }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={name}
          name={name}
          type="number"
          min={0}
          max={100}
          defaultValue={defaultValue}
          className="w-24"
        />
        <div className="h-2 flex-1 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-pitch-500 to-pitch-300"
            style={{ width: `${defaultValue}%` }}
          />
        </div>
      </div>
    </div>
  );
}
