# Ghorly — data schema

Written while the shapes were fresh, so the backend work has a starting point
rather than an archaeology exercise.

The fifteen buckets in `AppState.entities` map one-to-one onto fifteen MongoDB
collections. The TypeScript interfaces in `lib/types.ts` **are** the document
shapes — nothing needs translating.

## Conventions

| Rule | Why |
|---|---|
| `_id` is a readable string (`prv-0007`, `bkg-0042`) | Mongo accepts a custom string `_id`, so these migrate verbatim. They stay legible in the UI and in Compass, and they're deterministic, so they don't reintroduce the hydration bugs a random id would. |
| Every document has `createdAt` / `updatedAt` | Naive-local `YYYY-MM-DDTHH:mm` strings anchored to `lib/data/clock.ts`. Convert to `Date` at the driver boundary if you want real date types — the UI never parses them with `new Date()`. |
| Relations are id references, never embedded documents | The normalized store already enforces this, so it maps directly onto referenced Mongo documents. |
| No field starts with `$` or contains `.` | Both are illegal in Mongo field names. |
| Money is a whole number of BDT | No floats, no currency objects. Commission is stored alongside the amount rather than recomputed. |

## The flow: admin-dispatched

Ghorly is not an open marketplace. Three parties, with the Ghorly team in the
middle of every job:

1. **Customer** submits a request (`SUBMIT_REQUEST`) → request `open` = waiting for the team.
2. **Admin** phones suitable professionals offline and agrees a price, then sends
   the customer a quotation naming one of them (`SEND_QUOTATION`): customer price
   `amount` and the professional's `providerPayout`. Request → `quoted`. A new
   quotation withdraws the previous one.
3. **Customer** accepts (`ACCEPT_QUOTE`) → booking with that professional; the
   assignment is final, commission = `amount − providerPayout`. Or declines
   (`DECLINE_QUOTE`) → request back to `open` for the team.
4. **Provider** sees the job in their jobs list and does it (`START_JOB`, `COMPLETE_JOB`).

Customers and providers never contact each other. Every `threads` document is a
support conversation between the team and **one** party (`kind: "customer" |
"provider"`); `messages.senderRole` includes `admin`. Customers see a
professional's name, photo and rating, never a phone number; providers see the
job address, never the customer's phone.

## Collections

