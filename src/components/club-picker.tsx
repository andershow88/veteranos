"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { CLUBS, type Club } from "@/lib/clubs";
import { setClubAction } from "@/server/profile-actions";

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
          className="w-full bg-transparent border border-border/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-pitch-500 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
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
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 transition hover:scale-105 ${
              selected === c.slug
                ? "border-pitch-500 bg-pitch-700/20 shadow-lg"
                : "border-border/40 bg-surface/30 hover:border-pitch-500/40"
            }`}
            title={c.name}
          >
            {c.badge ? (
              <img src={c.badge} alt={c.name} width={48} height={48} className="h-12 w-12 object-contain" />
            ) : (
              <div className="h-12 w-12 grid place-items-center text-muted text-lg">—</div>
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

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function mixColor(c: { r: number; g: number; b: number }, white: number) {
  return {
    r: Math.round(c.r + (255 - c.r) * white),
    g: Math.round(c.g + (255 - c.g) * white),
    b: Math.round(c.b + (255 - c.b) * white),
  };
}

function darkenColor(c: { r: number; g: number; b: number }, amount: number) {
  return {
    r: Math.round(c.r * (1 - amount)),
    g: Math.round(c.g * (1 - amount)),
    b: Math.round(c.b * (1 - amount)),
  };
}

function rgbHex(c: { r: number; g: number; b: number }) {
  return `#${c.r.toString(16).padStart(2, "0")}${c.g.toString(16).padStart(2, "0")}${c.b.toString(16).padStart(2, "0")}`;
}

export function applyClubTheme(club: Club) {
  const root = document.documentElement;
  if (club.slug === "none") {
    root.classList.remove("club-theme");
    // Remove all inline overrides
    const props = ["--club-primary", "--club-secondary",
      "--p50", "--p100", "--p200", "--p300", "--p400", "--p500", "--p600", "--p700", "--p800", "--p900",
      "--accent", "--accent-2", "--selection-bg", "--ring-glow",
      "--border-strong", "--glass-border"];
    props.forEach((p) => root.style.removeProperty(p));
    localStorage.removeItem("club-theme");
    return;
  }

  const primary = hexToRgb(club.primaryColor);
  const isDark = root.classList.contains("dark");

  if (isDark) {
    // Dark mode: light tints of primary for text, dark shades for backgrounds
    root.style.setProperty("--p50", rgbHex(mixColor(primary, 0.95)));
    root.style.setProperty("--p100", rgbHex(mixColor(primary, 0.88)));
    root.style.setProperty("--p200", rgbHex(mixColor(primary, 0.75)));
    root.style.setProperty("--p300", rgbHex(mixColor(primary, 0.55)));
    root.style.setProperty("--p400", rgbHex(mixColor(primary, 0.35)));
    root.style.setProperty("--p500", club.primaryColor);
    root.style.setProperty("--p600", rgbHex(darkenColor(primary, 0.2)));
    root.style.setProperty("--p700", rgbHex(darkenColor(primary, 0.45)));
    root.style.setProperty("--p800", rgbHex(darkenColor(primary, 0.6)));
    root.style.setProperty("--p900", rgbHex(darkenColor(primary, 0.75)));
    root.style.setProperty("--accent", rgbHex(mixColor(primary, 0.55)));
    root.style.setProperty("--accent-2", rgbHex(mixColor(primary, 0.35)));
  } else {
    // Light mode: dark shades for text, light tints for backgrounds
    root.style.setProperty("--p50", rgbHex(darkenColor(primary, 0.7)));
    root.style.setProperty("--p100", rgbHex(darkenColor(primary, 0.55)));
    root.style.setProperty("--p200", rgbHex(darkenColor(primary, 0.35)));
    root.style.setProperty("--p300", rgbHex(darkenColor(primary, 0.15)));
    root.style.setProperty("--p400", club.primaryColor);
    root.style.setProperty("--p500", club.primaryColor);
    root.style.setProperty("--p600", rgbHex(mixColor(primary, 0.35)));
    root.style.setProperty("--p700", rgbHex(mixColor(primary, 0.88)));
    root.style.setProperty("--p800", rgbHex(mixColor(primary, 0.92)));
    root.style.setProperty("--p900", rgbHex(mixColor(primary, 0.96)));
    root.style.setProperty("--accent", rgbHex(darkenColor(primary, 0.15)));
    root.style.setProperty("--accent-2", rgbHex(darkenColor(primary, 0.3)));
  }

  root.style.setProperty("--club-primary", club.primaryColor);
  root.style.setProperty("--club-secondary", club.secondaryColor);
  root.style.setProperty("--selection-bg", club.primaryColor);
  root.style.setProperty("--ring-glow", `rgba(${primary.r},${primary.g},${primary.b},0.4)`);
  root.style.setProperty("--border-strong", rgbHex(isDark ? mixColor(primary, 0.35) : darkenColor(primary, 0.15)));
  root.style.setProperty("--glass-border", `rgba(${primary.r},${primary.g},${primary.b},0.35)`);

  root.classList.add("club-theme");
  localStorage.setItem("club-theme", JSON.stringify({
    slug: club.slug, primary: club.primaryColor, secondary: club.secondaryColor,
  }));
}
