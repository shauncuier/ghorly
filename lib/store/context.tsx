"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppState } from "@/lib/store/types";
import type { Action, Dispatch } from "@/lib/store/actions";
import { reducer } from "@/lib/store/reducer";
import { buildEmptyState } from "@/lib/store/initial-state";
import { toast } from "@/lib/toast";
import type { Role } from "@/lib/types";

const STORAGE_KEY = "ghorly.state.v1";

/**
 * Actions that never reach the server.
 *
 * These change `state.ui` only — a wizard draft, which thread looks read, the
 * active role. (Toasts are not store actions at all; they live in
 * `lib/toast.ts`.) There is nothing to persist, and POSTing them was an
 * outright bug: the wizard dispatches `DRAFT_PATCH` on every keystroke, so
 * typing a description fired a request per character, blew through the
 * mutation rate limit (120/minute) and buried the form in
 * "অনেক বেশি চেষ্টা হয়েছে" toasts before the user could reach step 2.
 *
 * `TOGGLE_FAVORITE` is here because the server genuinely does not store
 * favourites — see the note in `lib/db/scope.ts`. Persisting them per account
 * means a field on the customer document; until that exists, sending the
 * action upstream only spends rate limit to be ignored.
 */
const LOCAL_ONLY: ReadonlySet<Action["type"]> = new Set([
  "HYDRATE",
  "DRAFT_START",
  "DRAFT_PATCH",
  "DRAFT_SET_STEP",
  "DRAFT_RESET",
  "TOGGLE_FAVORITE",
  "MARK_THREAD_READ",
  "RESET_DEMO",
  "SET_ROLE",
]);

/** Where the data on screen is coming from right now. */
export type DataSource = "loading" | "database" | "offline";

/** The identity the server verified from the session cookie. */
export interface ServerSession {
  accountId: string;
  phone: string;
  roles: Role[];
  activeRole: Exclude<Role, "guest">;
  customerId: string | null;
  providerId: string | null;
}

/**
 * Overwrites the state's session block with the server-verified identity.
 *
 * The seed ships demo ids, and the offline cache may hold a previous user's.
 * Neither is allowed to decide who you are — only the cookie is, so every path
 * that loads state runs through here.
 */
function applyServerSession(state: AppState, session: ServerSession | null): AppState {
  return {
    ...state,
    session: {
      role: session?.activeRole ?? "guest",
      customerId: session?.customerId ?? "",
      providerId: session?.providerId ?? "",
    },
  };
}

/**
 * State and dispatch live in **separate** contexts.
 *
 * Every button needs `dispatch` but not `state`; splitting them means those
 * components never re-render when unrelated state changes. Consumption always
 * goes through `lib/api`, never through these contexts directly.
 */
