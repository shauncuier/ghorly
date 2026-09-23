"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import { formatPhone, toBn, toEn } from "@/lib/format";
import { ACTIONS, ROLE_BN, VALIDATION } from "@/lib/strings";
import type { Role } from "@/lib/types";

type Step = "phone" | "code";

const HOME_FOR: Record<Exclude<Role, "guest">, string> = {
  customer: "/customer",
  provider: "/provider",
  admin: "/admin",
};

/**
 * Phone + one-time code.
 *
 * Two steps: ask for the number, then the six-digit code. The server never
 * says whether a number already has an account — that would turn this into a
 * user-enumeration oracle — so both cases look identical here too.
 */
export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next");

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    if (!/^01[3-9]\d{8}$/.test(toEn(phone).replace(/\D/g, ""))) {
      setError(VALIDATION.phone);
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: toEn(phone) }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body?.error?.message ?? "কোড পাঠানো যায়নি।");
        return;
      }

      setDevCode(body.devCode ?? null);
      setStep("code");
      setCooldown(60);
      toast.success("কোড পাঠানো হয়েছে", {
        description: `${formatPhone(phone)} নম্বরে ৬ সংখ্যার কোড গেছে।`,
      });
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setPending(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(code)) {
      setError("৬ সংখ্যার কোড দিন।");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: toEn(phone),
          code,
          name: name.trim() || undefined,
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body?.error?.message ?? "কোডটি সঠিক নয়।");
        return;
      }

      const activeRole = body.account?.activeRole as Exclude<Role, "guest">;
      const roles = (body.account?.roles ?? []) as Exclude<Role, "guest">[];
      toast.success(`স্বাগতম, ${body.account?.bnName ?? ""}`);

      // Only honour ?next= if this account can actually use that section —
      // otherwise a provider following a customer link lands on an empty shell.
      const home = HOME_FOR[activeRole] ?? "/customer";
      const nextAllowed =
        next && roles.some((r) => next === HOME_FOR[r] || next.startsWith(`${HOME_FOR[r]}/`));

      // Full reload so the server re-reads the new session cookie and the
      // store bootstraps with the right scope.
      window.location.href = nextAllowed ? next : home;
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-fg">
          {step === "phone" ? "আবার স্বাগতম" : "কোডটি লিখুন"}
        </h1>
        <p className="text-base text-fg-secondary">
          {step === "phone"
            ? "আপনার মোবাইল নম্বর দিন, আমরা একটি কোড পাঠাব।"
            : `${formatPhone(phone)} নম্বরে পাঠানো ৬ সংখ্যার কোডটি লিখুন।`}
        </p>
      </div>

      {step === "phone" ? (
        <form onSubmit={sendCode} noValidate className="flex flex-col gap-5">
          <Field label="মোবাইল নম্বর" required error={error ?? undefined}>
            {(p) => (
              <Input
                {...p}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="০১XXXXXXXXX"
                invalid={!!error}
              />
            )}
          </Field>

          <Button type="submit" size="lg" block loading={pending}>
            কোড পাঠান
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} noValidate className="flex flex-col gap-5">
          <Field label="যাচাই কোড" required error={error ?? undefined}>
            {(p) => (
              <Input
                {...p}
                ref={codeRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  // toEn first: Bangla numerals are non-ASCII, so a bare
                  // \D strip would silently delete a code typed as ৯৪৬০৮০.
                  setCode(toEn(e.target.value).replace(/\D/g, ""))
                }
                placeholder="------"
                className="text-center text-xl tracking-[0.5em] font-latin"
                invalid={!!error}
              />
            )}
          </Field>

          <Field label="আপনার নাম" optional hint="নতুন অ্যাকাউন্ট হলে এটি ব্যবহার হবে">
            {(p) => (
              <Input
                {...p}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="পুরো নাম"
              />
            )}
          </Field>

          {devCode && (
            <p className="flex items-start gap-2.5 rounded-md bg-warning-50 px-4 py-3 text-sm text-warning-700">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>
                কোনো SMS গেটওয়ে সেট করা নেই, তাই কোডটি এখানে দেখানো হচ্ছে:{" "}
                <strong className="font-latin tabular">{devCode}</strong>
              </span>
            </p>
          )}

          <Button type="submit" size="lg" block loading={pending}>
            {ACTIONS.login}
          </Button>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
            >
              <ArrowLeft aria-hidden="true" />
              নম্বর বদলান
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={cooldown > 0 || pending}
              onClick={() => void sendCode()}
            >
              {cooldown > 0 ? `আবার পাঠান (${toBn(cooldown)})` : "আবার পাঠান"}
            </Button>
          </div>
        </form>
      )}

      <Separator label="তথ্য" />

      <p className="text-center text-sm text-fg-secondary">
        প্রথমবার লগ ইন করলে স্বয়ংক্রিয়ভাবে {ROLE_BN.customer} অ্যাকাউন্ট তৈরি হবে।{" "}
        <Link
          href="/register/provider"
          className="rounded-xs font-medium text-fg-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          পেশাদার হিসেবে যোগ দিতে চান?
        </Link>
      </p>
    </div>
  );
}
