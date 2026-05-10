import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatMatchDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRelativeMatchDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("de-DE", { numeric: "auto" });
  if (Math.abs(diffDays) < 1) {
    const diffH = Math.round(diffMs / (1000 * 60 * 60));
    return rtf.format(diffH, "hour");
  }
  return rtf.format(diffDays, "day");
}
