import type { TeamColor } from "@prisma/client";

export const TEAM_PALETTE: Record<TeamColor, { hex: string; chip: string; ring: string }> = {
  BLUE: {
    hex: "#2563eb",
    chip: "from-blue-400 to-blue-700",
    ring: "ring-blue-500/40",
  },
  RED: {
    hex: "#dc2626",
    chip: "from-red-400 to-red-700",
    ring: "ring-red-500/40",
  },
  WHITE: {
    hex: "#f1f5f9",
    chip: "from-slate-100 to-slate-400",
    ring: "ring-slate-200/40",
  },
  BLACK: {
    hex: "#111827",
    chip: "from-zinc-700 to-zinc-900",
    ring: "ring-zinc-500/40",
  },
};
