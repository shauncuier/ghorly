import { clearSessionCookie } from "@/lib/auth/session";
import { ok } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/**
 * POST rather than GET: a link or an <img> pointing at a GET logout would sign
 * people out through CSRF. `sameSite: lax` blocks the cross-site POST.
 */
export async function POST() {
  await clearSessionCookie();
  return ok({ signedOut: true });
}
