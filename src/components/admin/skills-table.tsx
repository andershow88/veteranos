"use client";

import { useState, useMemo, useTransition, useRef, useCallback } from "react";
import { Loader2, Check, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown, Search, X } from "lucide-react";
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
  "overall", "technique", "speed", "stamina",
  "defense", "offense", "passing", "shooting", "goalkeeping",
] as const;

const SKILL_SHORT: Record<string, string> = {
  overall: "OVR", technique: "TEC", speed: "SPD", stamina: "STA",
  defense: "DEF", offense: "OFF", passing: "PAS", shooting: "SHO", goalkeeping: "GK",
};

const POSITIONS: Position[] = ["ANY", "GOALKEEPER", "DEFENDER", "MIDFIELDER", "STRIKER"];
const POS_SHORT: Record<string, string> = {
  ANY: "ANY", GOALKEEPER: "GK", DEFENDER: "DEF", MIDFIELDER: "MID", STRIKER: "STR",
};

type SortKey = "name" | "kind" | "position" | typeof SKILL_KEYS[number];
type SortDir = "asc" | "desc";
type RowState = "idle" | "saving" | "saved" | "error";

export function SkillsTable({ players }: { players: PlayerRow[] }) {
  const [rows, setRows] = useState(() =>
    players.map((p) => ({ ...p, _state: "idle" as RowState, _error: "" })),
  );

  // Filters
  const [search, setSearch] = useState("");
  const [filterKind, setFilterKind] = useState<"ALL" | "ABO" | "WAITLIST">("ALL");
  const [filterPos, setFilterPos] = useState<"ALL" | Position>("ALL");
  const [filterActive, setFilterActive] = useState<"ALL" | "YES" | "NO">("ALL");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const filtered = useMemo(() => {
    let result = rows;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.firstName.toLowerCase().includes(q) ||
          (r.lastName ?? "").toLowerCase().includes(q),
      );
    }
    if (filterKind !== "ALL") result = result.filter((r) => r.kind === filterKind);
    if (filterPos !== "ALL") result = result.filter((r) => r.position === filterPos);
    if (filterActive === "YES") result = result.filter((r) => r.active);
    if (filterActive === "NO") result = result.filter((r) => !r.active);

    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortKey === "kind") {
        cmp = a.kind.localeCompare(b.kind);
      } else if (sortKey === "position") {
        cmp = a.position.localeCompare(b.position);
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, search, filterKind, filterPos, filterActive, sortKey, sortDir]);

  const hasFilters = search || filterKind !== "ALL" || filterPos !== "ALL" || filterActive !== "ALL";

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const autoSave = useCallback((id: string, updated: PlayerRow & { _state: RowState; _error: string }) => {
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, _state: "saving" as RowState } : r));
      const result = await updatePlayerSkillsAction(id, {
        position: updated.position,
        overall: updated.overall,
        technique: updated.technique,
        speed: updated.speed,
        stamina: updated.stamina,
        defense: updated.defense,
        offense: updated.offense,
        passing: updated.passing,
        shooting: updated.shooting,
        goalkeeping: updated.goalkeeping,
      });
      if (result.ok) {
        setRows((prev) => prev.map((r) => r.id === id ? { ...r, _state: "saved" as RowState } : r));
        setTimeout(() => setRows((prev) => prev.map((r) => r.id === id && r._state === "saved" ? { ...r, _state: "idle" as RowState } : r)), 1500);
      } else {
        setRows((prev) => prev.map((r) => r.id === id ? { ...r, _state: "error" as RowState, _error: result.error ?? "" } : r));
      }
    }, 500);
  }, []);

  function updateCell(id: string, key: string, value: string | number) {
    setRows((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, [key]: value, _state: "idle" as RowState } : r,
      );
      const updated = next.find((r) => r.id === id);
      if (updated) autoSave(id, updated);
      return next;
    });
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-2.5 w-2.5 text-pitch-400" />
      : <ArrowDown className="h-2.5 w-2.5 text-pitch-400" />;
  }

  function Th({ col, children, className = "" }: { col: SortKey; children: React.ReactNode; className?: string }) {
    return (
      <th
        onClick={() => toggleSort(col)}
        className={`px-1.5 py-2.5 font-bold text-muted whitespace-nowrap cursor-pointer hover:text-foreground select-none transition ${className}`}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          <SortIcon col={col} />
        </span>
      </th>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border/60">
        <div className="relative flex-1 min-w-40 max-w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player…"
            className="w-full bg-transparent border border-border/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-subtle focus:border-pitch-500 focus:outline-none"
          />
        </div>
        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value as typeof filterKind)}
          className="bg-transparent border border-border/60 rounded-lg px-2 py-1.5 text-xs text-foreground focus:border-pitch-500 focus:outline-none"
        >
          <option value="ALL">All types</option>
          <option value="ABO">Subscriber</option>
          <option value="WAITLIST">Waitlist</option>
        </select>
        <select
          value={filterPos}
          onChange={(e) => setFilterPos(e.target.value as typeof filterPos)}
          className="bg-transparent border border-border/60 rounded-lg px-2 py-1.5 text-xs text-foreground focus:border-pitch-500 focus:outline-none"
        >
          <option value="ALL">All positions</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>{POS_SHORT[p]}</option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as typeof filterActive)}
          className="bg-transparent border border-border/60 rounded-lg px-2 py-1.5 text-xs text-foreground focus:border-pitch-500 focus:outline-none"
        >
          <option value="ALL">Active & inactive</option>
          <option value="YES">Active only</option>
          <option value="NO">Inactive only</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setFilterKind("ALL"); setFilterPos("ALL"); setFilterActive("ALL"); }}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted hover:text-danger transition"
            title="Clear all filters"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
        <span className="text-[10px] text-muted ml-auto">
          {filtered.length} of {rows.length}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <Th col="name" className="sticky left-0 z-10 bg-bg-elevated px-3">Player</Th>
              <Th col="kind" className="px-2">Type</Th>
              <Th col="position" className="px-2">POS</Th>
              {SKILL_KEYS.map((k) => (
                <Th key={k} col={k} className="text-center">{SKILL_SHORT[k]}</Th>
              ))}
              <th className="px-2 py-2.5 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-sm text-subtle">
                  No players match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <SkillRow
                  key={r.id}
                  row={r}
                  onChange={(key, val) => updateCell(r.id, key, val)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SkillRow({
  row,
  onChange,
}: {
  row: PlayerRow & { _state: RowState; _error: string };
  onChange: (key: string, value: string | number) => void;
}) {
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
      <td className="px-2 py-1.5 text-center w-8">
        {row._state === "saving" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-pitch-400 mx-auto" />
        ) : row._state === "saved" ? (
          <Check className="h-3.5 w-3.5 text-pitch-400 mx-auto" />
        ) : row._state === "error" ? (
          <span title={row._error}>
            <AlertCircle className="h-3.5 w-3.5 text-danger mx-auto" />
          </span>
        ) : null}
      </td>
    </tr>
  );
}
