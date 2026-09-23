import { MongoClient, ServerApiVersion, type Db } from "mongodb";

/**
 * MongoDB connection — works against a local `mongod` or an Atlas cluster.
 *
 * The client is cached on `globalThis` because `next dev` re-evaluates modules
 * on every hot reload; without the cache each edit would open a new pool and
 * eventually exhaust connections.
 *
 * Nothing here throws on a missing database. The prototype has to stay
 * demonstrable on a laptop with no connection, so callers use `getDb()` and
 * treat `null` as "fall back to the in-memory seed" rather than as an error.
 *
 * The URI carries credentials, so it only ever comes from the environment.
 * Put it in `.env.local` (gitignored) — never in source, never in a commit.
 */

export const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";

export const DB_NAME = process.env.MONGODB_DB ?? "ghorly";

/** `mongodb+srv://` means Atlas: remote, so it needs a longer leash. */
const isAtlas = MONGODB_URI.startsWith("mongodb+srv://");

/** Never log the password if a URI ever needs to appear in output. */
export function redactUri(uri: string): string {
  return uri.replace(/\/\/([^:/?#]+):([^@]+)@/, "//$1:***@");
}

declare global {
  var __ghorlyMongo:
    | {
        client: MongoClient | null;
        promise: Promise<MongoClient> | null;
        lastFailureAt: number;
      }
    | undefined;
}

const cache = (globalThis.__ghorlyMongo ??= {
  client: null,
  promise: null,
  lastFailureAt: 0,
});

/** After a failed connect, don't retry on every request — back off briefly. */
const RETRY_COOLDOWN_MS = 10_000;

function createClient(): MongoClient {
  return new MongoClient(MONGODB_URI, {
    // Fail fast enough that a machine with no database falls back quickly
    // instead of hanging the page for the driver's 30s default — but give a
    // remote Atlas cluster room for a real round trip.
    serverSelectionTimeoutMS: isAtlas ? 8000 : 1500,
    connectTimeoutMS: isAtlas ? 10000 : 1500,
    ...(isAtlas
      ? {
          serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
          },
        }
      : {}),
  });
}

/**
 * Returns a connected `Db`, or `null` when MongoDB is unreachable.
 * Never throws — the caller decides what to do without a database.
 */
export async function getDb(): Promise<Db | null> {
  if (cache.client) return cache.client.db(DB_NAME);

  if (Date.now() - cache.lastFailureAt < RETRY_COOLDOWN_MS) return null;

  try {
    cache.promise ??= createClient().connect();
    cache.client = await cache.promise;
    cache.lastFailureAt = 0;
    return cache.client.db(DB_NAME);
  } catch {
    cache.promise = null;
    cache.client = null;
    cache.lastFailureAt = Date.now();
    return null;
  }
}

/** Used by the seed script and the ping check, which *should* fail loudly. */
export async function requireDb(): Promise<Db> {
  const client = await createClient().connect();
  cache.client = client;
  return client.db(DB_NAME);
}

export async function closeDb(): Promise<void> {
  await cache.client?.close();
  cache.client = null;
  cache.promise = null;
}

export { isAtlas };
