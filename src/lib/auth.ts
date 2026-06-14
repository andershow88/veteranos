import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { db } from "./db";

const COOKIE_NAME = "veteranos_session";
const ALG = "HS256";

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  userId: string;
  role: "ADMIN" | "PLAYER";
  email: string;
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

async function readSessionToken(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const getSession = cache(readSessionToken);

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { player: true },
  });
  return user;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("ADMIN_REQUIRED");
  // Trust the DB, not the (30-day) JWT role claim: a demoted or deleted admin
  // must lose access immediately, not only when the cookie expires.
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, email: true },
  });
  if (!user || user.role !== "ADMIN") throw new Error("ADMIN_REQUIRED");
  return { userId: user.id, role: user.role, email: user.email };
}

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    throw new Error("AUTH_REQUIRED");
  }
  return session;
}