const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<Dispatch | null>(null);
const SourceContext = createContext<DataSource>("loading");
const SessionContext = createContext<ServerSession | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Empty, not seeded. Deterministic either way, so the server HTML and the
  // first client render still match exactly — but starting empty keeps the
  // demo seed out of a signed-in user's markup, and makes every query report
  // `isLoading` until the session-scoped snapshot arrives.
  const [state, rawDispatch] = useReducer(reducer, undefined, buildEmptyState);
  const [source, setSource] = useState<DataSource>("loading");
  const [serverSession, setServerSession] = useState<ServerSession | null>(null);

  const mounted = useRef(false);
  // Mirrors serverSession for use inside the dispatch closure, which is
  // created once and must not capture a stale value.
  const sessionRef = useRef<ServerSession | null>(null);
  // Serialises writes: a queued action always sees the previous one's result,
  // so two quick clicks can't race and clobber each other.
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  /* ---------------- load ---------------- */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/bootstrap", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as {
          state: AppState;
          fromDatabase: boolean;
          session: ServerSession | null;
        };
        if (cancelled) return;

        if (body.state?.version === 1) {
          // The session block comes from the verified cookie, never from
          // persisted state — otherwise a stale cache could impersonate.
          rawDispatch({
            type: "HYDRATE",
            state: applyServerSession(body.state, body.session),
          });
        }
        setServerSession(body.session);
        sessionRef.current = body.session;
        setSource(body.fromDatabase ? "database" : "offline");
      } catch {
        if (cancelled) return;
        // No API, no database — fall back to whatever this browser last saw,
        // so the prototype still demos on a laptop with nothing running.
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as AppState;
            if (parsed?.version === 1) {
              // Never restore a session from the cache: identity comes from
              // the cookie alone.
              rawDispatch({ type: "HYDRATE", state: applyServerSession(parsed, null) });
            }
          }
        } catch {
          // Private mode or corrupt JSON; the seed is a fine fallback.
        }
        setSource("offline");
      } finally {
        mounted.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- offline cache ---------------- */

  useEffect(() => {
    if (!mounted.current) return;
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Quota or blocked storage; the app works without the cache.
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [state]);

  /* ---------------- refresh ---------------- */

  /** Re-pulls authoritative state, e.g. after the server rejects a write. */
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as {
        state: AppState;
        fromDatabase: boolean;
        session: ServerSession | null;
      };
      if (body.state?.version === 1) {
        rawDispatch({
          type: "HYDRATE",
          state: applyServerSession(body.state, body.session),
        });
      }
      setServerSession(body.session);
      sessionRef.current = body.session;
      setSource(body.fromDatabase ? "database" : "offline");
    } catch {
      setSource("offline");
    }
  }, []);

  /* ---------------- dispatch ---------------- */

  const dispatch = useCallback<Dispatch>((action) => {
    // Apply locally first so the UI responds immediately, then confirm with
    // the server. The server runs the same reducer, so the optimistic result
    // and the authoritative one agree except under concurrent edits.
    rawDispatch(action);

    if (!mounted.current) return;
    if (LOCAL_ONLY.has(action.type)) return;

    queue.current = queue.current
      .then(async () => {
        const res = await fetch("/api/mutate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
          cache: "no-store",
        });
        if (res.status === 401) {
          // Session expired mid-use. Bounce to login rather than letting the
          // optimistic update sit there pretending it saved.
          // Hard navigation: the session is gone, so the cached store must go
          // with it rather than surviving a client-side transition.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = `/login?next=${encodeURIComponent(location.pathname)}`;
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const message =
            body?.error?.message ?? "পরিবর্তনটি সংরক্ষণ করা যায়নি।";
          toast.error(message);
          // The optimistic change was rejected — pull authoritative state back.
          await refresh();
          return;
        }

        const body = (await res.json()) as {
          state: AppState;
          fromDatabase: boolean;
          persisted: number;
        };
        if (body.fromDatabase && body.state?.version === 1) {
          // Reconcile with what actually landed in Mongo.
          rawDispatch({
            type: "HYDRATE",
            state: applyServerSession(body.state, sessionRef.current),
          });
          setSource("database");
        } else {
          setSource("offline");
        }
      })
      .catch(() => {
        // Keep the optimistic local result and mark the session offline; the
        // app continues working, it just stops persisting.
        setSource("offline");
      });
  }, [refresh]);

  const contextState = useMemo(() => state, [state]);

  return (
    <StateContext.Provider value={contextState}>
      <DispatchContext.Provider value={dispatch}>
        <SourceContext.Provider value={source}>
          <SessionContext.Provider value={serverSession}>
            {children}
          </SessionContext.Provider>
        </SourceContext.Provider>
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

/**
 * Internal. Only `lib/api/*` may call these — components go through the query
 * hooks and mutation functions so the data layer stays swappable.
 */
export function useAppState(): AppState {
  const state = useContext(StateContext);
  if (!state) throw new Error("useAppState must be used inside <StoreProvider>.");
  return state;
}

export function useAppDispatch(): Dispatch {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error("useAppDispatch must be used inside <StoreProvider>.");
  return dispatch;
}

/** Drives the connection indicator in the app shell. */
export function useDataSource(): DataSource {
  return useContext(SourceContext);
}

/** The server-verified identity, or null when signed out. */
export function useServerSession(): ServerSession | null {
  return useContext(SessionContext);
}

export function clearPersistedState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

export type { Action };
