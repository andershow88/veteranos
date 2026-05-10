import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const player = user.player;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        {player ? (
          <Avatar firstName={player.firstName} lastName={player.lastName} size="lg" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-surface-2" />
        )}
        <div>
          <h1 className="font-display text-3xl tracking-wide">
            {player ? `${player.firstName} ${player.lastName}` : user.email}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge tone="info">{user.role === "ADMIN" ? "Admin" : "Spieler"}</Badge>
            {player && (
              <Badge tone={player.kind === "SUBSCRIBER" ? "success" : "default"}>
                {player.kind === "SUBSCRIBER" ? "Abo-Spieler" : "Warteliste"}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {player && (
        <Card>
          <CardHeader>
            <h2 className="font-display text-2xl tracking-wide">Profil</h2>
            <p className="text-sm text-muted">Pflege deine Daten und PayPal-Infos.</p>
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

      <Card>
        <CardHeader>
          <h2 className="font-display text-2xl tracking-wide">Passwort ändern</h2>
        </CardHeader>
        <CardBody>
          <PasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}
