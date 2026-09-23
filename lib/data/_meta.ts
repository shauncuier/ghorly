/**
 * Seed-document metadata helper.
 *
 * Every entity needs `createdAt` / `updatedAt` because those fields ship to
 * MongoDB later. Hand-typing two timestamps per row across ~400 seed records
 * would be noise, so this fills them from one explicit date.
 *
 * All values are literal strings anchored to the frozen clock — no `Date.now()`
 * anywhere near seed data.
 */

/** When Ghorly "launched". Most taxonomy rows date from here. */
export const PLATFORM_EPOCH = "2025-06-01T09:00";

export function meta(createdAt: string = PLATFORM_EPOCH, updatedAt: string = createdAt) {
  return { createdAt, updatedAt };
}
