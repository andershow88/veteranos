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
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(action, undefined);
  const router = useRouter();

  // Controlled state so the UI reflects the latest server data after save.
  const [date, setDate] = useState(defaults?.date ?? "");
  const [time, setTime] = useState(defaults?.time ?? "20:00");
  const [durationMin, setDurationMin] = useState(String(defaults?.durationMin ?? 90));
  const [location, setLocation] = useState(defaults?.location ?? "");
  const [teamCount, setTeamCount] = useState(String(defaults?.teamCount ?? 2));
  const [notes, setNotes] = useState(defaults?.notes ?? "");
  const [dirty, setDirty] = useState(false);

  useUnsavedWarning(dirty && !pending);

  // revalidatePath alone doesn't reliably re-fetch the current dynamic route
  // in Next 16, so trigger an explicit refresh after every successful save.
  useEffect(() => {
    if (state?.ok) {
      // Reset the unsaved-changes flag after a successful save (intentional).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDirty(false);
      router.refresh();
    }
  }, [state, router]);

  useEffect(() => {
    // Resync controlled inputs to the latest server data after a save +
    // revalidatePath cycle (sync-state-to-props pattern, intentional here).
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

  function cancel() {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    router.back();
  }

  return (
    <form action={formAction} onInput={() => setDirty(true)} className="space-y-5">
      <FormSection title="Match details">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time">Time *</Label>
            <Input id="time" name="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="durationMin">Duration (min) *</Label>
            <Input id="durationMin" name="durationMin" type="number" min={30} max={240} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} required />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Riverside pitch" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="teamCount">Number of teams</Label>
            <Select id="teamCount" name="teamCount" value={teamCount} onChange={(e) => setTeamCount(e.target.value)}>
              <option value="2">2 teams</option>
              <option value="3">3 teams</option>
              <option value="4">4 teams</option>
            </Select>
          </div>
        </div>
      </FormSection>

      <FormSection title="Notes">
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Indoor / outdoor, what to bring, ..." />
        </div>
      </FormSection>

      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">Saved.</Alert>}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save" : "Create match"}
        </Button>
        <Button type="button" variant="ghost" onClick={cancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
