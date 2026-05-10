import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, ShieldOff } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerForm } from "@/components/admin/player-form";
import { RoleControls } from "@/components/admin/role-controls";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [player, session, adminCount] = await Promise.all([
    db.player.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, role: true } } },
    }),
    getSession(),
    db.user.count({ where: { role: "ADMIN" } }),
  ]);
  if (!player) notFound();

  const isSelf = session?.userId === player.user?.id;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/players"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-pitch-300 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-wide">
                {player.firstName} {player.lastName ?? ""}
              </h2>
              {player.user?.email && (
                <p className="text-xs text-muted">Account: {player.user.email}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {player.user?.role === "ADMIN" ? (
                <Badge tone="success">
                  <ShieldCheck className="h-3 w-3" /> Admin
                </Badge>
              ) : player.user ? (
                <Badge tone="default">
                  <ShieldOff className="h-3 w-3" /> Player
                </Badge>
              ) : (
                <Badge tone="outline">no login</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <PlayerForm player={{ ...player, email: player.user?.email ?? null }} />
        </CardBody>
      </Card>

      {player.user && (
        <Card>
          <CardHeader>
            <h3 className="font-display text-xl tracking-wide">Account role</h3>
            <p className="text-xs text-muted">
              Admins can manage players, matches and invitations.
            </p>
          </CardHeader>
          <CardBody>
            <RoleControls
              userId={player.user.id}
              role={player.user.role}
              isSelf={isSelf}
              isLastAdmin={player.user.role === "ADMIN" && adminCount <= 1}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
