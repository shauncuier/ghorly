import "server-only";

import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db/client";
import type { Account, Session } from "@/lib/auth/types";
import type { Customer, Provider, Role } from "@/lib/types";

const COLLECTION = "accounts";

/**
 * Accounts are derived from the domain records rather than duplicated.
 *
 * A phone number can own a customer record, a provider record, or both, so the
 * account links out to whichever exist instead of forcing a person to pick one
 * identity. Admin is a flag, not a third profile.
 */

export async function findAccountByPhone(phone: string): Promise<Account | null> {
  const db = await getDb();
  if (!db) return null;
  return (await db.collection(COLLECTION).findOne({ phone } as never)) as Account | null;
}

export async function findAccountById(id: string): Promise<Account | null> {
  const db = await getDb();
  if (!db) return null;
  return (await db.collection(COLLECTION).findOne({ _id: id } as never)) as Account | null;
}

export function rolesFor(account: Account): Role[] {
  const roles: Role[] = [];
  if (account.customerId) roles.push("customer");
  if (account.providerId) roles.push("provider");
  if (account.isAdmin) roles.push("admin");
  return roles;
}

export function defaultRoleFor(account: Account): Exclude<Role, "guest"> {
  // Most people signing in are customers; admin is the exception, not the
  // default, so an admin who is also a customer lands on the customer app.
  if (account.customerId) return "customer";
  if (account.providerId) return "provider";
  return "admin";
}

/**
 * Signs in an existing account, or creates a customer account for a new
 * number. Self-service registration only ever produces a customer — becoming
 * a provider goes through the verification flow, and nobody self-promotes to
 * admin.
 */
export async function findOrCreateAccount(
  phone: string,
  bnName?: string,
): Promise<Account | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await findAccountByPhone(phone);
  if (existing) return existing;

  const now = new Date().toISOString().slice(0, 16);
  const accounts = db.collection(COLLECTION);

  // An unclaimed customer/provider record with this phone belongs to whoever
  // can receive its OTP — that is what proves ownership of the number.
  const customer = (await db
    .collection("customers")
    .findOne({ phone } as never)) as Customer | null;
  const provider = (await db
    .collection("providers")
    .findOne({ phone } as never)) as Provider | null;

  const account: Account = {
    _id: `acc-${phone}`,
    phone,
    bnName: bnName?.trim() || customer?.bnName || provider?.bnName || "নতুন ব্যবহারকারী",
    customerId: customer?._id ?? null,
    providerId: provider?._id ?? null,
    isAdmin: false,
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  };

  // If the number matches nothing, create a customer record so the account has
  // somewhere to hang its bookings. Random, not phone-derived: two numbers can
  // share their last digits, and an id should not leak the number anyway.
  if (!account.customerId && !account.providerId) {
    const customerId = `cus-${randomBytes(6).toString("hex")}`;
    await db.collection("customers").insertOne({
      _id: customerId,
      bnName: account.bnName,
      phone,
      email: "",
      areaId: "",
      addressIds: [],
      status: "active",
      bookingCount: 0,
      createdAt: now,
      updatedAt: now,
    } as never);
    account.customerId = customerId;
  }

  // Two first logins for the same number can race to here. The unique phone
  // index lets exactly one insert win; the loser reads the winner's account
  // instead of failing the sign-in. (The loser's fresh customer record, if it
  // made one, is left unlinked — harmless, and rarer than a failed login.)
  try {
    await accounts.insertOne(account as never);
    return account;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return findAccountByPhone(phone);
    }
    throw error;
  }
}

/**
 * Re-reads the account behind a session and returns the session it should
 * have *now*.
 *
 * The JWT is a 7-day snapshot of roles and ids. Anything that writes goes
 * through this, so a suspension or a removed admin flag takes effect on the
 * next request rather than whenever the cookie expires. `null` means the
 * session no longer grants anything.
 */
export async function refreshSession(session: Session): Promise<Session | null> {
  const db = await getDb();
  if (!db) return null;

  const account = await findAccountById(session.sub);
  if (!account || account.status === "suspended") return null;

  // Suspension is applied by admins to the domain record, not the account.
  const [customer, provider] = await Promise.all([
    account.customerId
      ? (db.collection("customers").findOne({ _id: account.customerId } as never) as Promise<Customer | null>)
      : null,
    account.providerId
      ? (db.collection("providers").findOne({ _id: account.providerId } as never) as Promise<Provider | null>)
      : null,
  ]);

  const roles = rolesFor(account).filter((role) => {
    if (role === "customer") return customer?.status !== "suspended";
    if (role === "provider") return provider?.status !== "suspended";
    return true;
  });
  if (roles.length === 0) return null;

  const activeRole = roles.includes(session.activeRole)
    ? session.activeRole
    : (roles[0] as Session["activeRole"]);

  return {
    ...session,
    phone: account.phone,
    roles,
    customerId: roles.includes("customer") ? account.customerId : null,
    providerId: roles.includes("provider") ? account.providerId : null,
    activeRole,
  };
}

export async function recordLogin(accountId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.collection(COLLECTION).updateOne({ _id: accountId } as never, {
    $set: { lastLoginAt: new Date().toISOString().slice(0, 16) },
  });
}

export async function ensureAccountIndexes(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.collection(COLLECTION).createIndex({ phone: 1 }, { unique: true });
}
