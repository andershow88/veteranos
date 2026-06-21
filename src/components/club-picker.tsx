"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, Loader2, Search, X } from "lucide-react";
import { CLUBS, type Club } from "@/lib/clubs";
import { setClubAction } from "@/server/profile-actions";
import { computeClubVars, CLUB_VARS } from "@/lib/club-theme";

export function ClubPicker({ currentSlug }: { currentSlug: string | null }) {
  const [selected, setSelected] = useState(currentSlug ?? "none");
  const [search, setSearch] = useState("");
  const [saving, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const filtered = CLUBS.filter(
    (c) => c.slug === "none" || c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const br1 = filtered.filter((c) => c.slug.startsWith("br1_"));
  const br2 = filtered.filter((c) => c.slug.startsWith("br2_"));
  const eu = filtered.filter((c) => c.slug.startsWith("eu_"));
  const none = filtered.filter((c) => c.slug === "none");

  function pick(slug: string) {
    setSelected(slug);
    setSaved(false);
    startTransition(async () => {
      const result = await setClubAction(slug === "none" ? null : slug);
      if (result.ok) {
        setSaved(true);
        // Apply theme immediately
        const club = CLUBS.find((c) => c.slug === slug);
        if (club) applyClubTheme(club);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search club..."
          className="w-full bg-transparent border border-border/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-pitch-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-pitch-500/60"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-xs text-pitch-400">
          <Check className="h-3.5 w-3.5" /> Club saved!
        </div>
      )}

      {none.length > 0 && (
        <ClubGrid title="" clubs={none} selected={selected} onPick={pick} />
      )}
      {br2.length > 0 && (
        <ClubGrid title="Brazil — Série A" clubs={br2} selected={selected} onPick={pick} />
      )}
      {br1.length > 0 && (
        <ClubGrid title="Brazil — Série B" clubs={br1} selected={selected} onPick={pick} />
      )}
      {eu.length > 0 && (
        <ClubGrid title="Europe" clubs={eu} selected={selected} onPick={pick} />
      )}
    </div>
  );
}

function ClubGrid({ title, clubs, selected, onPick }: { title: string; clubs: Club[]; selected: string; onPick: (slug: string) => void }) {
  return (
    <div>
      {title && <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">{title}</div>}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {clubs.map((c) => (
          <button
            key={c.slug}
            onClick={() => onPick(c.slug)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 transition-all duration-200 hover:scale-105 ${
              selected === c.slug
                ? "border-pitch-500 bg-pitch-700/20 shadow-lg shadow-pitch-500/20 ring-2 ring-pitch-500/30"
                : "border-border/40 bg-surface/30 hover:border-pitch-500/40 hover:shadow-md"
            }`}
            title={c.name}
          >
            {c.badge ? (
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white shadow-sm">
                <Image src={c.badge} alt={c.name} width={56} height={56} className="h-full w-full object-contain p-1" />
              </span>
            ) : (
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-surface/60 text-muted text-lg">—</span>
            )}
            <span className="text-[9px] font-medium text-foreground/80 text-center leading-tight line-clamp-2 w-full">
              {c.name}
            </span>
            {selected === c.slug && (
              <Check className="h-3 w-3 text-pitch-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function applyClubTheme(club: Club) {
  const root = document.documentElement;
  const s = root.style;

  if (club.slug === "none") {
    root.classList.remove("club-theme", "club-tricolor");
    CLUB_VARS.forEach((p) => s.removeProperty(p));
    localStorage.removeItem("club-theme");
    return;
  }

  const isDark = root.classList.contains("dark");
  const vars = computeClubVars(club.primaryColor, club.secondaryColor, club.tertiaryColor ?? null, isDark);
  // Clear a stale tricolor var when switching to a club without one.
  if (!club.tertiaryColor) s.removeProperty("--club-tertiary");
  for (const [k, val] of Object.entries(vars)) s.setProperty(k, val);

  root.classList.add("club-theme");
  if (club.tertiaryColor) root.classList.add("club-tricolor");
  else root.classList.remove("club-tricolor");

  localStorage.setItem("club-theme", JSON.stringify({
    slug: club.slug, primary: club.primaryColor, secondary: club.secondaryColor,
    tertiary: club.tertiaryColor ?? null,
  }));
}
