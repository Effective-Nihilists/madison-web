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
  const db = getAppContext().typedDb;
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
const cronHandlers: WorkerHandlers<typeof cronTasks> = {
  // eslint-disable-next-line @typescript-eslint/require-await
  dailyCleanup: async () => {
    // Implement in your Worker: e.g. prune old rows via Hyperdrive or D1.
  },
};

// ── Token-free email via the Cloudflare Email Service `send_email` binding ──
// The framework's `emailSend` only knows the REST API (needs a CF API token)
// or the retired ugly.bot proxy. To send WITHOUT any token, we expose a tiny
// route that calls the native `env.EMAIL` binding (auth is implicit at the
// Worker runtime — no bearer needed for Cloudflare), and point the framework's
// EMAIL_PROXY_URL at it. So: magic-link → emailSend → POST /_email/send →
// env.EMAIL.send(). A shared EMAIL_PROXY_TOKEN guards the route from outside.
interface EmailSendBinding {
  send(msg: {
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<unknown>;
}
interface RawEmailCtx {
  req: { header(name: string): string | undefined; json(): Promise<unknown> };
  env: { EMAIL?: EmailSendBinding; EMAIL_PROXY_TOKEN?: string; EMAIL_FROM?: string };
  json(body: unknown, status?: number): Response;
}
interface RawRouteApp {
  post(path: string, handler: (c: RawEmailCtx) => Promise<Response>): void;
}

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

    // Token-free email route — calls the `env.EMAIL` send_email binding.
    (cfg as unknown as {
      setRawRoutes: (register: (rawApp: RawRouteApp) => void) => void;
    }).setRawRoutes((rawApp) => {
      rawApp.post('/_email/send', async (c) => {
        const expected = c.env.EMAIL_PROXY_TOKEN;
        if (!expected || c.req.header('authorization') !== `Bearer ${expected}`) {
          return c.json({ error: 'unauthorized' }, 401);
        }
        const binding = c.env.EMAIL;
        if (!binding) return c.json({ error: 'EMAIL binding not configured' }, 500);
        const body = (await c.req.json().catch(() => ({}))) as {
          to?: string;
          subject?: string;
          html?: string;
          text?: string;
        };
        if (!body.to || !body.subject) {
          return c.json({ error: 'missing to/subject' }, 400);
        }
        const msg: { from: string; to: string; subject: string; html?: string; text?: string } = {
          from: c.env.EMAIL_FROM ?? 'noreply@317010.xyz',
          to: body.to,
          subject: body.subject,
        };
        if (body.html !== undefined) msg.html = body.html;
        if (body.text !== undefined) msg.text = body.text;
        try {
          await binding.send(msg);
          return c.json({ ok: true });
        } catch (err) {
          return c.json({ error: String((err as Error).message ?? err) }, 502);
        }
      });
    });
  },
);

export default app;
export { CollectionDO, SessionDO };
