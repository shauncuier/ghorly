import "server-only";

import type { AnyBulkWriteOperation, ClientSession, Document } from "mongodb";
import { DB_NAME, getDb, getMongoClient } from "@/lib/db/client";
import { COLLECTIONS } from "@/lib/db/collections";
import { buildInitialState } from "@/lib/store/initial-state";
import type { AppState, Entities, EntityKey } from "@/lib/store/types";

/**
 * Turns MongoDB collections into the `AppState` shape the app already speaks,
 * and writes changes back.
 *
 * Reading the whole graph in one go is a deliberate choice for this dataset —
 * roughly six hundred documents across fifteen collections, which Mongo returns
 * in a few milliseconds. It keeps all forty selector hooks in `lib/api/queries.ts`
 * working unchanged against one state object, which is what makes this
 * migration a handful of files instead of a rewrite. Per-resource endpoints
 * with pagination are the right move once the data outgrows a single snapshot;
 * see the note at the bottom of `lib/api/SCHEMA.md`.
 */

export interface LoadResult {
  state: AppState;
  /** False when Mongo was unreachable and the seed was used instead. */
  fromDatabase: boolean;
}

/** `_id` is the document key in Mongo and the entity id in the app — same field. */
function indexDocs<T extends { _id: string }>(rows: T[]) {
  const byId: Record<string, T> = {};
  const order: string[] = [];
  for (const row of rows) {
    byId[row._id] = row;
    order.push(row._id);
  }
  return { byId, order };
}

export async function loadState(): Promise<LoadResult> {
  const db = await getDb();
  if (!db) return { state: buildInitialState(), fromDatabase: false };

  try {
    const seed = buildInitialState();
    const entities = {} as Entities;
    const order = {} as Record<EntityKey, string[]>;

    await Promise.all(
      COLLECTIONS.map(async (name) => {
        // Entities use readable string `_id`s, so the driver's default
        // ObjectId-shaped generics don't apply — hence the explicit cast.
        const rows = (await db
          .collection(name)
          .find({})
          .toArray()) as unknown as { _id: string }[];

        const { byId, order: ids } = indexDocs(rows);
        entities[name] = byId as never;
        order[name] = ids;
      }),
    );

    // A database with nothing in it has not been seeded: show the seed, and
    // say it isn't the database. This is decided for the whole database, not
    // per collection — an empty collection in a seeded database is real data
    // (e.g. a customer deleted their last address), and filling it from the
    // seed brought deleted records back and fed writes documents that were
    // never in Mongo.
    if (COLLECTIONS.every((name) => order[name].length === 0)) {
      return { state: seed, fromDatabase: false };
    }

    // `session` and `ui` are per-browser concerns, not persisted rows — except
    // the id counters, which must be shared so two browsers don't mint the
    // same id.
    const meta = (await db.collection("_appMeta").findOne({ _id: "ui" as never })) as
      | { ui?: Partial<AppState["ui"]> }
      | null;

    return {
      state: {
        version: 1,
        session: seed.session,
        entities,
        order,
        ui: {
          ...seed.ui,
          counters: { ...seed.ui.counters, ...(meta?.ui?.counters ?? {}) },
        },
      },
      fromDatabase: true,
    };
  } catch {
    return { state: buildInitialState(), fromDatabase: false };
  }
}

/** A write lost a race: a record changed (or its id was taken) since it was read. */
export class WriteConflictError extends Error {
  constructor(collection: string) {
    super(`write conflict in ${collection}`);
    this.name = "WriteConflictError";
  }
}

/** `_v` is absent on documents written before versioning existed. */
type VersionedDoc = { _id: string; _v?: number };

function versionFilter(id: string, prev: VersionedDoc): Document {
  return (
    prev._v === undefined
      ? { _id: id, _v: { $exists: false } }
      : { _id: id, _v: prev._v }
  ) as unknown as Document;
}

interface CollectionPlan {
  name: EntityKey;
  ops: AnyBulkWriteOperation<Document>[];
  inserts: number;
  replaces: number;
  deletes: number;
}

/**
 * Persists the entities that actually changed.
 *
 * The server applies the same reducer the client does, so rather than
 * diffing field by field we compare document identity — the reducer returns
 * new objects only for what it touched, so a `!==` check is both correct and
 * cheap.
 *
 * Every mutation is read-modify-write over a snapshot, so each write is
 * conditional on the document still being the version that was read (`_v`, a
 * per-document counter — `updatedAt` is only minute-precise, so two edits in
 * the same minute would look identical), and a
 * new document is an insert that fails if the id exists. Two requests racing
 * on the same records — say, accepting two sibling quotes — cannot both win:
 * the loser gets a `WriteConflictError`. Where the server supports it (replica
 * set / Atlas) the whole mutation is one transaction, so the loser leaves no
 * partial writes behind either.
 *
 * Throws on failure. Reporting `written: 0` instead let the API answer 200
 * for a write that never happened.
 */
