import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
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

/**
 * The claims are checked, not cast. A valid signature proves who issued the
 * token, not that its contents have the shape the rest of the app assumes.
 */
const ClaimsSchema = z.object({
  sub: z.string().min(1),
  phone: z.string().min(1),
  roles: z.array(z.enum(["customer", "provider", "admin"])),
  customerId: z.string().nullable(),
  providerId: z.string().nullable(),
  activeRole: z.enum(["customer", "provider", "admin"]),
  exp: z.number(),
});

/**
 * `expiresAt` (ms) pins the expiry of a re-signed token, e.g. on a role switch,
 * so switching roles cannot extend a session indefinitely.
 */
export async function createSessionToken(
  claims: SessionClaims,
  expiresAt?: number,
): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer("ghorly")
    .setAudience("ghorly-app")
    .setExpirationTime(
      expiresAt ? Math.floor(expiresAt / 1000) : `${SESSION_TTL_SECONDS}s`,
    )
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: [ALG],
      issuer: "ghorly",
      audience: "ghorly-app",
    });

    const parsed = ClaimsSchema.safeParse(payload);
    if (!parsed.success) return null;
    const { exp, ...claims } = parsed.data;

    return { ...claims, expiresAt: exp * 1000 };
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

export async function setSessionCookie(
  claims: SessionClaims,
  expiresAt?: number,
): Promise<void> {
  const token = await createSessionToken(claims, expiresAt);
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: expiresAt
      ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      : SESSION_TTL_SECONDS,
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
