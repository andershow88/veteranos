import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Builds a WhatsApp share link with a prefilled message.
 * Opens WhatsApp without a fixed recipient — the user picks the group/chat.
 * Shared by all WhatsApp actions.
 */
export function waShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Prefilled English WhatsApp reminder a subscription player sends to the
 * replacement about an outstanding payment. Recipient is picked in WhatsApp.
 */
export function buildPaymentReminderText(firstName: string, matchDate: Date | string) {
  return `Hi ${firstName}, just a quick reminder about the outstanding payment for your replacement spot on ${formatMatchDate(matchDate)}. Thank you!`;
}

export function initials(firstName: string, lastName?: string | null) {
  const first = firstName.charAt(0);
  const second = (lastName ?? "").charAt(0) || firstName.charAt(1) || "";
  return `${first}${second}`.toUpperCase();
}

export function formatMatchDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRelativeMatchDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(diffDays) < 1) {
    const diffH = Math.round(diffMs / (1000 * 60 * 60));
    return rtf.format(diffH, "hour");
  }
  return rtf.format(diffDays, "day");
}
