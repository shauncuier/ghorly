"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CheckboxField } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AREAS } from "@/lib/data/areas";
import { toast } from "@/lib/toast";
import { ACTIONS, VALIDATION } from "@/lib/strings";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", area: "", password: "" });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = VALIDATION.required;
    if (!/^01\d{9}$/.test(form.phone.replace(/\D/g, ""))) next.phone = VALIDATION.phone;
    if (!form.area) next.area = VALIDATION.selectOne;
    if (form.password.length < 6) next.password = "কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন";
    if (!agreed) next.agreed = "শর্তাবলীতে সম্মতি দিন";

    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success("অ্যাকাউন্ট তৈরি হয়েছে", {
      description: "এখন আপনি সেবার অনুরোধ পাঠাতে পারবেন।",
    });
    router.push("/customer");
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-fg">অ্যাকাউন্ট খুলুন</h1>
        <p className="text-base text-fg-secondary">
          কয়েক মিনিটেই শুরু করুন — কোনো খরচ নেই।
        </p>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field label="আপনার নাম" required error={errors.name}>
          {(p) => (
            <Input
              {...p}
              autoComplete="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="পুরো নাম"
              invalid={!!errors.name}
            />
          )}
        </Field>

        <Field label="মোবাইল নম্বর" required error={errors.phone} hint="যেমন ০১৭১২৩৪৫৬৭৮">
          {(p) => (
            <Input
              {...p}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="০১XXXXXXXXX"
              invalid={!!errors.phone}
            />
          )}
        </Field>

        <Field label="আপনার এলাকা" required error={errors.area}>
          {(p) => (
            <Select value={form.area} onValueChange={(v) => set("area", v)}>
              <SelectTrigger
                id={p.id}
                aria-describedby={p["aria-describedby"]}
                invalid={!!errors.area}
              >
                <SelectValue placeholder="এলাকা বেছে নিন" />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map((a) => (
                  <SelectItem key={a._id} value={a.slug}>
                    {a.bnName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>

        <Field label="পাসওয়ার্ড" required error={errors.password}>
          {(p) => (
            <Input
              {...p}
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              invalid={!!errors.password}
            />
          )}
        </Field>

        <div className="flex flex-col gap-1">
          <CheckboxField
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
            label="আমি শর্তাবলী ও গোপনীয়তা নীতিতে সম্মত"
          />
          {errors.agreed && <p className="text-xs text-danger-600">{errors.agreed}</p>}
        </div>

        <Button type="submit" size="lg" block loading={pending}>
          {ACTIONS.register}
        </Button>
      </form>

      <Separator label="অথবা" />

      <p className="text-center text-sm text-fg-secondary">
        আগে থেকেই অ্যাকাউন্ট আছে?{" "}
        <Link
          href="/login"
          className="rounded-xs font-medium text-fg-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          {ACTIONS.login}
        </Link>
      </p>
    </div>
  );
}
