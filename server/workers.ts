/**
 * Cloudflare Workers entry — built by `npm run build:workers` and
 * uploaded by Studio's `workers-deploy` step.
 *
 * The Worker exposes:
 *   - `fetch`     — Hono router for HTTP + WS upgrades
 *   - `scheduled` — Cloudflare Cron Triggers → cron handlers
 *   - `queue`     — Cloudflare Queues → worker handlers
 *   - `CollectionDO` / `SessionDO` — Durable Object classes referenced
 *     by `wrangler.toml`'s `[[durable_objects.bindings]]`
 *
 * The handlers below mirror `server/index.ts`. If you only deploy to
 * Workers, you can delete `server/index.ts` and the framework will
 * route everything through this entry point.
 */

import {
  CollectionDO,
  SessionDO,
  createWorkersApp,
  getAdapter,
  getAppContext,
} from 'ugly-app/server/adapter/workers';
import type { RequestHandlers } from 'ugly-app';
import type { TypedDB, WorkerHandlers } from 'ugly-app/shared';

import { messages, requests } from '../shared/api';
import { collections } from '../shared/collections';
import { cronTasks } from '../shared/cron';
import { makeHandlers } from './handlers';
import { seedAdminOnCreate } from './admin';

// The Workers runtime keeps the TypedDB inside the app context rather than on
// the returned app object; resolve it lazily per request.
function workersDb(): TypedDB {
  // The framework hands back a `TypedDB<any>`; narrow it to the concrete
  // default `TypedDB` at this boundary so downstream handlers stay type-safe.
  const db = getAppContext().typedDb as TypedDB | null;
  if (!db) throw new Error('TypedDB not initialized');
  return db;
}

// Workers-safe storage: the R2-backed adapter installed by createWorkersApp.
// Resolved lazily (per request) because the adapter is null at module-eval
// time — `setAdapter()` runs inside the Worker's `fetch` handler. We import
// `getAdapter` from the Workers adapter barrel, NOT `ugly-app/server` (the
// Node barrel that drags in pg/nats/fs and breaks the worker bundle).
const workersStoragePut = (
  bucket: 'public' | 'temp',
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> => getAdapter().storage.put(bucket, key, body, contentType);

// Request handlers run inside the Worker for `fetch` requests. These are the
// SAME blog/CMS handlers wired into `server/index.ts` (the two-entry footgun:
// a handler missing here ships a Worker that returns `[Router] not registered`).
const requestHandlers: Partial<RequestHandlers<typeof requests>> = makeHandlers(
  workersDb,
  workersStoragePut,
);

// Cron handlers run on Cloudflare Cron Triggers (matches the schedule
// declared in `shared/cron.ts`).
// No cron workers after the D1-only migration (dailyCleanup removed).
const cronHandlers: WorkerHandlers<typeof cronTasks> = {};

const app = createWorkersApp(
  { requests, messages },
  requestHandlers,
  collections,
  (cfg) => {
    cfg.setWorkers(cronTasks, cronHandlers);
    // Self-hosted magic-link: seed the admin allowlist on first login.
    cfg.setOnUserCreate(async (userId, initial, db: TypedDB) => {
      await seedAdminOnCreate(db, userId, initial.email);
    });
    // Transactional email (magic-link) sends via the Cloudflare Email Service
    // `env.EMAIL` binding — wired automatically by ugly-app ≥0.1.660. No token.
  },
);

export default app;
export { CollectionDO, SessionDO };
