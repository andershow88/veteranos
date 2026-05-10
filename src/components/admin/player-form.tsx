"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  createPlayerAction,
  updatePlayerAction,
  deletePlayerAction,
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

  const skill = (k: keyof Player, label: string) => (
    <SkillField name={k as string} label={label} defaultValue={(player?.[k] as number) ?? 50} />
  );

  return (
    <form action={formAction} className="space-y-6">
      <Section title="Persönliche Daten">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field name="firstName" label="Vorname" required defaultValue={player?.firstName ?? ""} />
          <Field name="lastName" label="Nachname" required defaultValue={player?.lastName ?? ""} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field name="nickname" label="Spitzname" defaultValue={player?.nickname ?? ""} />
          <Field name="phone" label="Telefon" defaultValue={player?.phone ?? ""} />
        </div>
      </Section>

      <Section title="Spieler-Typ">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="kind">Typ</Label>
            <Select id="kind" name="kind" defaultValue={player?.kind ?? "SUBSCRIBER"}>
              <option value="SUBSCRIBER">Abo-Spieler</option>
              <option value="WAITLIST">Wartelisten-Spieler</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rank">Reihenfolge (rank)</Label>
            <Input id="rank" name="rank" type="number" min={0} defaultValue={player?.rank ?? 0} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="position">Bevorzugte Position</Label>
            <Select id="position" name="position" defaultValue={player?.position ?? "ANY"}>
              <option value="ANY">Egal</option>
              <option value="GOALKEEPER">Torwart</option>
              <option value="DEFENDER">Defensive</option>
              <option value="MIDFIELDER">Mittelfeld</option>
              <option value="STRIKER">Sturm</option>
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
          aktiv (in Termin-Listen sichtbar)
        </label>
      </Section>

      <Section title="Bezahlung">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field name="paypalName" label="PayPal Name" defaultValue={player?.paypalName ?? ""} />
          <Field name="paypalLink" label="PayPal Link" type="url" placeholder="https://paypal.me/..." defaultValue={player?.paypalLink ?? ""} />
        </div>
      </Section>

      <Section title="Skills (0–100)">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skill("overall", "Gesamtstärke")}
          {skill("technique", "Technik")}
          {skill("speed", "Geschwindigkeit")}
          {skill("stamina", "Ausdauer")}
          {skill("defense", "Defensive")}
          {skill("offense", "Offensive")}
          {skill("passing", "Passspiel")}
          {skill("shooting", "Schuss")}
          {skill("goalkeeping", "Torwartfähigkeit")}
        </div>
      </Section>

      <Section title="Notizen">
        <Textarea name="notes" defaultValue={player?.notes ?? ""} placeholder="Sonstige Eigenschaften, Spielweise, ..." />
      </Section>

      <Section title="Account (optional)">
        <p className="text-xs text-muted mb-3">
          Wenn der Spieler sich einloggen können soll, hier Email & Passwort setzen.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            name="email"
            label="Email"
            type="email"
            defaultValue={player?.email ?? ""}
            placeholder="spieler@example.com"
          />
          <Field
            name="password"
            label={isEdit ? "Neues Passwort (leer lassen, um nicht zu ändern)" : "Passwort"}
            type="password"
          />
        </div>
      </Section>

      {state?.error && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-lg border border-pitch-600/40 bg-pitch-700/20 px-3 py-2 text-sm text-pitch-200 inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Gespeichert.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Speichern" : "Spieler anlegen"}
        </Button>
        {isEdit && (
          <DeleteButton playerId={player!.id!} />
        )}
      </div>
    </form>
  );
}

function DeleteButton({ playerId }: { playerId: string }) {
  const action = deletePlayerAction.bind(null, playerId);
  return (
    <form
      action={action}
      className="inline"
      onSubmit={(e) => {
        if (!confirm("Diesen Spieler wirklich löschen?")) e.preventDefault();
      }}
    >
      <Button type="submit" variant="danger" size="sm">
        Spieler löschen
      </Button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-2xl border border-border/60 bg-surface/40 p-4 sm:p-5">
      <legend className="px-2 text-xs font-bold uppercase tracking-[0.2em] text-pitch-300">{title}</legend>
      {children}
    </fieldset>
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
      <Label htmlFor={name}>{label}</Label>
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
