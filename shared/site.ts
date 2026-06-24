import { z } from 'zod';
import type { InferDocType } from 'ugly-app/shared';

// ─── Visitor counter ──────────────────────────────────────────────────────────
// Single doc (`_id: 'visits'`) holding the real cumulative visit count. Seeded
// with a base so the public counter doesn't read as 0 on a fresh deploy.
export const VISIT_DOC_ID = 'visits';
export const VISIT_SEED = 17010;

export const SiteStatSchema = z.object({
  count: z.number().default(0),
});
export type SiteStat = InferDocType<typeof SiteStatSchema>;

// ─── Site customization (admin-only, applies globally) ────────────────────────
// Single doc (`_id: 'site'`). Empty config == the stock madison.css look, so an
// absent/empty doc is a no-op. Theme is a map of CSS custom-property name → value
// applied to <html>; textOverrides map a stable text id → replacement string.
export const VIEWPORT_BOX_SIZE = z.object({
  w: z.number().nullable().default(null),
  h: z.number().nullable().default(null),
});

export const SiteConfigSchema = z.object({
  theme: z.record(z.string(), z.string()).default({}),
  fonts: z.record(z.string(), z.string()).default({}),
  textOverrides: z.record(z.string(), z.string()).default({}),
  cornerOrder: z.array(z.string()).default([]),
  widgetOrder: z.array(z.string()).default([]),
  boxSizes: z.record(z.string(), VIEWPORT_BOX_SIZE).default({}),
  background: z
    .object({
      types: z.array(z.string()).default([]),
      cycleSeconds: z.number().default(16),
      speed: z.number().default(1),
    })
    .default({ types: [], cycleSeconds: 16, speed: 1 }),
});
export type SiteConfig = InferDocType<typeof SiteConfigSchema>;
// The plain config shape (no DBObject fields) — what the API returns and the
// client works with.
export type SiteConfigData = z.infer<typeof SiteConfigSchema>;
export const SITE_DOC_ID = 'site';
