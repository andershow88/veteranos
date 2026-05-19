"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { applyClubTheme } from "@/components/club-picker";
import { getClub } from "@/lib/clubs";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored ? stored === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    try {
      const stored = localStorage.getItem("club-theme");
      if (stored) {
        const { slug } = JSON.parse(stored);
        if (slug && slug !== "none") applyClubTheme(getClub(slug));
      }
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      className="grid h-10 w-10 place-items-center rounded-xl text-foreground/80 hover:text-foreground hover:bg-surface-2 transition"
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
