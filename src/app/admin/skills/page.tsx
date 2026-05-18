import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SlidersHorizontal } from "lucide-react";
import { SkillsTable } from "@/components/admin/skills-table";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  const players = await db.player.findMany({
    orderBy: [{ kind: "asc" }, { rank: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      kind: true,
      active: true,
      position: true,
      overall: true,
      technique: true,
      speed: true,
      stamina: true,
      defense: true,
      offense: true,
      passing: true,
      shooting: true,
      goalkeeping: true,
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-pitch-300" />
          <div>
            <h2 className="font-display text-2xl tracking-wide">Skills</h2>
            <p className="text-xs text-muted">{players.length} players · click a cell to edit, then Save</p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0 overflow-x-auto">
        <SkillsTable players={players} />
      </CardBody>
    </Card>
  );
}
