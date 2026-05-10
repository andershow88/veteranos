import "server-only";

/**
 * Lightweight email sender. Uses Resend if RESEND_API_KEY is set; otherwise
 * logs the email to the server console so the link can still be retrieved
 * from Railway logs. Admin-triggered flows always also surface the link in
 * the UI as a fallback for environments without email delivery.
 */

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: SendArgs): Promise<{ delivered: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "Veteranos <onboarding@resend.dev>";

  if (!apiKey) {
    console.log("[email] no RESEND_API_KEY set, logging instead:");
    console.log(`[email] to=${to}`);
    console.log(`[email] subject=${subject}`);
    console.log(`[email] body:\n${text}`);
    return { delivered: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html: html ?? text.replace(/\n/g, "<br/>"),
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error("[email] Resend error", resp.status, body);
      return { delivered: false, reason: `Resend ${resp.status}` };
    }
    return { delivered: true };
  } catch (e) {
    console.error("[email] Resend exception", e);
    return { delivered: false, reason: "network/exception" };
  }
}

/** Build the absolute URL to the password-reset page from a request's headers. */
export function buildPasswordResetUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}
