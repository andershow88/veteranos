import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "veteranos_session";

// Edge-safe session check (JWT signature only — no DB). The per-action
// authorization (requireAdmin/requireUser) still runs server-side.
async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  if (await isAuthenticated(req)) return NextResponse.next();

  // Private group app: send unauthenticated visitors to the login page.
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Guard everything except the auth pages, API routes (own auth), Next
  // internals and static assets.
  matcher: [
    "/((?!api|_next/static|_next/image|login|register|forgot-password|reset-password|favicon.ico|favicon.png|manifest.webmanifest|sw.js|icon-192.png|icon-512.png|apple-touch-icon.png).*)",
  ],
};
