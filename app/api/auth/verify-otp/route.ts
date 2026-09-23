import { normalisePhone, verifyOtp } from "@/lib/auth/otp";
import {
  defaultRoleFor,
  findOrCreateAccount,
  recordLogin,
  rolesFor,
} from "@/lib/auth/accounts";
import { setSessionCookie } from "@/lib/auth/session";
import { NameSchema, OtpCodeSchema, PhoneSchema } from "@/lib/api/validation";
import { clientKey, rateLimit, LIMITS } from "@/lib/api/rate-limit";
import { fail, internal, ok, rateLimited } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = rateLimit(
    `otp-verify:${clientKey(request)}`,
    LIMITS.otpVerify.limit,
    LIMITS.otpVerify.window,
  );
  if (!limit.ok) return rateLimited(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("invalid", "অনুরোধটি পড়া যায়নি।");
  }

  const input = body as { phone?: unknown; code?: unknown; name?: unknown };

  const phoneParsed = PhoneSchema.safeParse(input.phone);
  const codeParsed = OtpCodeSchema.safeParse(input.code);
  const nameParsed = NameSchema.safeParse(input.name);

  if (!phoneParsed.success) return fail("invalid", "সঠিক মোবাইল নম্বর দিন।");
  if (!codeParsed.success) return fail("invalid", "৬ সংখ্যার কোড দিন।");

  const phone = normalisePhone(phoneParsed.data);
  if (!phone) return fail("invalid", "সঠিক মোবাইল নম্বর দিন।");

  try {
    const result = await verifyOtp(phone, codeParsed.data);
    if (!result.ok) {
      return fail("invalid", result.error ?? "কোডটি সঠিক নয়।");
    }

    const account = await findOrCreateAccount(
      phone,
      nameParsed.success ? nameParsed.data : undefined,
    );
    if (!account) return fail("unavailable", "অ্যাকাউন্ট তৈরি করা যায়নি।");

    if (account.status === "suspended") {
      return fail("forbidden", "এই অ্যাকাউন্টটি স্থগিত করা হয়েছে।");
    }

    const roles = rolesFor(account);
    await setSessionCookie({
      sub: account._id,
      phone: account.phone,
      roles,
      customerId: account.customerId,
      providerId: account.providerId,
      activeRole: defaultRoleFor(account),
    });

    await recordLogin(account._id);

    return ok({
      signedIn: true,
      account: {
        id: account._id,
        bnName: account.bnName,
        roles,
        activeRole: defaultRoleFor(account),
      },
    });
  } catch (error) {
    return internal("verify-otp", error);
  }
}
