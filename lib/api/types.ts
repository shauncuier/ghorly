/**
 * The read envelope.
 *
 * This is the single most important shape in the seam, and the easiest thing
 * to get wrong. A hook that returns `Provider[]` today but
 * `{data, isLoading, error}` once it is fetch-backed forces every call site to
 * change on the day the backend lands. So the envelope exists from the start.
 *
 * Today `isLoading` is always false and `error` always null, because the store
 * is synchronous — but every consumer is already written to render a skeleton
 * on `isLoading` and an error state on `error`. That means the loading and
 * error UI the brief asks for are exercised by real code paths instead of
 * being decorative, and none of it has to be retrofitted later.
 */
export interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export interface ApiError {
  code: "not_found" | "invalid" | "conflict" | "network" | "unknown";
  message: string;
}

/** Wraps a synchronous value in the envelope. */
export function ready<T>(data: T): QueryResult<T> {
  return { data, isLoading: false, error: null, refetch: noop };
}

export function missing<T>(message = "খুঁজে পাওয়া যায়নি"): QueryResult<T> {
  return {
    data: undefined,
    isLoading: false,
    error: { code: "not_found", message },
    refetch: noop,
  };
}

function noop() {}

export type { AppState } from "@/lib/store/types";
