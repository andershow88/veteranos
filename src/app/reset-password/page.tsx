import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { findUsableResetToken } from "@/server/password-reset-actions";
import { ResetPasswordForm } from "./reset-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  if (await getSession()) redirect("/");

  const { token } = await searchParams;
  const row = token ? await findUsableResetToken(token) : null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] w-full max-w-md items-center justify-center px-4 py-12">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl tracking-wide text-foreground">Choose a new password</h1>
        </div>
        <div className="glass rounded-2xl p-6 sm:p-8">
          {row ? (
            <ResetPasswordForm token={row.token} />
          ) : (
            <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-3 py-3 text-sm text-amber-200 inline-flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>This reset link is invalid, used, or expired. Request a new one from the forgot-password page or your admin.</span>
            </div>
          )}
          <div className="mt-6 text-center text-xs text-subtle">
            <Link href="/login" className="font-semibold text-pitch-300 hover:text-pitch-200">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
