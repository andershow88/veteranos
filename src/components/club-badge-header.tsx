"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CLUBS } from "@/lib/clubs";

export function ClubBadgeHeader({ fallback }: { fallback: ReactNode }) {
  const [badge, setBadge] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("club-theme");
      if (stored) {
        const { slug } = JSON.parse(stored);
        const club = CLUBS.find((c) => c.slug === slug);
        if (club?.badge) setBadge(club.badge);
      }
    } catch {}

    const observer = new MutationObserver(() => {
      try {
        const stored = localStorage.getItem("club-theme");
        if (stored) {
          const { slug } = JSON.parse(stored);
          const club = CLUBS.find((c) => c.slug === slug);
          setBadge(club?.badge ?? null);
        } else {
          setBadge(null);
        }
      } catch {}
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  if (!badge) return <>{fallback}</>;

  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-[0_4px_20px_-4px] shadow-pitch-500/40 group-hover:scale-105 transition-transform overflow-hidden">
      <img src={badge} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
    </span>
  );
}
