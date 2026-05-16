import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return Response.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await db.pushSubscription.upsert({
        where: { endpoint },
        create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
        update: { p256dh: keys.p256dh, auth: keys.auth },
    });

    return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
        return Response.json({ error: "Missing endpoint" }, { status: 400 });
    }

    await db.pushSubscription.deleteMany({ where: { endpoint } });
    return Response.json({ ok: true });
}
