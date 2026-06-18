import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
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
  // `token` is the RAW token from the link; the DB stores only its hash. The
  // form must submit the RAW token (resetPasswordAction hashes it once to look
  // it up) — never row.token, which is the stored hash and would be hashed
  // twice, making every valid link fail as "invalid or already used".
  const row = token ? await findUsableResetToken(token) : null;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl tracking-wide text-foreground">Choose a new password</h1>
        </div>
        <div className="glass rounded-2xl p-6 sm:p-8">
          {row ? (
            <ResetPasswordForm token={token!} />
          ) : (
            <Alert tone="warning">
              <span>This reset link is invalid, used, or expired. Request a new one from the forgot-password page or your admin.</span>
            </Alert>
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
