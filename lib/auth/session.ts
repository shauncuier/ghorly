import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  type Session,
  type SessionClaims,
} from "@/lib/auth/types";

/**
 * Sessions are signed JWTs in an httpOnly cookie.
 *
 * httpOnly so client JavaScript — and therefore any XSS — cannot read the
 * token. `sameSite: lax` blocks the cross-site POST that CSRF depends on while
 * still allowing normal top-level navigation into the app.
 */

const SECRET = process.env.AUTH_SECRET;

if (!SECRET && process.env.NODE_ENV === "production") {
  // Failing the build/boot is correct here: a production deployment signing
  // sessions with a default key is the same as having no sessions at all.
  throw new Error(
    "AUTH_SECRET is not set. Generate one with:  openssl rand -base64 32",
  );
}

/**
 * Development falls back to a fixed key so the app runs out of the box.
 * It is deliberately obvious in the source — it is not a secret and must never
 * reach an environment that matters.
 */
const key = new TextEncoder().encode(
  SECRET ?? "dev-only-insecure-key-do-not-use-in-production-0000",
);

const ALG = "HS256";

export async function createSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer("ghorly")
    .setAudience("ghorly-app")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: [ALG],
      issuer: "ghorly",
      audience: "ghorly-app",
    });

    if (!payload.sub || typeof payload.phone !== "string") return null;

    return {
      sub: payload.sub,
      phone: payload.phone,
      roles: (payload.roles as Session["roles"]) ?? [],
      customerId: (payload.customerId as string | null) ?? null,
      providerId: (payload.providerId as string | null) ?? null,
      activeRole: (payload.activeRole as Session["activeRole"]) ?? "customer",
      expiresAt: (payload.exp ?? 0) * 1000,
    };
  } catch {
    // Expired, tampered, or signed with a different key — all mean "no session".
    return null;
  }
}

/** Reads the session from the request cookie. `null` when signed out. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(claims: SessionClaims): Promise<void> {
  const token = await createSessionToken(claims);
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
