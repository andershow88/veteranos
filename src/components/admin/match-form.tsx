"use client";

import { useActionState, useEffect, useState } from "react";
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

  // Controlled state so the UI reflects the latest server data after save.
  // useEffect re-syncs whenever the parent passes new defaults (i.e. after
  // a successful update + revalidatePath).
  const [date, setDate] = useState(defaults?.date ?? "");
  const [time, setTime] = useState(defaults?.time ?? "20:00");
  const [durationMin, setDurationMin] = useState(String(defaults?.durationMin ?? 90));
  const [location, setLocation] = useState(defaults?.location ?? "");
  const [teamCount, setTeamCount] = useState(String(defaults?.teamCount ?? 2));
  const [notes, setNotes] = useState(defaults?.notes ?? "");

  useEffect(() => {
    // Resync controlled inputs to the latest server data after a save +
    // revalidatePath cycle. This is the "sync state to props" pattern the
    // lint rule discourages by default, but is the right call here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(defaults?.date ?? "");
    setTime(defaults?.time ?? "20:00");
    setDurationMin(String(defaults?.durationMin ?? 90));
    setLocation(defaults?.location ?? "");
    setTeamCount(String(defaults?.teamCount ?? 2));
    setNotes(defaults?.notes ?? "");
  }, [
    defaults?.date,
    defaults?.time,
    defaults?.durationMin,
    defaults?.location,
    defaults?.teamCount,
    defaults?.notes,
  ]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            name="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationMin">Duration (minutes)</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            min={30}
            max={240}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
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
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Riverside pitch"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="teamCount">Number of teams</Label>
          <Select
            id="teamCount"
            name="teamCount"
            value={teamCount}
            onChange={(e) => setTeamCount(e.target.value)}
          >
            <option value="2">2 teams</option>
            <option value="3">3 teams</option>
            <option value="4">4 teams</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Indoor / outdoor, what to bring, ..."
        />
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
