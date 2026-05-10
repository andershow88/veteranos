import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MatchForm } from "@/components/admin/match-form";

export default function NewMatchPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/matches"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-pitch-300 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      <Card>
        <CardHeader>
          <h2 className="font-display text-2xl tracking-wide">Neuer Termin</h2>
          <p className="text-sm text-muted">
            Alle aktiven Abo-Spieler werden automatisch mit Status „kann spielen“ eingetragen.
          </p>
        </CardHeader>
        <CardBody>
          <MatchForm />
        </CardBody>
      </Card>
    </div>
  );
}
