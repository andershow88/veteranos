import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Wallet, ArrowRight, Shield } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { AvatarUploader } from "@/components/ui/avatar-uploader";
import { Badge } from "@/components/ui/badge";
import { ClubPicker } from "@/components/club-picker";
import { getPaymentsForPlayer, type PaymentEntry } from "@/server/match-queries";
import { formatMatchDate } from "@/lib/utils";
import { paymentDeepLink } from "@/lib/payment-rules";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const player = user.player;
  const displayName = player
    ? `${player.firstName}${player.lastName ? ` ${player.lastName}` : ""}`
    : user.email;

  const payments = player ? await getPaymentsForPlayer(player.id) : { youOwe: [], owedToYou: [] };
  const openYouOwe = payments.youOwe.filter((p) => p.status !== "PAID");
  const openOwedToYou = payments.owedToYou.filter((p) => p.status !== "PAID");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex flex-wrap items-start gap-4">
        {player ? (
          <Avatar
            firstName={player.firstName}
            lastName={player.lastName ?? ""}
            size="lg"
            src={player.avatarUrl}
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-surface-2" />
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <h1 className="font-display text-3xl tracking-wide">{displayName}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{user.role === "ADMIN" ? "Admin" : "Player"}</Badge>
            {player && (
              <Badge tone={player.kind === "ABO" ? "success" : "default"}>
                {player.kind === "ABO" ? "Subscriber" : "Waitlist"}
              </Badge>
            )}
          </div>
          {player && (
            <AvatarUploader
              playerId={player.id}
              firstName={player.firstName}
              lastName={player.lastName}
              currentUrl={player.avatarUrl}
            />
          )}
        </div>
      </header>

      {player && (openYouOwe.length > 0 || openOwedToYou.length > 0 || payments.youOwe.length > 0 || payments.owedToYou.length > 0) && (
        <Card>
          <CardHeader>
            <h2 className="font-display text-2xl tracking-wide flex items-center gap-2">
              <Wallet className="h-5 w-5 text-pitch-300" />
              Payments
            </h2>
            <p className="text-sm text-muted">
              Replacement payments between you and other players from the last 30 days and upcoming matches.
            </p>
          </CardHeader>
          <CardBody className="space-y-6">
            <PaymentList
              title="You owe"
              empty="You don't owe anything right now."
              entries={payments.youOwe}
              perspective="payer"
            />
            <PaymentList
              title="Owed to you"
              empty="Nobody owes you anything right now."
              entries={payments.owedToYou}
              perspective="payee"
            />
          </CardBody>
        </Card>
      )}

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
              <Shield className="h-5 w-5 text-pitch-300" />
              My club
            </h2>
            <p className="text-sm text-muted">Pick your favorite club. The app theme will adapt to your club colors.</p>
          </CardHeader>
          <CardBody>
            <ClubPicker currentSlug={player.clubSlug} />
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

function PaymentList({
  title,
  empty,
  entries,
  perspective,
}: {
  title: string;
  empty: string;
  entries: PaymentEntry[];
  perspective: "payer" | "payee";
}) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-300 mb-2">
        {title}
        <span className="text-muted font-medium number-pill"> · {entries.length}</span>
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-subtle italic">{empty}</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => {
            const other = perspective === "payer" ? e.aboPlayer : e.waitlistPlayer;
            return (
              <Link
                key={e.signupId}
                href={paymentDeepLink(e.matchId, e.signupId)}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-surface/50 px-3 py-2 hover:border-pitch-500 transition"
              >
                <Avatar firstName={other.firstName} lastName={other.lastName} size="sm" src={other.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {other.firstName} {other.lastName}
                  </div>
                  <div className="text-xs text-muted">{formatMatchDate(e.matchDate)}</div>
                </div>
                <PaymentStatusPill status={e.status} />
                <ArrowRight className="h-3.5 w-3.5 text-muted" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PaymentStatusPill({ status }: { status: "PENDING" | "CLAIMED" | "PAID" }) {
  if (status === "PAID")
    return (
      <Badge tone="success">
        <CheckCircle2 className="h-3 w-3" /> Paid
      </Badge>
    );
  if (status === "CLAIMED")
    return (
      <Badge tone="info">
        <Clock className="h-3 w-3" /> Awaiting confirmation
      </Badge>
    );
  return (
    <Badge tone="warn">
      <Clock className="h-3 w-3" /> Payment pending
    </Badge>
  );
}
