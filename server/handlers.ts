import { nanoid } from 'nanoid';
import type { TypedDB } from 'ugly-app/shared';
import { dbDefaults } from 'ugly-app/shared';
import type { RequestHandlers } from 'ugly-app';
import type { requests } from '../shared/api';
import { collections } from '../shared/collections';
import type {
  Article,
  Comment,
  RandomThought,
  MediaAsset,
  MusicTrack,
  ButtonImage,
  Entry,
} from '../shared/collections';
import { isAdmin } from './admin';

// The blog/CMS subset of request names this module implements. The other
// requests (todo/test) stay in server/index.ts.
type BlogRequestKey =
  | 'listArticles'
  | 'getArticle'
  | 'listRandomThoughts'
  | 'listApprovedComments'
  | 'submitComment'
  | 'listMusicTracks'
  | 'listButtonImages'
  | 'whoAmI'
  | 'adminListArticles'
  | 'adminGetArticle'
  | 'saveArticle'
  | 'deleteArticle'
  | 'createRandomThought'
  | 'deleteRandomThought'
  | 'adminListComments'
  | 'moderateComment'
  | 'uploadMedia'
  | 'addMusicTrack'
  | 'deleteMusicTrack'
  | 'setButtonImage'
  | 'listEntries'
  | 'saveEntry'
  | 'deleteEntry'
  | 'adminListEntries';

export type BlogHandlers = Pick<RequestHandlers<typeof requests>, BlogRequestKey>;

async function requireAdmin(db: TypedDB, userId: string): Promise<void> {
  if (!(await isAdmin(db, userId))) throw new Error('forbidden');
}

// Decode a (possibly data-URL-prefixed) base64 payload into a Buffer.
function decodeBase64(dataBase64: string): Buffer {
  const comma = dataBase64.indexOf(',');
  const raw = dataBase64.startsWith('data:') && comma >= 0 ? dataBase64.slice(comma + 1) : dataBase64;
  return Buffer.from(raw, 'base64');
}

/**
 * Storage `put` injected per-entry so this shared module stays
 * Workers-safe. `server/index.ts` (Node) passes the S3-backed
 * `createStorageClient().put`; `server/workers.ts` passes the
 * Workers adapter's R2-backed `getAdapter().storage.put`. Mirrors the
 * framework's `StorageAdapter.put` signature.
 */
type StoragePut = (
  bucket: 'public' | 'temp',
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
) => Promise<string>;

const CONTENT_TYPE: Record<MediaAsset['kind'], string> = {
  image: 'image/png',
  audio: 'audio/wav',
  video: 'video/mp4',
};

/**
 * The single source of truth for blog/CMS request handlers, imported by BOTH
 * `server/index.ts` (dev) and `server/workers.ts` (prod). Keeping them here
 * avoids the two-entry footgun where a handler is registered in only one entry.
 *
 * `db` may be a `TypedDB` or a getter returning one. Both entries call
 * `createApp`/`createWorkersApp` with handlers BEFORE `app.db` exists, so the
 * getter form lets callers defer resolving `app.db` until a request runs.
 */
