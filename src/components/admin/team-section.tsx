"use client";

import { useState } from "react";
import { TeamControls } from "./team-controls";
import { TeamEditor } from "./team-editor";
import type { Team, TeamSlot, Player } from "@prisma/client";

type PoolEntry = {
  id: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  kind: "ABO" | "WAITLIST";
  overall: number;
};

type TeamWithSlots = Team & { slots: Array<TeamSlot & { player: Player }> };

export function TeamSection({
  matchId,
  matchDate,
  hasTeams,
  locked,
  teamCount,
  pool,
  teams,
}: {
  matchId: string;
  matchDate: Date;
  hasTeams: boolean;
  locked: boolean;
  teamCount: number;
  pool: PoolEntry[];
  teams: TeamWithSlots[];
}) {
  const [justGenerated, setJustGenerated] = useState(false);

  return (
    <div className="space-y-5">
      <TeamControls
        matchId={matchId}
        hasTeams={hasTeams}
        locked={locked}
        teamCount={teamCount}
        pool={pool}
        onTeamsGenerated={() => setJustGenerated(true)}
      />
      {hasTeams && (
        <TeamEditor
          teams={teams}
          matchId={matchId}
          matchDate={matchDate}
          autoCopy={justGenerated}
        />
      )}
    </div>
  );
}
