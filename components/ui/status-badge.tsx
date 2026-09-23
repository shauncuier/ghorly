import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { STATUS, URGENCY, ACCOUNT_STATUS_BN } from "@/lib/strings";
import type {
  AccountStatus,
  BookingStatus,
  DisputeStatus,
  PaymentStatus,
  QuoteStatus,
  RequestStatus,
  UrgencyLevel,
  VerificationStatus,
} from "@/lib/types";

/**
 * The ONLY way a status is rendered anywhere in Ghorly.
 *
 * Both the Bangla label and the tone come from the registry in
 * `lib/strings.ts`, so the same state cannot pick up two different names on
 * two different screens. The dot is not decoration — it is what keeps the
 * badge meaningful without relying on colour alone (WCAG 1.4.1), which matters
 * here because the brand teal and the success green are close in hue.
 */

type StatusMap = {
  request: RequestStatus;
  quote: QuoteStatus;
  booking: BookingStatus;
  payment: PaymentStatus;
  verification: VerificationStatus;
  dispute: DisputeStatus;
  urgency: UrgencyLevel;
  account: AccountStatus;
};

export type StatusBadgeProps<D extends keyof StatusMap> = {
  domain: D;
  status: StatusMap[D];
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function StatusBadge<D extends keyof StatusMap>({
  domain,
  status,
  size = "md",
  className,
}: StatusBadgeProps<D>) {
  const meta =
    domain === "urgency"
      ? URGENCY[status as UrgencyLevel]
      : domain === "account"
        ? ACCOUNT_STATUS_BN[status as AccountStatus]
        : STATUS[domain as keyof typeof STATUS][
            status as keyof (typeof STATUS)[keyof typeof STATUS]
          ];

  return (
    <Badge tone={meta.tone} size={size} className={cn("gap-1.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "rounded-full bg-current opacity-70",
          size === "sm" ? "size-1.5" : "size-2",
        )}
      />
      {meta.label}
    </Badge>
  );
}
