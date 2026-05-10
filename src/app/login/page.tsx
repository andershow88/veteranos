import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <div className="w-full">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="font-display text-4xl tracking-wide text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">Log in to see your matches.</p>
        </div>
        <div className="glass rounded-2xl p-6 sm:p-8">
          <LoginForm />
          <div className="mt-6 text-center text-xs text-subtle">
            No account yet?{" "}
            <Link href="/register" className="font-semibold text-pitch-300 hover:text-pitch-200">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
