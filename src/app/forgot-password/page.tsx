import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ForgotPasswordForm } from "./forgot-form";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  if (await getSession()) redirect("/");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] w-full max-w-md items-center justify-center px-4 py-12">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl tracking-wide text-foreground">Forgot password</h1>
          <p className="mt-2 text-sm text-muted">
            Enter your email plus the first and last name on your account. If they all match, we&apos;ll email you a reset link.
          </p>
        </div>
        <div className="glass rounded-2xl p-6 sm:p-8">
          <ForgotPasswordForm />
          <div className="mt-6 text-center text-xs text-subtle">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-pitch-300 hover:text-pitch-200">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
