import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const positionLabel: Record<string, string> = {
  GOALKEEPER: "Goalkeeper",
  DEFENDER: "Defender",
  MIDFIELDER: "Midfielder",
  STRIKER: "Striker",
  ANY: "Any",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const player = user.player;
  const displayName = player
    ? `${player.firstName}${player.lastName ? ` ${player.lastName}` : ""}`
    : user.email;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        {player ? (
          <Avatar firstName={player.firstName} lastName={player.lastName ?? ""} size="lg" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-surface-2" />
        )}
        <div>
          <h1 className="font-display text-3xl tracking-wide">{displayName}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge tone="info">{user.role === "ADMIN" ? "Admin" : "Player"}</Badge>
            {player && (
              <Badge tone={player.kind === "ABO" ? "success" : "default"}>
                {player.kind === "ABO" ? "Abo" : "Waitlist"}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {player && (
        <Card>
          <CardHeader>
            <h2 className="font-display text-2xl tracking-wide">Your details</h2>
            <p className="text-sm text-muted">Edit name, contact and PayPal info.</p>
          </CardHeader>
          <CardBody>
            <ProfileForm
              defaults={{
                firstName: player.firstName,
                lastName: player.lastName,
                nickname: player.nickname,
                paypalName: player.paypalName,
                paypalLink: player.paypalLink,
                phone: player.phone,
              }}
            />
          </CardBody>
        </Card>
      )}

      {player && (
        <Card>
          <CardHeader>
            <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
              Skills & player data
              <Badge tone="outline" className="ml-2">
                <Lock className="h-3 w-3" /> admin-managed
              </Badge>
            </h2>
            <p className="text-sm text-muted">
              These fields are set by an admin. Reach out if something looks off.
            </p>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <ReadOnlyRow label="Player type" value={player.kind === "ABO" ? "Abo" : "Waitlist"} />
              <ReadOnlyRow label="Order (rank)" value={String(player.rank)} />
              <ReadOnlyRow label="Preferred position" value={positionLabel[player.position] ?? player.position} />
              <ReadOnlyRow label="Active" value={player.active ? "Yes" : "No"} />
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-300 mb-2">
                Skills
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <SkillBar label="Overall" value={player.overall} highlight />
                <SkillBar label="Technique" value={player.technique} />
                <SkillBar label="Speed" value={player.speed} />
                <SkillBar label="Stamina" value={player.stamina} />
                <SkillBar label="Defense" value={player.defense} />
                <SkillBar label="Offense" value={player.offense} />
                <SkillBar label="Passing" value={player.passing} />
                <SkillBar label="Shooting" value={player.shooting} />
                <SkillBar label="Goalkeeping" value={player.goalkeeping} />
              </div>
            </div>

            {player.notes && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-300 mb-2">
                  Admin notes
                </h3>
                <p className="rounded-lg border border-border/60 bg-surface/50 px-3 py-2 text-sm text-foreground/80 whitespace-pre-wrap">
                  {player.notes}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-display text-2xl tracking-wide">Change password</h2>
        </CardHeader>
        <CardBody>
          <PasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-pitch-300">
        {label}
      </div>
      <div className="text-sm text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function SkillBar({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${highlight ? "text-pitch-200" : "text-pitch-300"}`}>
          {label}
        </span>
        <span className="number-pill text-sm font-semibold text-foreground">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div
          className={`h-full ${highlight ? "bg-linear-to-r from-pitch-300 to-pitch-500" : "bg-linear-to-r from-pitch-500 to-pitch-300"}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