export async function persistChanges(
  before: AppState,
  after: AppState,
): Promise<{ written: number; fromDatabase: boolean }> {
  const client = await getMongoClient();
  if (!client) return { written: 0, fromDatabase: false };
  const db = client.db(DB_NAME);

  const plans: CollectionPlan[] = [];

  for (const name of COLLECTIONS) {
    const prevDocs = before.entities[name] as Record<string, VersionedDoc>;
    const nextDocs = after.entities[name] as Record<string, VersionedDoc>;
    const plan: CollectionPlan = { name, ops: [], inserts: 0, replaces: 0, deletes: 0 };

    for (const [id, doc] of Object.entries(nextDocs)) {
      const prev = prevDocs[id];
      if (prev === doc) continue;
      if (!prev) {
        plan.ops.push({ insertOne: { document: { ...doc, _v: 1 } as unknown as Document } });
        plan.inserts += 1;
      } else {
        plan.ops.push({
          replaceOne: {
            filter: versionFilter(id, prev),
            replacement: { ...doc, _v: (prev._v ?? 0) + 1 } as unknown as Document,
          },
        });
        plan.replaces += 1;
      }
    }

    // Anything removed from the store is removed from the collection too.
    for (const [id, prev] of Object.entries(prevDocs)) {
      if (!nextDocs[id]) {
        plan.ops.push({
          deleteOne: { filter: versionFilter(id, prev) },
        });
        plan.deletes += 1;
      }
    }

    if (plan.ops.length > 0) plans.push(plan);
  }

  const counters = after.ui.counters;
  const countersChanged = before.ui.counters !== counters;

  const run = async (session?: ClientSession) => {
    let written = 0;
    for (const plan of plans) {
      let result;
      try {
        result = await db
          .collection(plan.name)
          .bulkWrite(plan.ops, { ordered: true, session });
      } catch (error) {
        // Duplicate `_id` on insert: somebody else created that id first.
        if ((error as { code?: number }).code === 11000) {
          throw new WriteConflictError(plan.name);
        }
        throw error;
      }
      if (
        result.insertedCount !== plan.inserts ||
        result.matchedCount !== plan.replaces ||
        result.deletedCount !== plan.deletes
      ) {
        throw new WriteConflictError(plan.name);
      }
      written += plan.ops.length;
    }

    if (countersChanged) {
      // `$max`, not a replace: a slower request must never move a counter
      // backwards, or the next id minted would collide.
      const $max: Record<string, number> = {};
      for (const [prefix, n] of Object.entries(counters)) {
        $max[`ui.counters.${prefix}`] = n;
      }
      await db
        .collection("_appMeta")
        .updateOne({ _id: "ui" as never }, { $max }, { upsert: true, session });
      written += 1;
    }
    return written;
  };

  const session = client.startSession();
  try {
    let written = 0;
    try {
      await session.withTransaction(async () => {
        written = await run(session);
      });
    } catch (error) {
      // Standalone `mongod` (local dev) has no transactions. The conditional
      // writes above still stop a lost update; only atomicity across
      // collections is lost, which is acceptable on a laptop.
      if (!isTransactionsUnsupported(error)) throw error;
      written = await run();
    }
    return { written, fromDatabase: true };
  } finally {
    await session.endSession();
  }
}

function isTransactionsUnsupported(error: unknown): boolean {
  const e = error as { code?: number; message?: string };
  return (
    e?.code === 20 ||
    /Transaction numbers are only allowed|replica set/i.test(e?.message ?? "")
  );
}

/**
 * Direct reads for server components.
 *
 * Public pages are statically generated for SEO, so they read Mongo here
 * rather than going out through HTTP to their own API — and fall back to the
 * seed so `next build` still succeeds on a machine with no database.
 */
export async function findOne<T>(
  collection: EntityKey,
  filter: Record<string, unknown>,
): Promise<T | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    return (await db.collection(collection).findOne(filter)) as T | null;
  } catch {
    return null;
  }
}

export async function findMany<T>(
  collection: EntityKey,
  filter: Record<string, unknown> = {},
): Promise<T[] | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    return (await db.collection(collection).find(filter).toArray()) as T[];
  } catch {
    return null;
  }
}
