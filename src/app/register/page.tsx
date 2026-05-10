import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { findUsableInvite } from "@/server/invite-actions";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const { invite: token } = await searchParams;
  const invite = token ? await findUsableInvite(token) : null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] w-full max-w-xl items-center justify-center px-4 py-12">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl tracking-wide text-foreground">Create account</h1>
          <p className="mt-2 text-sm text-muted">
            New accounts start on the waitlist. An admin can promote you to abo later.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8">
          {invite ? (
            <RegisterForm token={invite.token} />
          ) : (
            <InvalidInvite hasToken={Boolean(token)} />
          )}
          <div className="mt-6 text-center text-xs text-subtle">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-pitch-300 hover:text-pitch-200">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvalidInvite({ hasToken }: { hasToken: boolean }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200 inline-flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          {hasToken
            ? "This invitation link is invalid, expired or used up."
            : "Registration requires an invitation link. Ask an admin to send you one."}
        </span>
      </div>
    </div>
  );
}
