"use client";

import { useEffect, useState } from "react";
import { CLUBS } from "@/lib/clubs";

type Colors = { primary: string; secondary: string; tertiary: string };

export function TricolorStripe({ className }: { className?: string }) {
  const [colors, setColors] = useState<Colors | null>(null);

  useEffect(() => {
    function read() {
      try {
        const stored = localStorage.getItem("club-theme");
        if (stored) {
          const o = JSON.parse(stored);
          const club = CLUBS.find((c) => c.slug === o.slug);
          if (club?.tertiaryColor) {
            setColors({ primary: club.primaryColor, secondary: club.secondaryColor, tertiary: club.tertiaryColor });
            return;
          }
        }
      } catch {}
      setColors(null);
    }
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  if (!colors) return null;

  return (
    <div className={className} aria-hidden>
      <span style={{ background: colors.primary }} />
      <span style={{ background: colors.secondary }} />
      <span style={{ background: colors.tertiary }} />
    </div>
  );
}
