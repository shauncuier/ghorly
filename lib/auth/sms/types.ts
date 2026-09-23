/**
 * SMS gateway contract.
 *
 * Kept behind an interface so swapping BulkSMSBD for SSL Wireless, Robi or
 * Twilio is one file, not a rewrite of the OTP flow.
 */

export interface SmsResult {
  ok: boolean;
  /** Gateway's own reference, useful for support tickets. */
  reference?: string;
  /**
   * Operator-facing detail for logs and support tickets. Most gateway failures
   * are configuration problems — inactive sender ID, expired balance, no
   * gateway for this key — which a signing-in user can neither act on nor
   * should learn about. Never render this.
   */
  message?: string;
  /** Bangla, actionable by the user, safe to render. */
  userMessage?: string;
  /** Machine code for logs — never shown to users. */
  code?: string;
  /** True when retrying might work (network blip, gateway busy). */
  retryable?: boolean;
}

export interface SmsProvider {
  readonly name: string;
  /** `to` is a normalised 11-digit BD number. */
  send(to: string, text: string): Promise<SmsResult>;
  /** Remaining credit, when the gateway exposes it. */
  balance?(): Promise<number | null>;
}
