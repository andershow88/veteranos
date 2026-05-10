import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] w-full max-w-md items-center justify-center px-4 py-12">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl tracking-wide text-foreground">Account anlegen</h1>
          <p className="mt-2 text-sm text-muted">
            Du landest erstmal auf der Warteliste – ein Admin kann dich später zum Abo-Spieler machen.
          </p>
        </div>
        <div className="glass rounded-2xl p-6 sm:p-8">
          <RegisterForm />
          <div className="mt-6 text-center text-xs text-subtle">
            Schon registriert?{" "}
            <Link href="/login" className="font-semibold text-pitch-300 hover:text-pitch-200">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
