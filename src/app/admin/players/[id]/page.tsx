import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PlayerForm } from "@/components/admin/player-form";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await db.player.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!player) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/players"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-pitch-300 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      <Card>
        <CardHeader>
          <h2 className="font-display text-2xl tracking-wide">
            {player.firstName} {player.lastName}
          </h2>
          {player.user?.email && (
            <p className="text-xs text-muted">Account: {player.user.email}</p>
          )}
        </CardHeader>
        <CardBody>
          <PlayerForm player={{ ...player, email: player.user?.email ?? null }} />
        </CardBody>
      </Card>
    </div>
  );
}
