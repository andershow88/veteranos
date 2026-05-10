"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password missing"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  firstName: z.string().min(1, "First name missing"),
  lastName: z.string().min(1, "Last name missing"),
});

export type AuthState = { error?: string } | undefined;

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return { error: "Wrong email or password" };

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "Wrong email or password" };

  await createSession({ userId: user.id, role: user.role, email: user.email });
  redirect("/");
}

export async function registerAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Email already registered" };

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      role: "PLAYER",
      player: {
        create: {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          kind: "WAITLIST",
          rank: 999,
        },
      },
    },
  });

  await createSession({ userId: user.id, role: user.role, email: user.email });
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
