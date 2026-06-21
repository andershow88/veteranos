"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { CLUBS } from "@/lib/clubs";

export function ClubBadgeHeader({ fallback }: { fallback: ReactNode }) {
  const [badge, setBadge] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("club-theme");
      if (stored) {
        const { slug } = JSON.parse(stored);
        const club = CLUBS.find((c) => c.slug === slug);
        // Read the stored club badge on mount (intentional).
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <span className="relative h-9 w-9 shrink-0 rounded-xl bg-white shadow-[0_4px_20px_-4px] shadow-pitch-500/40 group-hover:scale-105 transition-transform overflow-hidden">
      <Image src={badge} alt="" width={36} height={36} className="absolute inset-0 h-full w-full object-contain p-0.5" />
    </span>
  );
}
