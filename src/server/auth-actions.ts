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
import { consumeInvite, findUsableInvite } from "./invite-actions";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password missing"),
});

const registerSchema = z.object({
  // Required
  firstName: z.string().min(1, "First name missing"),
  lastName: z.string().min(1, "Last name missing"),
  // Optional account credentials. If you provide one, you must provide both.
  email: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(6, "At least 6 characters")
    .optional()
    .or(z.literal("")),
  // Optional profile data
  nickname: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  paypalName: z.string().optional().nullable(),
  paypalLink: z
    .string()
    .url("Please enter a valid URL or leave blank")
    .optional()
    .nullable()
    .or(z.literal("")),
  // Invitation
  invite: z.string().min(1, "Invitation missing"),
});

export type AuthState =
  | { error?: string; ok?: "registered_no_login" }
  | undefined;

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
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    nickname: formData.get("nickname"),
    phone: formData.get("phone"),
    paypalName: formData.get("paypalName"),
    paypalLink: formData.get("paypalLink"),
    invite: formData.get("invite"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Validate invitation up front (cheap rejection)
  const invite = await findUsableInvite(parsed.data.invite);
  if (!invite) return { error: "Invitation link is invalid or expired" };

  const email = parsed.data.email ? parsed.data.email.toLowerCase() : "";
  const password = parsed.data.password ?? "";
  const wantsLogin = Boolean(email);

  // If they want a login they must provide both email AND password.
  if (wantsLogin && !password) {
    return { error: "Please choose a password too, or leave email empty" };
  }
  if (!wantsLogin && password) {
    return { error: "Please add an email too, or leave password empty" };
  }

  if (wantsLogin) {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return { error: "Email already registered" };
  }

  // Atomically consume the invite. If it raced with another registration
  // and is now full/expired, abort.
  const consumed = await consumeInvite(parsed.data.invite);
  if (!consumed) return { error: "Invitation link can no longer be used" };

  const playerData = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    nickname: parsed.data.nickname || null,
    phone: parsed.data.phone || null,
    paypalName: parsed.data.paypalName || null,
    paypalLink: parsed.data.paypalLink || null,
    // Self-registration always lands on the waitlist; admin can promote later.
    kind: "WAITLIST" as const,
    rank: 999,
  };

  if (wantsLogin) {
    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        role: "PLAYER",
        player: { create: playerData },
      },
    });
    await createSession({ userId: user.id, role: user.role, email: user.email });
    redirect("/");
  }

  // No login wanted — create just the Player record. The player shows up in
  // the roster but cannot log in until an admin sets up an account for them.
  await db.player.create({ data: playerData });
  return { ok: "registered_no_login" };
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
