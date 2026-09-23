import { normalisePhone, requestOtp } from "@/lib/auth/otp";
import { PhoneSchema } from "@/lib/api/validation";
import { clientKey, rateLimit, LIMITS } from "@/lib/api/rate-limit";
import { fail, internal, ok, rateLimited } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = clientKey(request);

  // Limited per IP *and* per number below: one stops a single host spraying
  // many numbers, the other stops many hosts hammering one number.
  const ipLimit = rateLimit(
    `otp-req:ip:${ip}`,
    LIMITS.otpRequest.limit,
    LIMITS.otpRequest.window,
  );
  if (!ipLimit.ok) return rateLimited(ipLimit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("invalid", "অনুরোধটি পড়া যায়নি।");
  }

  const raw = (body as { phone?: unknown })?.phone;
  const parsed = PhoneSchema.safeParse(raw);
  if (!parsed.success) return fail("invalid", "সঠিক মোবাইল নম্বর দিন।");

  const phone = normalisePhone(parsed.data);
  if (!phone) return fail("invalid", "সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা, ০১ দিয়ে শুরু)।");

  const phoneLimit = rateLimit(
    `otp-req:phone:${phone}`,
    LIMITS.otpRequest.limit,
    LIMITS.otpRequest.window,
  );
  if (!phoneLimit.ok) return rateLimited(phoneLimit.retryAfterSeconds);

  try {
    const result = await requestOtp(phone);

    if (!result.ok) {
      if (result.retryAfterSeconds) return rateLimited(result.retryAfterSeconds);
      return fail("unavailable", result.error ?? "কোড পাঠানো যায়নি।");
    }

    // Never reveals whether the number has an account — that would make this
    // endpoint a user-enumeration oracle.
    return ok({
      sent: true,
      // Present only while no SMS gateway is configured, so the flow is
      // testable. Once BULKSMSBD_API_KEY and BULKSMSBD_SENDER_ID are set this is absent.
      devCode: result.devCode,
    });
  } catch (error) {
    return internal("request-otp", error);
  }
}
