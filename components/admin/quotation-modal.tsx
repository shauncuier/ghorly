"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { useAllProviders, useAreas, useCategories } from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { formatBdt, formatDate, formatPhone, formatRating } from "@/lib/format";
import { ACTIONS } from "@/lib/strings";
import type { ServiceRequest } from "@/lib/types";

/** Pre-fill for the provider's share; the admin can change it. */
const DEFAULT_COMMISSION_RATE = 0.12;

/**
 * The dispatch step. The admin has phoned professionals and agreed a price
 * with one of them; this records who, what the customer pays and what the
 * professional receives, and sends the customer a quotation.
 *
 * Candidates are active professionals who offer the service. Those who also
 * serve the request's area come first. Each shows a phone number so the admin
 * can call them — the only place in the product where that number appears.
 */
export function QuotationModal({
  request,
  onClose,
}: {
  request: ServiceRequest | null;
  onClose: () => void;
}) {
  return (
    <Modal open={request !== null} onOpenChange={(o) => !o && onClose()}>
      <ModalContent size="md">
        {/* Keyed so each request starts with a clean form. */}
        {request ? <QuotationForm key={request._id} request={request} onClose={onClose} /> : null}
      </ModalContent>
    </Modal>
  );
}

function QuotationForm({ request, onClose }: { request: ServiceRequest; onClose: () => void }) {
  const { data: providers } = useAllProviders();
  const { data: categories } = useCategories();
  const { data: areas } = useAreas();
  const { sendQuotation } = useMutations();

  const [providerId, setProviderId] = useState("");
  const [amount, setAmount] = useState("");
  const [payout, setPayout] = useState("");
  const [payoutTouched, setPayoutTouched] = useState(false);
  const [minutes, setMinutes] = useState("60");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = (categories ?? []).find((c) => c._id === request.categoryId);
  const area = (areas ?? []).find((a) => a._id === request.areaId);

  const candidates = useMemo(() => {
    const serves = (p: { areaId: string; serviceAreaIds: string[] }) =>
      p.areaId === request.areaId || p.serviceAreaIds.includes(request.areaId);
    return (providers ?? [])
      .filter((p) => p.status === "active" && p.activeCategoryIds.includes(request.categoryId))
      .map((p) => ({ provider: p, servesArea: serves(p) }))
      .sort(
        (a, b) =>
          Number(b.servesArea) - Number(a.servesArea) || b.provider.rating - a.provider.rating,
      );
  }, [providers, request.areaId, request.categoryId]);

  const amountN = Number(amount) || 0;
  // Until the admin types a payout, it tracks the customer price.
  const payoutN = payoutTouched
    ? Number(payout) || 0
    : Math.max(0, amountN - Math.round(amountN * DEFAULT_COMMISSION_RATE));
  const commission = amountN - payoutN;

  async function submit() {
    setError(null);
    if (!providerId) return setError("একজন পেশাদার বেছে নিন।");
    if (amountN <= 0) return setError("গ্রাহকের দাম লিখুন।");
    if (payoutN > amountN) return setError("পেশাদারের পাওনা গ্রাহকের দামের বেশি হতে পারে না।");
    const est = Number(minutes);
    if (!Number.isInteger(est) || est <= 0) return setError("আনুমানিক সময় মিনিটে লিখুন।");

    setPending(true);
    try {
      await sendQuotation({
        requestId: request._id,
        providerId,
        amount: amountN,
        providerPayout: payoutN,
        estimatedMinutes: est,
        message: message.trim(),
      });
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <ModalHeader>
        <ModalTitle>কোটেশন পাঠান</ModalTitle>
        <ModalDescription>
          {request.bnTitle} · {category?.bnName} · {area?.bnName} ·{" "}
          {formatDate(request.preferredDate, "medium")}
        </ModalDescription>
      </ModalHeader>

      <ModalBody className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto">
        {request.bnDescription ? (
          <p className="rounded-md bg-surface-muted px-4 py-3 text-sm text-fg-secondary">
            {request.bnDescription}
          </p>
        ) : null}

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2 text-sm font-medium text-fg">পেশাদার</legend>
          {candidates.length === 0 ? (
            <p className="text-sm text-fg-tertiary">এই সেবা দেন এমন সক্রিয় কোনো পেশাদার নেই।</p>
          ) : (
            <RadioGroup
              value={providerId}
              onValueChange={setProviderId}
              className="flex flex-col gap-2"
              aria-label="পেশাদার বেছে নিন"
            >
              {candidates.map(({ provider, servesArea }) => (
                <RadioCard
                  key={provider._id}
                  value={provider._id}
                  label={provider.bnName}
                  hint={[
                    `★ ${formatRating(provider.rating)}`,
                    provider.phone ? formatPhone(provider.phone) : null,
                    servesArea ? "এই এলাকায় কাজ করেন" : "অন্য এলাকার",
                    provider.categoryPricing[request.categoryId]
                      ? `সাধারণ দাম ${formatBdt(provider.categoryPricing[request.categoryId])}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              ))}
            </RadioGroup>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="গ্রাহকের দাম (৳)" required>
            {(p) => (
              <Input
                {...p}
                type="number"
                inputMode="numeric"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            )}
          </Field>
          <Field
            label="পেশাদারের পাওনা (৳)"
            hint={`কমিশন: ${formatBdt(Math.max(0, commission))}`}
            required
          >
            {(p) => (
              <Input
                {...p}
                type="number"
                inputMode="numeric"
                min={0}
                value={payoutTouched ? payout : String(payoutN || "")}
                onChange={(e) => {
                  setPayoutTouched(true);
                  setPayout(e.target.value);
                }}
              />
            )}
          </Field>
          <Field label="আনুমানিক সময় (মিনিট)" required>
            {(p) => (
              <Input
                {...p}
                type="number"
                inputMode="numeric"
                min={1}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field label="গ্রাহকের জন্য নোট" optional>
          {(p) => (
            <Textarea
              {...p}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="কী কাজ হবে, কী অন্তর্ভুক্ত — গ্রাহক এটি দেখবেন।"
            />
          )}
        </Field>

        {error ? (
          <p role="alert" className="text-sm text-danger-700">
            {error}
          </p>
        ) : null}
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          {ACTIONS.cancel}
        </Button>
        <Button loading={pending} onClick={() => void submit()}>
          কোটেশন পাঠান
        </Button>
      </ModalFooter>
    </>
  );
}
