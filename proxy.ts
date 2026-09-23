import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/types";

/**
 * Route protection at the edge of the app.
 *
 * Renamed from `middleware.ts` — Next 16 deprecated that filename in favour of
 * `proxy.ts`, and the export must be called `proxy`. It runs on the Node
 * runtime, which cannot be changed.
 *
 * **This is a redirect, not a security control.** It only checks that a
 * session cookie is present, not that it is valid — verifying the signature
 * here would mean doing crypto on every navigation. The real enforcement is in
 * the API route handlers, which verify the JWT and run the authorization
 * policy before touching data. This exists so a signed-out visitor lands on
 * the login page instead of an empty dashboard.
 */

const PROTECTED = ["/customer", "/provider", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsSession = PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!needsSession) return NextResponse.next();

  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasCookie) return NextResponse.next();

  const login = new URL("/login", request.url);
  // Send them back where they were headed once they sign in.
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/customer/:path*", "/provider/:path*", "/admin/:path*"],
};
