import type { PaymentStatus } from "@prisma/client";

/**
 * Pure (framework- and DB-free) authorization + state rules for the replacement
 * payment flow, so they can be unit-tested in isolation. The server actions in
 * match-actions.ts load the records and delegate the decision to these helpers;
 * the actual writes are still guarded atomically at the database level.
 */

/**
 * Payment is still outstanding (the subscription player has not confirmed
 * receipt yet). Both states a replacement can be in before settlement:
 *   PENDING  – replacement has not marked it paid
 *   CLAIMED  – replacement marked it paid, awaiting confirmation
 */
export const OUTSTANDING_PAYMENT_STATUSES = ["PENDING", "CLAIMED"] as const;

/**
 * Minimum gap between two reminder increments for the same payment. Collapses
 * accidental double-clicks, repeated taps and concurrent requests into a single
 * increment. Enforced atomically in SQL (must match the interval used there).
 */
export const REMINDER_DEBOUNCE_SECONDS = 5;

export type PaymentActorCtx = {
  /** Player id of the subscription (abo) player who is owed the payment. */
  aboPlayerId: string;
  /** Player id of the waitlist (replacement) player who owes the payment. */
  waitlistPlayerId: string;
  /** Current payment status on the replacement signup. */
  paymentStatus: PaymentStatus;
};

export function isOutstanding(status: PaymentStatus): boolean {
  return (OUTSTANDING_PAYMENT_STATUSES as readonly string[]).includes(status);
}

/**
 * Whether the subscription player may directly confirm receipt. Returns an
 * English error message when the action is not allowed, or null when it is.
 */
export function subscriberConfirmError(
  viewerPlayerId: string,
  ctx: PaymentActorCtx,
): string | null {
  if (viewerPlayerId !== ctx.aboPlayerId) {
    return "Only the subscription player can confirm this payment.";
  }
  if (ctx.paymentStatus === "PAID") {
    return "This payment is already completed.";
  }
  if (!isOutstanding(ctx.paymentStatus)) {
    return "This payment cannot be confirmed.";
  }
  return null;
}

/**
 * Whether the subscription player may send a WhatsApp payment reminder. Returns
 * an English error message when the action is not allowed, or null when it is.
 */
export function subscriberReminderError(
  viewerPlayerId: string,
  ctx: PaymentActorCtx,
): string | null {
  if (viewerPlayerId !== ctx.aboPlayerId) {
    return "Only the subscription player can send a payment reminder.";
  }
  if (ctx.paymentStatus === "PAID") {
    return "This payment is already completed.";
  }
  if (!isOutstanding(ctx.paymentStatus)) {
    return "There is no outstanding payment to remind about.";
  }
  return null;
}

/**
 * Human-readable reminder status for the UI, e.g. "Reminder 2 opened".
 * Returns null when no reminder has been opened yet. Deliberately says
 * "opened", never "sent"/"delivered" — we can't verify WhatsApp delivery.
 */
export function reminderStatusLabel(count: number): string | null {
  if (!count || count < 1) return null;
  return `Reminder ${count} opened`;
}

/**
 * DOM id of a replacement row, used as a #hash anchor so a payment entry in the
 * profile can deep-link straight to the row where the actions live. Single
 * source of truth shared by the profile link and the match row id.
 */
export function paymentAnchorId(signupId: string): string {
  return `payment-${signupId}`;
}

/** Deep link from a profile payment entry to the exact match row + actions. */
export function paymentDeepLink(matchId: string, signupId: string): string {
  return `/matches/${matchId}#${paymentAnchorId(signupId)}`;
}
