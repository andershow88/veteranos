"use client";

import { useState, useTransition } from "react";
import { Save, Loader2, Check, AlertCircle } from "lucide-react";
import { updatePlayerSkillsAction } from "@/server/admin-actions";
import type { Position } from "@prisma/client";

type PlayerRow = {
  id: string;
  firstName: string;
  lastName: string | null;
  kind: "ABO" | "WAITLIST";
  active: boolean;
  position: Position;
  overall: number;
  technique: number;
  speed: number;
  stamina: number;
  defense: number;
  offense: number;
  passing: number;
  shooting: number;
  goalkeeping: number;
};

const SKILL_KEYS = [
  "overall",
  "technique",
  "speed",
  "stamina",
  "defense",
  "offense",
  "passing",
  "shooting",
  "goalkeeping",
] as const;

const SKILL_SHORT: Record<string, string> = {
  overall: "OVR",
  technique: "TEC",
  speed: "SPD",
  stamina: "STA",
  defense: "DEF",
  offense: "OFF",
  passing: "PAS",
  shooting: "SHO",
  goalkeeping: "GK",
};

const POSITIONS: Position[] = ["ANY", "GOALKEEPER", "DEFENDER", "MIDFIELDER", "STRIKER"];
const POS_SHORT: Record<string, string> = {
  ANY: "ANY",
  GOALKEEPER: "GK",
  DEFENDER: "DEF",
  MIDFIELDER: "MID",
  STRIKER: "STR",
};

type RowState = "idle" | "saving" | "saved" | "error";

export function SkillsTable({ players }: { players: PlayerRow[] }) {
  const [rows, setRows] = useState(() =>
    players.map((p) => ({ ...p, _state: "idle" as RowState, _error: "" })),
  );

  function updateCell(idx: number, key: string, value: string | number) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, [key]: value, _state: "idle" as RowState } : r,
      ),
    );
  }

  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="border-b border-border text-left">
          <th className="sticky left-0 z-10 bg-bg-elevated px-3 py-2.5 font-bold text-muted whitespace-nowrap">Player</th>
          <th className="px-2 py-2.5 font-bold text-muted whitespace-nowrap">Type</th>
          <th className="px-2 py-2.5 font-bold text-muted whitespace-nowrap">POS</th>
          {SKILL_KEYS.map((k) => (
            <th key={k} className="px-1.5 py-2.5 font-bold text-muted text-center whitespace-nowrap">
              {SKILL_SHORT[k]}
            </th>
          ))}
          <th className="px-2 py-2.5 font-bold text-muted text-center whitespace-nowrap w-16"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <SkillRow
            key={r.id}
            row={r}
            onChange={(key, val) => updateCell(idx, key, val)}
            onStateChange={(state, error) =>
              setRows((prev) =>
                prev.map((x, i) =>
                  i === idx ? { ...x, _state: state, _error: error ?? "" } : x,
                ),
              )
            }
          />
        ))}
      </tbody>
    </table>
  );
}

function SkillRow({
  row,
  onChange,
  onStateChange,
}: {
  row: PlayerRow & { _state: RowState; _error: string };
  onChange: (key: string, value: string | number) => void;
  onStateChange: (state: RowState, error?: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const isDirty = row._state === "idle";

  function save() {
    onStateChange("saving");
    startTransition(async () => {
      const result = await updatePlayerSkillsAction(row.id, {
        position: row.position,
        overall: row.overall,
        technique: row.technique,
        speed: row.speed,
        stamina: row.stamina,
        defense: row.defense,
        offense: row.offense,
        passing: row.passing,
        shooting: row.shooting,
        goalkeeping: row.goalkeeping,
      });
      if (result.ok) {
        onStateChange("saved");
        setTimeout(() => onStateChange("idle"), 2000);
      } else {
        onStateChange("error", result.error);
      }
    });
  }

  const rowBg = !row.active
    ? "opacity-50"
    : row.kind === "ABO"
    ? ""
    : "bg-surface/30";

  return (
    <tr className={`border-b border-border/40 hover:bg-surface/50 transition ${rowBg}`}>
      <td className="sticky left-0 z-10 bg-bg-elevated px-3 py-1.5 whitespace-nowrap font-medium">
        {row.firstName} {row.lastName}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap">
        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
          row.kind === "ABO" ? "bg-pitch-700/30 text-pitch-300" : "bg-info/20 text-info"
        }`}>
          {row.kind}
        </span>
      </td>
      <td className="px-2 py-1.5">
        <select
          value={row.position}
          onChange={(e) => onChange("position", e.target.value)}
          className="bg-transparent border border-border/60 rounded px-1 py-0.5 text-xs text-foreground focus:border-pitch-500 focus:outline-none w-14"
        >
          {POSITIONS.map((p) => (
            <option key={p} value={p}>{POS_SHORT[p]}</option>
          ))}
        </select>
      </td>
      {SKILL_KEYS.map((k) => (
        <td key={k} className="px-1 py-1.5 text-center">
          <input
            type="number"
            min={0}
            max={100}
            value={row[k]}
            onChange={(e) => onChange(k, Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            className="w-11 bg-transparent border border-border/60 rounded px-1 py-0.5 text-xs text-center text-foreground number-pill focus:border-pitch-500 focus:outline-none"
          />
        </td>
      ))}
      <td className="px-2 py-1.5 text-center">
        {row._state === "saving" || pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-pitch-400 mx-auto" />
        ) : row._state === "saved" ? (
          <Check className="h-3.5 w-3.5 text-pitch-400 mx-auto" />
        ) : row._state === "error" ? (
          <span title={row._error}>
            <AlertCircle className="h-3.5 w-3.5 text-danger mx-auto" />
          </span>
        ) : (
          <button
            onClick={save}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold text-pitch-300 hover:text-pitch-100 hover:bg-pitch-700/30 transition"
            title="Save this row"
          >
            <Save className="h-3 w-3" /> Save
          </button>
        )}
      </td>
    </tr>
  );
}
