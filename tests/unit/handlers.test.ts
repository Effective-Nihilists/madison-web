import { beforeEach, describe, expect, it } from 'vitest';
import type { TypedDB } from 'ugly-app/shared';
import { makeHandlers } from '../../server/handlers';
import { collections } from '../../shared/collections';
import type { Article, Comment } from '../../shared/collections';

// ── Minimal in-memory fake of the bits of TypedDB the handlers touch ──────────
interface CollectionDefLike {
  name?: string;
}
function makeFakeDb(): TypedDB {
  // store keyed by collection identity → Map<id, doc>
  const store = new Map<CollectionDefLike, Map<string, Record<string, unknown>>>();
  const bucket = (c: CollectionDefLike): Map<string, Record<string, unknown>> => {
    let m = store.get(c);
    if (!m) {
      m = new Map();
      store.set(c, m);
    }
    return m;
  };
  const matches = (doc: Record<string, unknown>, filter: Record<string, unknown>): boolean =>
    Object.entries(filter).every(([k, v]) => doc[k] === v);

  const db = {
    async getDoc(c: CollectionDefLike, id: string) {
      return bucket(c).get(id) ?? null;
    },
    async setDoc(c: CollectionDefLike, doc: Record<string, unknown>) {
      bucket(c).set(doc['_id'] as string, doc);
      return doc;
    },
    async deleteDoc(c: CollectionDefLike, id: string) {
      bucket(c).delete(id);
    },
    async getDocs(c: CollectionDefLike, filter: Record<string, unknown> = {}) {
      return [...bucket(c).values()].filter((d) => matches(d, filter));
    },
  };
  // The handlers only use getDoc/setDoc/deleteDoc/getDocs; cast through unknown.
  return db as unknown as TypedDB;
}

async function seedAdmin(db: TypedDB, userId: string): Promise<void> {
  await db.setDoc(collections.adminUser, {
    _id: userId,
    email: 'admin@example.com',
    version: 1,
    created: Date.now(),
    updated: Date.now(),
  } as never);
}

describe('makeHandlers', () => {
  let db: TypedDB;
  let h: ReturnType<typeof makeHandlers>;
  const ADMIN = 'admin-1';

  beforeEach(async () => {
    db = makeFakeDb();
    // eslint-disable-next-line @typescript-eslint/require-await
    h = makeHandlers(db, async () => 'https://blob/x');
    await seedAdmin(db, ADMIN);
  });

  it('saveArticle → getArticle roundtrips a published article', async () => {
    const { id } = await h.saveArticle(ADMIN, {
      title: 'Hello',
      slug: 'hello',
      corner: 'random',
      excerpt: '',
      bodyMarkdown: '# hi',
      coverImageUrl: null,
      status: 'published',
    });
    expect(id).toBeTruthy();

    const stored = (await db.getDoc<Article>(collections.article, id))!;
    expect(stored.authorId).toBe(ADMIN);
    expect(stored.publishedAt).not.toBeNull();

    const { article } = await h.getArticle(null, { slug: 'hello' });
    expect(article?._id).toBe(id);
    expect(article?.title).toBe('Hello');
  });

  it('getArticle returns null for a draft (unpublished) slug', async () => {
    await h.saveArticle(ADMIN, {
      title: 'Draft',
      slug: 'draft',
      corner: 'random',
      excerpt: '',
      bodyMarkdown: '',
      coverImageUrl: null,
      status: 'draft',
    });
    const { article } = await h.getArticle(null, { slug: 'draft' });
    expect(article).toBeNull();
  });

  it('submitComment creates a pending comment', async () => {
    await h.submitComment(null, { articleId: 'a1', name: 'Jo', body: 'nice' });
    const all = await db.getDocs<Comment>(collections.comment, {});
    expect(all).toHaveLength(1);
    expect(all[0]!.status).toBe('pending');
    // Pending comments are not returned by the public approved-comments read.
    const { comments } = await h.listApprovedComments(null, { articleId: 'a1' });
    expect(comments).toHaveLength(0);
  });

  it('admin-only handler throws for a non-admin userId', async () => {
    await expect(h.adminListArticles('not-admin', {})).rejects.toThrow('forbidden');
  });

  it('whoAmI reports admin status', async () => {
    expect((await h.whoAmI(ADMIN, {})).admin).toBe(true);
    expect((await h.whoAmI('nope', {})).admin).toBe(false);
  });
});
