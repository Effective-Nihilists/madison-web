import { describe, expect, it } from 'vitest';
import { pages } from '../../shared/pages';

describe('Page definitions', () => {
  it('home page exists and is public', () => {
    const home = pages[''];
    expect(home).toBeDefined();
    expect(home.auth).toBe(false);
  });

  it('auth-demo page exists and is public', () => {
    const authDemo = pages['auth-demo'];
    expect(authDemo).toBeDefined();
    expect(authDemo.auth).toBe(false);
  });

  it('authenticated pages require auth', () => {
    const authPages = ['test/todo', 'test/ai', 'test/upload'] as const;
    for (const key of authPages) {
      expect(pages[key].auth, `${key} should require auth`).toBe(true);
    }
  });

  it('admin routes (incl. the redirect entry) exist and require auth', () => {
    // `admin` no longer renders a dashboard — it redirects to admin/articles —
    // but the route must remain so old links keep working, and every admin
    // surface the unified edit bar links to must stay auth-gated.
    const adminPages = [
      'admin',
      'admin/articles',
      'admin/comments',
      'admin/media',
      'admin/wheels',
      'admin/entries/:corner',
    ] as const;
    for (const key of adminPages) {
      expect(pages[key], `${key} should be defined`).toBeDefined();
      expect(pages[key].auth, `${key} should require auth`).toBe(true);
    }
  });
});