export function makeHandlers(
  dbOrGetter: TypedDB | (() => TypedDB),
  storagePut: StoragePut,
): BlogHandlers {
  const db: TypedDB =
    typeof dbOrGetter === 'function'
      ? new Proxy({} as TypedDB, {
          get: (_t, prop) => {
            const real = (dbOrGetter as () => TypedDB)();
            const value = real[prop as keyof TypedDB];
            return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(real) : value;
          },
        })
      : dbOrGetter;
  return {
    // ── Public reads ────────────────────────────────────────────────────────
    listArticles: async (_userId, { corner }) => {
      const filter: Record<string, unknown> = { status: 'published' };
      if (corner) filter['corner'] = corner;
      const articles = await db.getDocs<Article>(collections.article, filter, {
        sort: { publishedAt: -1 },
      });
      return { articles };
    },

    getArticle: async (_userId, { slug }) => {
      const matches = await db.getDocs<Article>(collections.article, { slug, status: 'published' }, {
        limit: 1,
      });
      return { article: matches[0] ?? null };
    },

    listRandomThoughts: async (_userId, { limit }) => {
      const thoughts = await db.getDocs<RandomThought>(collections.randomThought, {}, {
        sort: { created: -1 },
        limit: limit ?? 20,
      });
      return { thoughts };
    },

    listApprovedComments: async (_userId, { articleId }) => {
      const comments = await db.getDocs<Comment>(collections.comment, {
        articleId,
        status: 'approved',
      }, { sort: { created: 1 } });
      return { comments };
    },

    submitComment: async (_userId, { articleId, name, body }) => {
      const doc: Comment = {
        _id: nanoid(),
        articleId,
        name,
        body,
        status: 'pending',
        ...dbDefaults(),
      };
      await db.setDoc(collections.comment, doc);
      return { ok: true };
    },

    listMusicTracks: async () => {
      const tracks = await db.getDocs<MusicTrack>(collections.musicTrack, {}, {
        sort: { order: 1 },
      });
      return { tracks };
    },

    listButtonImages: async () => {
      const images = await db.getDocs<ButtonImage>(collections.buttonImage, {});
      return { images };
    },

    // ── Admin ─────────────────────────────────────────────────────────────────
    whoAmI: async (userId) => ({ admin: await isAdmin(db, userId) }),

    adminListArticles: async (userId) => {
      await requireAdmin(db, userId);
      const articles = await db.getDocs<Article>(collections.article, {}, {
        sort: { updated: -1 },
      });
      return { articles };
    },

    adminGetArticle: async (userId, { id }) => {
      await requireAdmin(db, userId);
      const article = await db.getDoc<Article>(collections.article, id);
      return { article: article ?? null };
    },

    saveArticle: async (userId, input) => {
      await requireAdmin(db, userId);
      const { id, status, ...rest } = input;
      const existing = id ? await db.getDoc<Article>(collections.article, id) : null;
      const _id = existing?._id ?? id ?? nanoid();

      // Stamp publishedAt the first time an article transitions to published.
      const wasPublished = existing?.status === 'published';
      const publishedAt =
        status === 'published'
          ? (existing?.publishedAt ?? Date.now())
          : (wasPublished ? existing?.publishedAt ?? null : null);

      const doc: Article = {
        _id,
        ...rest,
        status,
        authorId: existing?.authorId ?? userId,
        publishedAt,
        ...dbDefaults(),
      };
      await db.setDoc(collections.article, doc);
      return { id: _id };
    },

    deleteArticle: async (userId, { id }) => {
      await requireAdmin(db, userId);
      await db.deleteDoc(collections.article, id);
      return { ok: true };
    },

    createRandomThought: async (userId, { body }) => {
      await requireAdmin(db, userId);
      const doc: RandomThought = { _id: nanoid(), body, authorId: userId, ...dbDefaults() };
      await db.setDoc(collections.randomThought, doc);
      return { id: doc._id };
    },

    deleteRandomThought: async (userId, { id }) => {
      await requireAdmin(db, userId);
      await db.deleteDoc(collections.randomThought, id);
      return { ok: true };
    },

    adminListComments: async (userId, { status }) => {
      await requireAdmin(db, userId);
      const filter = status ? { status } : {};
      const comments = await db.getDocs<Comment>(collections.comment, filter, {
        sort: { created: -1 },
      });
      return { comments };
    },

    moderateComment: async (userId, { id, action }) => {
      await requireAdmin(db, userId);
      const comment = await db.getDoc<Comment>(collections.comment, id);
      if (!comment) throw new Error('Comment not found');
      const updated: Comment = {
        ...comment,
        status: action === 'approve' ? 'approved' : 'rejected',
        ...dbDefaults(),
      };
      await db.setDoc(collections.comment, updated);
      return { ok: true };
    },

    uploadMedia: async (userId, { kind, name, dataBase64 }) => {
      await requireAdmin(db, userId);
      const body = decodeBase64(dataBase64);
      const key = `media/${Date.now()}-${nanoid(8)}-${name}`;
      const url = await storagePut('public', key, body, CONTENT_TYPE[kind]);
      const asset: MediaAsset = { _id: nanoid(), url, kind, name, ownerId: userId, ...dbDefaults() };
      await db.setDoc(collections.mediaAsset, asset);
      return { url };
    },

    addMusicTrack: async (userId, { title, url, kind }) => {
      await requireAdmin(db, userId);
      const existing = await db.getDocs<MusicTrack>(collections.musicTrack, {});
      const order = existing.length;
      const doc: MusicTrack = { _id: nanoid(), title, url, kind, order, ...dbDefaults() };
      await db.setDoc(collections.musicTrack, doc);
      return { id: doc._id };
    },

    deleteMusicTrack: async (userId, { id }) => {
      await requireAdmin(db, userId);
      await db.deleteDoc(collections.musicTrack, id);
      return { ok: true };
    },

    setButtonImage: async (userId, { key, url }) => {
      await requireAdmin(db, userId);
      const doc: ButtonImage = { _id: key, key, url, ...dbDefaults() };
      await db.setDoc(collections.buttonImage, doc);
      return { ok: true };
    },

    // ── Phase 2: generic entry/gallery system ─────────────────────────────────
    listEntries: async (_userId, { corner, q }) => {
      const entries = await db.getDocs<Entry>(collections.entry, { corner }, {
        sort: { order: 1, created: -1 },
      });
      if (!q || !q.trim()) return { entries };
      const needle = q.trim().toLowerCase();
      const filtered = entries.filter((e) => {
        const hay = [e.title, e.body, ...(e.tags ?? [])].join(' ').toLowerCase();
        return hay.includes(needle);
      });
      return { entries: filtered };
    },

    saveEntry: async (userId, input) => {
      await requireAdmin(db, userId);
      const { id, corner, title, ...rest } = input;
      const existing = id ? await db.getDoc<Entry>(collections.entry, id) : null;
      const _id = existing?._id ?? id ?? nanoid();
      const doc: Entry = {
        _id,
        corner,
        title,
        imageUrl: rest.imageUrl ?? existing?.imageUrl ?? null,
        body: rest.body ?? existing?.body ?? '',
        tags: rest.tags ?? existing?.tags ?? [],
        rating: rest.rating ?? existing?.rating ?? null,
        status: rest.status ?? existing?.status ?? '',
        link: rest.link ?? existing?.link ?? '',
        funFact: rest.funFact ?? existing?.funFact ?? '',
        order: rest.order ?? existing?.order ?? 0,
        authorId: existing?.authorId ?? userId,
        ...dbDefaults(),
      };
      await db.setDoc(collections.entry, doc);
      return { id: _id };
    },

    deleteEntry: async (userId, { id }) => {
      await requireAdmin(db, userId);
      await db.deleteDoc(collections.entry, id);
      return { ok: true };
    },

    adminListEntries: async (userId, { corner }) => {
      await requireAdmin(db, userId);
      const entries = await db.getDocs<Entry>(collections.entry, { corner }, {
        sort: { order: 1, created: -1 },
      });
      return { entries };
    },
  };
}
