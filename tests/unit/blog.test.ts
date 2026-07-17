import { describe, expect, it } from 'vitest';
import { ArticleSchema, CommentSchema, CORNERS } from '../../shared/blog';

describe('blog schemas', () => {
  it('CORNERS has 15 entries', () => {
    expect(CORNERS).toHaveLength(15);
  });

  it('ArticleSchema rejects an empty title', () => {
    const result = ArticleSchema.safeParse({
      slug: 'hello',
      title: '',
      corner: 'random',
      authorId: 'u1',
    });
    expect(result.success).toBe(false);
  });

  it('ArticleSchema accepts a valid corner + applies defaults', () => {
    const result = ArticleSchema.safeParse({
      slug: 'hello',
      title: 'Hello World',
      corner: 'witchcraft',
      authorId: 'u1',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
      expect(result.data.excerpt).toBe('');
      expect(result.data.coverImageUrl).toBeNull();
      expect(result.data.publishedAt).toBeNull();
    }
  });

  it('ArticleSchema rejects an unknown corner', () => {
    const result = ArticleSchema.safeParse({
      slug: 'hello',
      title: 'Hello',
      corner: 'not-a-corner',
      authorId: 'u1',
    });
    expect(result.success).toBe(false);
  });

  it('CommentSchema defaults status to pending', () => {
    const result = CommentSchema.safeParse({
      articleId: 'a1',
      name: 'Jo',
      body: 'Nice post',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('pending');
  });
});
