import { z } from "zod";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/auth/session";
import { refreshSession } from "@/lib/auth/accounts";
import { fail, internal, ok } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

const Body = z.object({ role: z.enum(["customer", "provider", "admin"]) });

/**
 * Switches which role the session is acting as.
 *
 * Only ever among roles the account already holds — this changes the active
 * view, it does not grant anything. The check is against the signed cookie,
 * so a caller cannot promote itself by asking nicely.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return fail("unauthenticated", "লগ ইন করুন।");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("invalid", "অনুরোধটি পড়া যায়নি।");
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) return fail("invalid", "সঠিক ভূমিকা দিন।");

  try {
    // Checked against the account as it is now, not the cookie's snapshot —
    // otherwise a suspended or demoted user could keep switching into a role
    // they no longer hold.
    const current = await refreshSession(session);
    if (!current) {
      await clearSessionCookie();
      return fail("unauthenticated", "লগ ইন করুন।");
    }
    if (!current.roles.includes(parsed.data.role)) {
      return fail("forbidden", "এই ভূমিকায় প্রবেশের অনুমতি নেই।");
    }

    // Keeps the original expiry: switching roles must not extend a session.
    await setSessionCookie(
      {
        sub: current.sub,
        phone: current.phone,
        roles: current.roles,
        customerId: current.customerId,
        providerId: current.providerId,
        activeRole: parsed.data.role,
      },
      session.expiresAt,
    );
    return ok({ activeRole: parsed.data.role });
  } catch (error) {
    return internal("switch-role", error);
  }
}
