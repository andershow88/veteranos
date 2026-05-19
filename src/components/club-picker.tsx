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
            className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 transition-all duration-200 hover:scale-105 ${
              selected === c.slug
                ? "border-pitch-500 bg-pitch-700/20 shadow-lg shadow-pitch-500/20 ring-2 ring-pitch-500/30"
                : "border-border/40 bg-surface/30 hover:border-pitch-500/40 hover:shadow-md"
            }`}
            title={c.name}
          >
            {c.badge ? (
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white shadow-sm">
                <img src={c.badge} alt={c.name} className="absolute inset-0 h-full w-full object-contain p-1" />
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

type RGB = { r: number; g: number; b: number };

function rgbHex(c: RGB) {
  return `#${c.r.toString(16).padStart(2, "0")}${c.g.toString(16).padStart(2, "0")}${c.b.toString(16).padStart(2, "0")}`;
}

function rgba(c: RGB, a: number) {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

function luminance(c: RGB) {
  const [rs, gs, bs] = [c.r, c.g, c.b].map((ch) => {
    const s = ch / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function effectivePrimary(club: Club): { color: RGB; hex: string } {
  const p = hexToRgb(club.primaryColor);
  if (luminance(p) > 0.7) {
    const s = hexToRgb(club.secondaryColor);
    if (luminance(s) < 0.7) return { color: s, hex: club.secondaryColor };
    return { color: { r: 55, g: 55, b: 55 }, hex: "#373737" };
  }
  return { color: p, hex: club.primaryColor };
}

const ALL_PROPS = [
  "--club-primary", "--club-secondary", "--club-tertiary", "--club-primary-raw",
  "--p50", "--p100", "--p200", "--p300", "--p400", "--p500", "--p600", "--p700", "--p800", "--p900",
  "--accent", "--accent-2", "--selection-bg", "--ring-glow",
  "--border-strong", "--glass-border", "--btn-primary-text",
  "--body-gradient-a", "--body-gradient-b",
  "--glass-from", "--glass-to",
  "--surface", "--surface-2", "--border",
  "--stripe-a", "--stripe-b",
];

export function applyClubTheme(club: Club) {
  const root = document.documentElement;
  if (club.slug === "none") {
    root.classList.remove("club-theme", "club-tricolor");
    ALL_PROPS.forEach((p) => root.style.removeProperty(p));
    localStorage.removeItem("club-theme");
    return;
  }

  const { color: primary, hex: primaryHex } = effectivePrimary(club);
  const isDark = root.classList.contains("dark");
  const lum = luminance(primary);
  const s = root.style;

  if (isDark) {
    s.setProperty("--p50", rgbHex(mixColor(primary, 0.95)));
    s.setProperty("--p100", rgbHex(mixColor(primary, 0.88)));
    s.setProperty("--p200", rgbHex(mixColor(primary, 0.75)));
    s.setProperty("--p300", rgbHex(mixColor(primary, 0.55)));
    s.setProperty("--p400", rgbHex(mixColor(primary, 0.35)));
    s.setProperty("--p500", primaryHex);
    s.setProperty("--p600", rgbHex(darkenColor(primary, 0.2)));
    s.setProperty("--p700", rgbHex(darkenColor(primary, 0.45)));
    s.setProperty("--p800", rgbHex(darkenColor(primary, 0.6)));
    s.setProperty("--p900", rgbHex(darkenColor(primary, 0.75)));
    s.setProperty("--accent", rgbHex(mixColor(primary, 0.55)));
    s.setProperty("--accent-2", rgbHex(mixColor(primary, 0.35)));
    s.setProperty("--body-gradient-a", rgba(primary, 0.1));
    s.setProperty("--body-gradient-b", rgba(primary, 0.12));
    const surfBase = darkenColor(primary, 0.75);
    s.setProperty("--surface", rgbHex(mixColor(surfBase, 0.7)));
    s.setProperty("--surface-2", rgbHex(mixColor(surfBase, 0.6)));
    s.setProperty("--border", rgbHex(mixColor(primary, 0.78)));
    s.setProperty("--glass-from", rgba(darkenColor(primary, 0.7), 0.6));
    s.setProperty("--glass-to", rgba(darkenColor(primary, 0.8), 0.7));
    s.setProperty("--stripe-a", rgba(primary, 0.03));
    s.setProperty("--stripe-b", rgba(primary, 0.06));
  } else {
    s.setProperty("--p50", rgbHex(darkenColor(primary, 0.65)));
    s.setProperty("--p100", rgbHex(darkenColor(primary, 0.45)));
    s.setProperty("--p200", rgbHex(darkenColor(primary, 0.25)));
    s.setProperty("--p300", primaryHex);
    s.setProperty("--p400", primaryHex);
    s.setProperty("--p500", primaryHex);
    s.setProperty("--p600", rgbHex(mixColor(primary, 0.25)));
    s.setProperty("--p700", rgbHex(mixColor(primary, 0.82)));
    s.setProperty("--p800", rgbHex(mixColor(primary, 0.88)));
    s.setProperty("--p900", rgbHex(mixColor(primary, 0.93)));
    s.setProperty("--accent", rgbHex(darkenColor(primary, 0.1)));
    s.setProperty("--accent-2", rgbHex(darkenColor(primary, 0.25)));
    s.setProperty("--body-gradient-a", rgba(primary, 0.1));
    s.setProperty("--body-gradient-b", rgba(primary, 0.07));
    s.setProperty("--surface", rgbHex(mixColor(primary, 0.85)));
    s.setProperty("--surface-2", rgbHex(mixColor(primary, 0.78)));
    s.setProperty("--border", rgbHex(mixColor(primary, 0.75)));
    s.setProperty("--glass-from", rgba(mixColor(primary, 0.92), 0.82));
    s.setProperty("--glass-to", rgba(mixColor(primary, 0.95), 0.9));
    s.setProperty("--stripe-a", rgba(primary, 0.03));
    s.setProperty("--stripe-b", rgba(primary, 0.05));
  }

  s.setProperty("--club-primary", primaryHex);
  s.setProperty("--club-primary-raw", `${primary.r},${primary.g},${primary.b}`);
  s.setProperty("--club-secondary", club.secondaryColor);
  s.setProperty("--selection-bg", primaryHex);
  s.setProperty("--ring-glow", rgba(primary, 0.4));
  s.setProperty("--border-strong", rgbHex(isDark ? mixColor(primary, 0.35) : darkenColor(primary, 0.15)));
  s.setProperty("--glass-border", rgba(primary, 0.35));
  s.setProperty("--btn-primary-text", lum > 0.4 ? "#0a0a0a" : "#ffffff");

  if (club.tertiaryColor) {
    s.setProperty("--club-tertiary", club.tertiaryColor);
  } else {
    s.removeProperty("--club-tertiary");
  }

  root.classList.add("club-theme");
  if (club.tertiaryColor) root.classList.add("club-tricolor");
  else root.classList.remove("club-tricolor");

  localStorage.setItem("club-theme", JSON.stringify({
    slug: club.slug, primary: club.primaryColor, secondary: club.secondaryColor,
    tertiary: club.tertiaryColor ?? null,
  }));
}
