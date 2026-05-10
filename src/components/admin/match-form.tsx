"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  createMatchAction,
  updateMatchAction,
  type AdminFormState,
} from "@/server/admin-actions";

type Defaults = {
  id?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMin: number;
  location: string | null;
  notes: string | null;
  teamCount: number;
};

export function MatchForm({ defaults }: { defaults?: Defaults }) {
  const isEdit = Boolean(defaults?.id);
  const action = isEdit ? updateMatchAction.bind(null, defaults!.id!) : createMatchAction;
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={defaults?.date ?? ""} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time">Time</Label>
          <Input id="time" name="time" type="time" defaultValue={defaults?.time ?? "20:00"} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationMin">Duration (minutes)</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            min={30}
            max={240}
            defaultValue={defaults?.durationMin ?? 90}
            required
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={defaults?.location ?? ""}
            placeholder="e.g. Riverside pitch"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="teamCount">Number of teams</Label>
          <Select id="teamCount" name="teamCount" defaultValue={String(defaults?.teamCount ?? 2)}>
            <option value="2">2 teams</option>
            <option value="3">3 teams</option>
            <option value="4">4 teams</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={defaults?.notes ?? ""} placeholder="Indoor / outdoor, what to bring, ..." />
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
        {isEdit ? "Save" : "Create match"}
      </Button>
    </form>
  );
}
