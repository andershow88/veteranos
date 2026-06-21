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

/** The app runs on a single, fixed time zone: Germany. Every match time is
 * entered, stored-as-instant, and displayed relative to this zone — never the
 * server's local zone (which is UTC on Railway). */
export const APP_TIME_ZONE = "Europe/Berlin";

/** Offset of {@link APP_TIME_ZONE} from UTC, in minutes, at a given instant
 * (handles CET/CEST automatically). */
function berlinOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** Convert a German wall-clock date + time (e.g. "2026-06-21" + "10:15") into
 * the correct UTC instant, independent of the server's own time zone. Used when
 * an admin enters a match date/time. (The rare DST-transition hour is not
 * special-cased — irrelevant for scheduling matches.) */
export function berlinDateTimeToUtc(dateStr: string, timeStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0); // treat wall-clock as UTC first
  const offset = berlinOffsetMinutes(new Date(guess)); // then correct by Berlin's offset
  return new Date(guess - offset * 60000);
}

/** Split a stored UTC instant back into German wall-clock {date, time} strings
 * (YYYY-MM-DD / HH:MM) for prefilling the match form. */
export function utcToBerlinParts(at: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
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
    timeZone: APP_TIME_ZONE,
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
