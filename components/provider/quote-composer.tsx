"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { useCategoryById, useCurrentProvider } from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { formatBdt } from "@/lib/format";
import { ACTIONS, VALIDATION } from "@/lib/strings";
import type { ServiceRequest } from "@/lib/types";

/**
 * Accepting a request is really "send a quote", so the two are one action.
 * The amount is prefilled from the provider's own rate for that category —
 * the most common case is accepting at your standard price.
 */
export function QuoteComposer({
  request,
  open,
  onOpenChange,
}: {
  request: ServiceRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: provider } = useCurrentProvider();
  const { data: category } = useCategoryById(request.categoryId);
  const { acceptRequest } = useMutations();

  const suggested =
    provider?.categoryPricing[request.categoryId] ?? provider?.priceFrom ?? 800;

  const [amount, setAmount] = useState(String(suggested));
  const [minutes, setMinutes] = useState(String(category?.avgDurationMinutes ?? 60));
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function send() {
    const next: Record<string, string> = {};
    if (!amount || Number(amount) <= 0) next.amount = VALIDATION.positiveAmount;
    if (!minutes || Number(minutes) <= 0) next.minutes = VALIDATION.positiveAmount;
    if (message.trim().length < 10) next.message = "গ্রাহককে কিছু লিখে জানান";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    try {
      await acceptRequest(request._id, {
        amount: Number(amount),
        message: message.trim(),
        estimatedMinutes: Number(minutes),
      });
      onOpenChange(false);
      setMessage("");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle>কোটেশন পাঠান</ModalTitle>
          <ModalDescription>{request.bnTitle}</ModalDescription>
        </ModalHeader>

        <ModalBody className="flex flex-col gap-5">
          <p className="rounded-md bg-surface-muted px-4 py-3 text-sm text-fg-secondary">
            {request.bnDescription}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="আপনার দর (৳)"
              required
              error={errors.amount}
              hint={`আপনার সাধারণ দর ${formatBdt(suggested)}`}
            >
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  invalid={!!errors.amount}
                />
              )}
            </Field>

            <Field label="আনুমানিক সময় (মিনিট)" required error={errors.minutes}>
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  inputMode="numeric"
                  min={15}
                  step={15}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  invalid={!!errors.minutes}
                />
              )}
            </Field>
          </div>

          <Field
            label="গ্রাহকের জন্য বার্তা"
            required
            error={errors.message}
            hint="কী কাজ করবেন, কী লাগবে — সংক্ষেপে লিখুন"
          >
            {(p) => (
              <Textarea
                {...p}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="যেমন: গ্যাস রিফিল ও কয়েল পরিষ্কার দুটোই লাগবে। কাজ শেষে তিন মাসের গ্যারান্টি দিই।"
                invalid={!!errors.message}
              />
            )}
          </Field>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {ACTIONS.cancel}
          </Button>
          <Button loading={pending} onClick={send}>
            {ACTIONS.sendQuote}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
