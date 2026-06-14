"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export type PlayerRow = {
  id: string;
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  kind: "ABO" | "WAITLIST";
  active: boolean;
  rank: number;
  overall: number;
  email: string | null;
};

type SortKey = "name" | "rank" | "overall";

const selectCls =
  "h-10 rounded-xl border border-border/60 bg-surface/50 px-2 text-sm text-foreground focus:border-pitch-500 focus:outline-none";

export function PlayersAdmin({ players }: { players: PlayerRow[] }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"ALL" | "ABO" | "WAITLIST">("ALL");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [sort, setSort] = useState<SortKey>("name");

  const filtered = useMemo(() => {
    let r = players;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((p) =>
        `${p.firstName} ${p.lastName ?? ""} ${p.nickname ?? ""}`.toLowerCase().includes(q),
      );
    }
    if (kind !== "ALL") r = r.filter((p) => p.kind === kind);
    if (status === "ACTIVE") r = r.filter((p) => p.active);
    if (status === "INACTIVE") r = r.filter((p) => !p.active);
    return [...r].sort((a, b) => {
      if (sort === "rank") return a.rank - b.rank;
      if (sort === "overall") return b.overall - a.overall;
      return `${a.firstName} ${a.lastName ?? ""}`.localeCompare(`${b.firstName} ${b.lastName ?? ""}`);
    });
  }, [players, search, kind, status, sort]);

  const hasFilters = Boolean(search) || kind !== "ALL" || status !== "ALL";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-44 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players…"
            aria-label="Search players"
            className="h-10 w-full rounded-xl border border-border/60 bg-surface/50 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-pitch-500 focus:outline-none"
          />
        </div>
        <select aria-label="Filter by type" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={selectCls}>
          <option value="ALL">All types</option>
          <option value="ABO">Subscribers</option>
          <option value="WAITLIST">Waitlist</option>
        </select>
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectCls}>
          <option value="ALL">Active &amp; inactive</option>
          <option value="ACTIVE">Active only</option>
          <option value="INACTIVE">Inactive only</option>
        </select>
        <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
          <option value="name">Sort: Name</option>
          <option value="rank">Sort: Rank</option>
          <option value="overall">Sort: OVR</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(""); setKind("ALL"); setStatus("ALL"); }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition hover:text-danger"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
        <span className="ml-auto text-xs text-muted">{filtered.length} of {players.length}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-surface/40 px-4 py-10 text-center text-sm text-muted">
          No players match your filters.
        </p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/admin/players/${p.id}`}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-surface/50 px-3 py-2.5 transition hover:border-pitch-500"
            >
              <Avatar firstName={p.firstName} lastName={p.lastName} size="md" src={p.avatarUrl} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {p.firstName} {p.lastName}
                  {p.nickname && <span className="font-normal text-muted"> &ldquo;{p.nickname}&rdquo;</span>}
                </div>
                <div className="text-xs text-muted">
                  Rank #{p.rank} · {p.email ?? "no login"} · OVR {p.overall}
                </div>
              </div>
              <Badge tone={p.kind === "ABO" ? "success" : "info"}>
                {p.kind === "ABO" ? "Subscriber" : "Waitlist"}
              </Badge>
              {!p.active && <Badge tone="warn">inactive</Badge>}
              <Pencil className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
