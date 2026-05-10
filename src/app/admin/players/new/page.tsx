import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PlayerForm } from "@/components/admin/player-form";

export default function NewPlayerPage() {
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
          <h2 className="font-display text-2xl tracking-wide">Neuer Spieler</h2>
        </CardHeader>
        <CardBody>
          <PlayerForm />
        </CardBody>
      </Card>
    </div>
  );
}
