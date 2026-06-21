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
  const db = getAppContext().typedDb;
  if (!db) throw new Error('TypedDB not initialized');
  return db;
}

// Request handlers run inside the Worker for `fetch` requests. These are the
// SAME blog/CMS handlers wired into `server/index.ts` (the two-entry footgun:
// a handler missing here ships a Worker that returns `[Router] not registered`).
const requestHandlers: Partial<RequestHandlers<typeof requests>> = makeHandlers(workersDb);

// Cron handlers run on Cloudflare Cron Triggers (matches the schedule
// declared in `shared/cron.ts`).
const cronHandlers: WorkerHandlers<typeof cronTasks> = {
  // eslint-disable-next-line @typescript-eslint/require-await
  dailyCleanup: async () => {
    // Implement in your Worker: e.g. prune old rows via Hyperdrive or D1.
  },
};

const app = createWorkersApp(
  { requests, messages },
  requestHandlers,
  collections,
  (cfg) => {
    cfg.setWorkers(cronTasks, cronHandlers);
    // Self-hosted magic-link: seed the admin allowlist on first login.
    cfg.setOnUserCreate(async (userId, initial, db) => {
      await seedAdminOnCreate(db, userId, initial.email);
    });
  },
);

export default app;
export { CollectionDO, SessionDO };
