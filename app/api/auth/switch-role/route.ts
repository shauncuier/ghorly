import { z } from "zod";
import { getSession, setSessionCookie } from "@/lib/auth/session";
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

  if (!session.roles.includes(parsed.data.role)) {
    return fail("forbidden", "এই ভূমিকায় প্রবেশের অনুমতি নেই।");
  }

  try {
    await setSessionCookie({
      sub: session.sub,
      phone: session.phone,
      roles: session.roles,
      customerId: session.customerId,
      providerId: session.providerId,
      activeRole: parsed.data.role,
    });
    return ok({ activeRole: parsed.data.role });
  } catch (error) {
    return internal("switch-role", error);
  }
}
