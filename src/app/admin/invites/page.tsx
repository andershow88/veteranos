import { headers } from "next/headers";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateInviteForm } from "./create-invite-form";
import { InviteRow } from "./invite-row";
import { Link as LinkIcon } from "lucide-react";
import { formatMatchDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminInvitesPage() {
  const invites = await db.invitation.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const baseUrl = `${proto}://${host}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-pitch-300" /> Invitation links
        </h2>
        <p className="text-sm text-muted mt-1">
          Anyone with a valid invitation link can register a player account. New users start on the waitlist.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-display text-xl tracking-wide">Create new link</h3>
        </CardHeader>
        <CardBody>
          <CreateInviteForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="font-display text-xl tracking-wide">All links</h3>
          <Badge tone="info">{invites.length}</Badge>
        </CardHeader>
        <CardBody className="space-y-2">
          {invites.length === 0 ? (
            <p className="text-sm text-muted">No invitation links yet.</p>
          ) : (
            invites.map((inv) => (
              <InviteRow
                key={inv.id}
                invite={{
                  id: inv.id,
                  token: inv.token,
                  label: inv.label,
                  active: inv.active,
                  uses: inv.uses,
                  maxUses: inv.maxUses,
                  expiresAt: inv.expiresAt ? formatMatchDate(inv.expiresAt) : null,
                  expired: !!(inv.expiresAt && inv.expiresAt < new Date()),
                  url: `${baseUrl}/register?invite=${inv.token}`,
                }}
              />
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
