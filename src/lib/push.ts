import webpush from "web-push";
import { db } from "./db";

const VAPID_PUBLIC = "BFawXGGBS-53e2M-WlrshU7TINMor70na0LEnu5M-yU77jghXwHzAN6MZI4JP_KGTccMiVuGlMm-hqe2n-Kz2nk";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? "mailto:admin@veteranos.app";

if (VAPID_PRIVATE) {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function sendPushToAll(title: string, body: string, url?: string) {
    if (!VAPID_PRIVATE) return;

    const subs = await db.pushSubscription.findMany();
    const payload = JSON.stringify({ title, body, url: url ?? "/" });

    const results = await Promise.allSettled(
        subs.map((sub) =>
            webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                payload,
            ).catch(async (err: { statusCode?: number }) => {
                if (err.statusCode === 404 || err.statusCode === 410) {
                    await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
                }
                throw err;
            }),
        ),
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    console.log(`[push] sent=${sent} failed=${failed}`);
}
