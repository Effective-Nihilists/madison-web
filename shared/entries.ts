import { z } from 'zod';
import type { InferDocType } from 'ugly-app/shared';
import { CORNER_KEYS } from './blog';

// ─── Entry schema ─────────────────────────────────────────────────────────────
// A single generic "entry" used by the 8 gallery/list/card corners (books,
// movies, recipes, restaurants, travel, vision, memes, animals). Every field is
// optional per-corner; CORNER_CONFIG below decides which fields each corner
// surfaces and how it renders them.
export const EntrySchema = z.object({
  corner: z.enum(CORNER_KEYS),
  title: z.string().min(1),
  imageUrl: z.string().nullable().default(null),
  body: z.string().default(''),
  tags: z.array(z.string()).default([]),
  rating: z.number().min(0).max(5).nullable().default(null),
  status: z.string().default(''),
  link: z.string().default(''),
  funFact: z.string().default(''),
  authorId: z.string(),
  order: z.number().default(0),
});
export type Entry = InferDocType<typeof EntrySchema>;

// ─── Per-corner configuration ─────────────────────────────────────────────────
// `layout`  – how GalleryPage renders the entries:
//               'gallery' = image-forward grid
//               'cards'   = framed cards with title/body/meta
//               'list'    = stacked rows with markdown body
// `search`  – show a search box (filters on title/tags/body)
// `fields`  – which editable fields the admin EntryManager exposes
// `addLabel`/`emptyText` – UI copy
export type EntryLayout = 'gallery' | 'cards' | 'list';

export interface CornerConfig {
  layout: EntryLayout;
  search: boolean;
  fields: string[];
  addLabel: string;
  emptyText: string;
}

// The set of editable fields a corner may declare. (Kept as plain strings so
// EntryManager can branch on them without a hard type dependency.)
export type EntryField =
  | 'title'
  | 'image'
  | 'body'
  | 'tags'
  | 'rating'
  | 'status'
  | 'link'
  | 'funFact';

// Status option sets per corner that uses `status` as an enum-ish field.
export const STATUS_OPTIONS: Record<string, string[]> = {
  books: ['want', 'reading', 'done'],
  travel: ['been', 'wishlist'],
};

export const CORNER_CONFIG: Record<string, CornerConfig> = {
  books: {
    layout: 'cards',
    search: false,
    fields: ['title', 'image', 'body', 'rating', 'status', 'link'],
    addLabel: 'add book',
    emptyText: 'no books on the shelf yet.',
  },
  movies: {
    layout: 'cards',
    search: false,
    fields: ['title', 'image', 'body', 'rating', 'link'],
    addLabel: 'add movie',
    emptyText: 'no movies recommended yet.',
  },
  recipes: {
    layout: 'list',
    search: true,
    fields: ['title', 'image', 'body', 'tags', 'link'],
    addLabel: 'add recipe',
    emptyText: 'no recipes cooked up yet.',
  },
  restaurants: {
    layout: 'cards',
    search: false,
    fields: ['title', 'image', 'body', 'rating', 'link'],
    addLabel: 'add restaurant',
    emptyText: 'no restaurants reviewed yet.',
  },
  travel: {
    layout: 'cards',
    search: false,
    fields: ['title', 'image', 'body', 'status', 'link'],
    addLabel: 'add destination',
    emptyText: 'no destinations pinned yet.',
  },
  vision: {
    layout: 'gallery',
    search: false,
    fields: ['title', 'image', 'body', 'link'],
    addLabel: 'add vision',
    emptyText: 'the vision board is empty — add an image.',
  },
  memes: {
    layout: 'gallery',
    search: true,
    fields: ['title', 'image', 'tags'],
    addLabel: 'add meme',
    emptyText: 'no memes yet — the gallery awaits.',
  },
  animals: {
    layout: 'gallery',
    search: false,
    fields: ['title', 'image', 'funFact'],
    addLabel: 'add animal',
    emptyText: 'no critters yet — Cosmoo & the kitties are shy.',
  },
};

// Corner keys handled by the generic entry system (everything else routes to
// the article-based CornerPage behaviour).
export const ENTRY_CORNER_KEYS = Object.keys(CORNER_CONFIG);

export function isEntryCorner(corner: string): boolean {
  return Object.prototype.hasOwnProperty.call(CORNER_CONFIG, corner);
}
