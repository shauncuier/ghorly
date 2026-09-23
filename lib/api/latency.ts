/**
 * Simulated network latency for mutations.
 *
 * Two reasons this is worth having in a prototype with no backend. It makes
 * the demo *feel* real — buttons show a brief spinner instead of snapping
 * instantly, which is what a customer expects to see. And it forces every call
 * site to handle a pending state now, so nothing has to be retrofitted when
 * these become real `fetch` calls.
 *
 * The delay only ever runs inside event handlers and effects, never in a
 * render path, so the determinism rules that keep hydration clean still hold.
 */

export const SIMULATE_LATENCY = true;

export const LATENCY = {
  read: 120,
  write: 280,
  slowWrite: 450,
} as const;

export function delay(ms: number): Promise<void> {
  if (!SIMULATE_LATENCY || typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
