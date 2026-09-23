import type { Role } from "@/lib/types";

/**
 * An account is the authentication identity. It is keyed by phone number,
 * because that is what Bangladeshi users actually sign in with and what the
 * domain records already carry.
 *
 * One phone can be both a customer and a provider — plenty of people who hire
 * a plumber also *are* the electrician. So an account links out to whichever
 * domain records exist rather than being one or the other.
 */
export interface Account {
  _id: string;
  /** Normalised to 11 digits, e.g. `01712345678`. The login identifier. */
  phone: string;
  bnName: string;
  customerId: string | null;
  providerId: string | null;
  isAdmin: boolean;
  status: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

/** A one-time code challenge. Codes are stored hashed, never in plaintext. */
export interface OtpChallenge {
  _id: string;
  phone: string;
  /** SHA-256 of the code plus a per-challenge salt. */
  codeHash: string;
  salt: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  createdAt: Date;
}

/** What a verified session carries. Kept small — it rides in a cookie. */
export interface SessionClaims {
  /** Account id. */
  sub: string;
  phone: string;
  roles: Role[];
  customerId: string | null;
  providerId: string | null;
  /** The role the user is currently acting as. */
  activeRole: Exclude<Role, "guest">;
}

export interface Session extends SessionClaims {
  expiresAt: number;
}

export const SESSION_COOKIE = "ghorly_session";

/** Seven days; long enough to be convenient, short enough to bound a leak. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/** OTP codes are short-lived on purpose. */
export const OTP_TTL_SECONDS = 5 * 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LENGTH = 6;