| Collection | Key fields | References |
|---|---|---|
| `categories` | `slug`, `bnName`, `icon`, `priceFrom`/`priceTo`, `isActive` | — |
| `areas` | `slug`, `bnName`, `providerCount`, `mapX`/`mapY`, `isActive` | — |
| `providers` | `slug`, `bnName`, `rating`, `reviewCount`, `completedJobs`, `isVerified`, `status`, `availability` | `areaId`, `categoryIds[]`, `serviceAreaIds[]` |
| `customers` | `bnName`, `phone`, `email`, `status`, `bookingCount` | `areaId`, `addressIds[]` |
| `addresses` | `bnLabel`, `bnLine1`, `bnLine2`, `isDefault` | `customerId`, `areaId` |
| `requests` | `bnTitle`, `bnDescription`, `status`, `urgency`, `preferredDate`, `preferredSlot` | `customerId`, `categoryId`, `areaId`, `addressId`, `quoteIds[]`, `bookingId` |
| `quotes` | `amount`, `providerPayout`, `bnMessage` (admin's note), `estimatedMinutes`, `status`, `validUntil` | `requestId`, `providerId`, `customerId` |
| `bookings` | `bnTitle`, `scheduledDate`, `scheduledSlot`, `amount`, `commission`, `status` | `requestId`, `quoteId`, `customerId`, `providerId`, `categoryId`, `addressId`, `paymentId`, `reviewId` |
| `payments` | `amount`, `commission`, `method`, `status`, `reference`, `paidAt` | `bookingId`, `customerId`, `providerId` |
| `payoutMethods` | `kind`, `bnLabel`, `reference`, `isDefault` | `ownerId` |
| `threads` | `kind`, `bnSubject`, `lastMessageAt`, `messageIds[]` | `customerId` *or* `providerId` (one, by `kind`), `bookingId`, `requestId` |
| `messages` | `senderRole`, `bnBody`, `sentAt`, `isRead` | `threadId`, `senderId` |
| `reviews` | `rating`, `bnBody`, `isHidden`, `bnProviderReply` | `bookingId`, `providerId`, `customerId`, `categoryId` |
| `verifications` | `status`, `docs[]`, `submittedAt`, `reviewedAt`, `bnNote` | `providerId` |
| `disputes` | `bnReason`, `bnDetail`, `status`, `bnResolution` | `bookingId`, `raisedById` |

## Indexes worth creating on day one

These follow directly from the filters in `lib/api/queries.ts`:

```
providers:  { areaId: 1 }, { categoryIds: 1 }, { serviceAreaIds: 1 },
            { isVerified: 1, rating: -1 }, { slug: 1 } unique
requests:   { status: 1, categoryId: 1, areaId: 1 }, { customerId: 1, createdAt: -1 }
quotes:     { requestId: 1 }, { providerId: 1, createdAt: -1 }, { customerId: 1, createdAt: -1 }
bookings:   { customerId: 1, scheduledDate: -1 }, { providerId: 1, scheduledDate: -1 }, { status: 1 }
payments:   { providerId: 1, status: 1 }, { customerId: 1, createdAt: -1 }, { bookingId: 1 }
messages:   { threadId: 1, sentAt: 1 }
threads:    { customerId: 1, lastMessageAt: -1 }, { providerId: 1, lastMessageAt: -1 }
reviews:    { providerId: 1, isHidden: 1, createdAt: -1 }
categories: { slug: 1 } unique      areas: { slug: 1 } unique
```

## Derived fields

`providers.rating`, `providers.reviewCount` and `providers.completedJobs` are
denormalized counters kept in step by the reducer (`SUBMIT_REVIEW` and
`COMPLETE_JOB`). In Mongo they should be updated in the same transaction as the
review or booking write, or recomputed by an aggregation — not left to drift.

## Status: connected

MongoDB is wired up. `lib/db/repository.ts` loads the whole entity graph into
the `AppState` shape the app already speaks, and writes changed documents back.

| Piece | File |
|---|---|
| Connection (local + Atlas, never throws) | `lib/db/client.ts` |
| Collection list + index definitions | `lib/db/collections.ts` |
| Load / persist / direct reads | `lib/db/repository.ts` |
| Full snapshot | `GET /api/bootstrap` |
| Apply one action | `POST /api/mutate` |
| Seed + indexes | `scripts/seed-mongo.ts` |

### Why one snapshot rather than per-resource endpoints

`GET /api/bootstrap` returns everything — about 650 documents, a few
milliseconds. That is what let all forty selector hooks in `queries.ts` keep
working unchanged against a single state object, which is why this migration
touched no component. Once the data outgrows a single snapshot, split it:
per-resource endpoints with query params and pagination, each hook fetching its
own key. The `QueryResult` envelope already accommodates that — it is the
reason the envelope exists.

### Why the reducer runs on the server

`POST /api/mutate` loads the graph, runs **the same `lib/store/reducer.ts` the
browser runs**, and persists only the documents whose identity changed.
Accepting a quotation has to create a booking and a pending payment, flip the
request to `booked` and tell the provider in their support thread; those
cascades are written down once.
Re-expressing them as Mongo update pipelines would be the same logic twice,
which is the same logic drifting apart.

### Offline behaviour

`getDb()` returns `null` rather than throwing when the database is unreachable,
and every caller falls back to the in-memory seed. The app renders in
ডেমো মোড — fully usable, nothing persisted — so the prototype still demos on a
laptop with no database. Measured: 1.5s on the first miss, ~11ms after, because
of the retry cooldown.

### Commands

```
npm run db:ping       connection check + document counts (credentials redacted)
npm run db:seed       drop, reseed all 15 collections, recreate 29 indexes
npm run db:verify     posts a real mutation and re-reads Mongo to confirm it landed
npm run db:inspect    spot-check UI meta and key counts
npm run db:fallback   exercise the no-database path
```

Connection string lives in `.env.local` (gitignored). The `db:*` scripts read it
via `--env-file-if-exists` because they run outside Next.

## Auth and hardening

Two more collections exist that are not part of the entity graph above. They are
never returned by `/api/bootstrap` and never enter `AppState`.

| Collection | `_id` | Purpose |
|---|---|---|
| `accounts` | `acc-0001` | phone → `{ customerId, providerId, isAdmin }`. Unique index on `phone`. |
| `otpChallenges` | `otp-<random>` | one live code per phone. TTL index on `expiresAt`, so expired rows delete themselves. |

An account maps one phone number to up to three roles. `findOrCreateAccount`
creates customer-only accounts; becoming a provider or admin is a deliberate
grant, never a side effect of signing in.

### Sign-in: phone + one-time code

`POST /api/auth/request-otp` → `POST /api/auth/verify-otp` → session cookie.

Codes are **never stored in plaintext**. Each challenge carries its own salt,
the stored value is `sha256(salt:code)`, the comparison is `timingSafeEqual`,
and a code is single-use — burned on the first success so a replay cannot sign
in twice. Codes come from `randomInt` (CSPRNG), not `Math.random`. Five wrong
attempts destroy the challenge; resends are floored at 60 seconds.

`request-otp` deliberately does **not** reveal whether the number has an
account. Doing so would make it a user-enumeration oracle — a way to test which
phone numbers are Ghorly customers.

### Sessions

`lib/auth/session.ts` — a jose JWT in an httpOnly, sameSite=lax, secure cookie
(`ghorly_session`). `AUTH_SECRET` signs it, and the module **throws at boot in
production if it is unset**: a deployment signing sessions with a default key
has no sessions at all. Rotating `AUTH_SECRET` signs everyone out, which is the
intended emergency lever.

### Authorization

`lib/auth/policy.ts` — `authorize(session, action, state)`, **default deny**.
The critical property: ownership is looked up **in the loaded state**, never
taken from the request. A request claiming `customerId: "cus-0001"` proves
nothing; the booking's actual `customerId` decides.

`lib/db/scope.ts` then filters what each session may *read*:

| Session | Sees |
|---|---|
| signed out | catalogue only — categories, areas, providers (phones redacted), reviews |
| customer | own requests, quotations (no `providerPayout`), bookings and payments (no commission split), own support thread; providers' public profiles |
| provider | own jobs and the requests behind them, payouts (`amount` = payout, no commission), own support thread, verification; customer names and job addresses — no open-request feed, no quotations |
| admin | everything |

This is why a guest `/api/bootstrap` returns 28 providers and 0 bookings.

### The five gates on `POST /api/mutate`

```
rate limit → authenticate → zod validate → authorize → reducer → persist
```

`lib/api/validation.ts` is a zod discriminated union over all ~45 actions, so a
malformed or unknown action never reaches the reducer. `lib/api/respond.ts`
makes *not-found* and *forbidden* externally identical — otherwise the error
code itself leaks which ids exist.

### SMS (BulkSMSBD)

`lib/auth/sms/` — `bulksmsbd.ts` (pure factory, credentials passed in),
`message.ts` (pure, the Bangla template), `index.ts` (reads env, `server-only`).

**The template is fixed by BulkSMSBD**, not chosen by us:

```
Your {Brand/Company Name} OTP is XXXX
```

So the SMS is English even though every other surface in the product is Bangla.
Do not "fix" it to match the UI — it is an operator requirement, and these
templates are approved as an exact string. Nothing is appended: no expiry line,
no footer. The five-minute expiry is communicated in the UI instead, in Bangla.

Two consequences:

- **Sender ID must be non-masking.** BulkSMSBD rejects *masking* sender IDs
  carrying non-Bengali text with response code 1012. An English template only
  works on a numeric / dedicated OTP route. If live sends start failing with
  1012, the sender ID and the template disagree — change the sender ID, not the
  wording.
- **Cheaper, in our favour.** English is GSM-7, 160 characters per segment,
  versus 70 for a Bengali UCS-2 message. The template is ~25 characters, so one
  code is one charge. `npm run sms:check` prints the segment count, so a reword
  that doubles the bill is visible before it ships.

Gateway errors are split in two. `SmsResult.message` is operator detail for
logs and support tickets; `SmsResult.userMessage` is what the login form may
render. Almost every failure in the code table is *our* misconfiguration —
inactive sender ID, expired balance, no gateway for this key — which a person
signing in can neither act on nor should learn about, so those collapse to one
generic Bangla message. Only `1001` (malformed number) is passed through.

Their API answers **HTTP 200 for everything**, success and failure alike, with
the real outcome in `response_code`. So the status code is ignored and all 21
documented codes are mapped, each flagged `retryable` only where a retry could
plausibly succeed. `api_key` is sent in the POST body, never the query string,
so it cannot leak through access logs, proxies or `Referer` headers.

If a send fails the challenge is deleted immediately, so the user can request
another code at once instead of waiting out the 60-second floor on a code that
never arrived.

**Development mode.** With no gateway configured, `request-otp` returns the code
in its own response so the flow is demonstrable. That means anyone could sign in
as anyone, so `assertSmsConfigured()` throws on the request path in production.
It is called inside `requestOtp` itself, not only in the route, so no caller can
bypass it.

That check is deliberately **not** at module scope. `next build` runs with
`NODE_ENV=production` and evaluates the module while collecting page data — a
module-level throw would make the build require SMS credentials, which are
runtime secrets a build machine should never hold. It also breaks containers
that inject env at start rather than image build.

### Transport

`next.config.ts` sets CSP (no `unsafe-eval` in production), HSTS with preload,
`X-Frame-Options: DENY`, `nosniff`, a referrer policy and `poweredByHeader:
false`. `proxy.ts` does redirects only and is documented as **not** a security
control — it runs before React and cannot be the thing that enforces access.

### Commands

```
npm run sms:check              config + balance, sends nothing
npm run sms:check 01XXXXXXXXX  sends one real message (costs money)
```

### Environment

| Variable | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | production | throws at boot if missing |
| `MONGODB_URI` | no | falls back to in-memory seed (ডেমো মোড) |
| `MONGODB_DB` | no | defaults to `ghorly` |
| `BULKSMSBD_API_KEY` | production | throws on the OTP request path if missing |
| `BULKSMSBD_SENDER_ID` | production | must be approved by BulkSMSBD |

`.env.example` is a template — **nothing loads it**. Real values go in
`.env.local`, which is gitignored.
