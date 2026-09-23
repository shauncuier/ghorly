"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { ACTIONS, VALIDATION } from "@/lib/strings";

const TOPICS = [
  { value: "customer", label: "আমি সেবা নিতে চাই" },
  { value: "provider", label: "আমি পেশাদার হিসেবে যোগ দিতে চাই" },
  { value: "complaint", label: "একটি অভিযোগ আছে" },
  { value: "press", label: "সংবাদমাধ্যম / অংশীদারিত্ব" },
  { value: "other", label: "অন্য কিছু" },
];

/**
 * Client island on an otherwise server-rendered contact page.
 * Validation is Bangla and inline; submitting is simulated.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const next: Record<string, string> = {};
    if (!name.trim()) next.name = VALIDATION.required;
    if (!/^01\d{9}$/.test(phone.replace(/\D/g, ""))) next.phone = VALIDATION.phone;
    if (!topic) next.topic = VALIDATION.selectOne;
    if (message.trim().length < 10) next.message = VALIDATION.minLength;

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    await new Promise((r) => setTimeout(r, 600));
    setPending(false);

    toast.success("বার্তা পাঠানো হয়েছে", {
      description: "আমরা এক কর্মদিবসের মধ্যে উত্তর দেব।",
    });
    setName("");
    setPhone("");
    setTopic("");
    setMessage("");
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="আপনার নাম" required error={errors.name}>
        {(p) => (
          <Input
            {...p}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="পুরো নাম লিখুন"
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
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="০১XXXXXXXXX"
            invalid={!!errors.phone}
          />
        )}
      </Field>

      <Field label="বিষয়" required error={errors.topic}>
        {(p) => (
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger id={p.id} aria-describedby={p["aria-describedby"]} invalid={!!errors.topic}>
              <SelectValue placeholder="একটি বিষয় বেছে নিন" />
            </SelectTrigger>
            <SelectContent>
              {TOPICS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      <Field label="আপনার বার্তা" required error={errors.message}>
        {(p) => (
          <Textarea
            {...p}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="যতটা সম্ভব বিস্তারিত লিখুন…"
            rows={5}
            invalid={!!errors.message}
          />
        )}
      </Field>

      <Button type="submit" size="lg" loading={pending} className="w-fit">
        {ACTIONS.submit}
      </Button>
    </form>
  );
}
