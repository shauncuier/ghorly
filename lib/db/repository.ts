import "server-only";

import type { AnyBulkWriteOperation, Document } from "mongodb";
import { getDb } from "@/lib/db/client";
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

        // An empty collection means the database exists but has not been
        // seeded; fall back to the seed for that bucket rather than showing a
        // half-empty product.
        if (rows.length === 0) {
          entities[name] = seed.entities[name] as never;
          order[name] = seed.order[name];
          return;
        }

        const { byId, order: ids } = indexDocs(rows);
        entities[name] = byId as never;
        order[name] = ids;
      }),
    );

    // `session` and `ui` are per-browser concerns, not persisted rows.
    const meta = await db.collection("_appMeta").findOne({ _id: "ui" as never });

    return {
      state: {
        version: 1,
        session: seed.session,
        entities,
        order,
        ui: {
          ...seed.ui,
          ...((meta as { ui?: AppState["ui"] } | null)?.ui ?? {}),
        },
      },
      fromDatabase: true,
    };
  } catch {
    return { state: buildInitialState(), fromDatabase: false };
  }
}

/**
 * Persists the entities that actually changed.
 *
 * The server applies the same reducer the client does, so rather than
 * diffing field by field we compare document identity — the reducer returns
 * new objects only for what it touched, so a `!==` check is both correct and
 * cheap.
 */
export async function persistChanges(
  before: AppState,
  after: AppState,
): Promise<{ written: number; fromDatabase: boolean }> {
  const db = await getDb();
  if (!db) return { written: 0, fromDatabase: false };

  try {
    let written = 0;

    for (const name of COLLECTIONS) {
      const prevDocs = before.entities[name] as Record<string, { _id: string }>;
      const nextDocs = after.entities[name] as Record<string, { _id: string }>;

      const ops: AnyBulkWriteOperation<Document>[] = [];

      for (const [id, doc] of Object.entries(nextDocs)) {
        if (prevDocs[id] !== doc) {
          ops.push({
            replaceOne: {
              filter: { _id: id } as unknown as Document,
              replacement: doc as unknown as Document,
              upsert: true,
            },
          });
        }
      }

      // Anything removed from the store is removed from the collection too.
      for (const id of Object.keys(prevDocs)) {
        if (!nextDocs[id]) {
          ops.push({ deleteOne: { filter: { _id: id } as unknown as Document } });
        }
      }

      if (ops.length > 0) {
        await db.collection(name).bulkWrite(ops, { ordered: false });
        written += ops.length;
      }
    }

    // Favourites, unread counts and the wizard draft live here rather than in
    // a collection of their own — they are UI state, not domain records.
    if (before.ui !== after.ui) {
      await db
        .collection("_appMeta")
        .replaceOne({ _id: "ui" as never }, { _id: "ui", ui: after.ui } as never, {
          upsert: true,
        });
      written += 1;
    }

    return { written, fromDatabase: true };
  } catch {
    return { written: 0, fromDatabase: false };
  }
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
