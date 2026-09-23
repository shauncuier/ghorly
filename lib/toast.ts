/**
 * Toast queue.
 *
 * Deliberately a module-level external store rather than React state, because
 * the things that raise toasts are the mutation functions in `lib/api/` —
 * plain async functions that are not components and have no hooks. `acceptRequest()`
 * can call `toast.success(...)` directly, and the `<Toaster/>` subscribes.
 *
 * Toasts are ephemeral, so they deliberately live outside the persisted app
 * store: nobody wants yesterday's "কোটেশন পাঠানো হয়েছে" to reappear on reload.
 */

export type ToastTone = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  /** Milliseconds before auto-dismiss. `0` keeps it until dismissed. */
  duration: number;
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();
let counter = 0;

/** Stable empty array for the server snapshot — a new [] each call would loop. */
const EMPTY: Toast[] = [];

function emit() {
  // New array identity so useSyncExternalStore sees the change.
  toasts = [...toasts];
  listeners.forEach((l) => l(toasts));
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts(): Toast[] {
  return toasts;
}

export function getServerToasts(): Toast[] {
  return EMPTY;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function clearToasts() {
  toasts = [];
  emit();
}

function push(
  tone: ToastTone,
  title: string,
  options: { description?: string; duration?: number } = {},
): string {
  const id = `toast-${++counter}`;
  const next: Toast = {
    id,
    tone,
    title,
    description: options.description,
    duration: options.duration ?? 4000,
  };
  toasts = [...toasts, next];
  emit();

  if (next.duration > 0 && typeof window !== "undefined") {
    window.setTimeout(() => dismissToast(id), next.duration);
  }
  return id;
}

export const toast = {
  success: (title: string, options?: { description?: string; duration?: number }) =>
    push("success", title, options),
  error: (title: string, options?: { description?: string; duration?: number }) =>
    push("error", title, options),
  info: (title: string, options?: { description?: string; duration?: number }) =>
    push("info", title, options),
  warning: (title: string, options?: { description?: string; duration?: number }) =>
    push("warning", title, options),
  dismiss: dismissToast,
  clear: clearToasts,
};
