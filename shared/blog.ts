import { z } from 'zod';
import type { InferDocType } from 'ugly-app/shared';

// ─── Corners ─────────────────────────────────────────────────────────────────
export const CORNERS = [
  { key: 'witchcraft', label: 'Witchcraft Corner' },
  { key: 'sci', label: 'Sci Corner' },
  { key: 'health', label: 'Health Corner' },
  { key: 'random', label: 'Random Thoughts' },
  { key: 'wheel', label: 'Wheel of Fortune' },
  { key: 'art', label: 'Art Blog' },
  { key: 'music', label: 'Music Player' },
  { key: 'books', label: 'Book Tracker' },
  { key: 'movies', label: 'Fav Movies' },
  { key: 'recipes', label: 'Recipes' },
  { key: 'restaurants', label: 'Fav Restaurants' },
  { key: 'travel', label: 'Travel Map' },
  { key: 'vision', label: 'Vision Board' },
  { key: 'memes', label: 'Meme Gallery' },
  { key: 'animals', label: 'Animal Gallery' },
] as const;
export const CORNER_KEYS = CORNERS.map((c) => c.key) as [string, ...string[]];

// ─── Schemas & Types ─────────────────────────────────────────────────────────
export const ArticleSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  corner: z.enum(CORNER_KEYS),
  excerpt: z.string().default(''),
  bodyMarkdown: z.string().default(''),
  coverImageUrl: z.string().nullable().default(null),
  status: z.enum(['draft', 'published']).default('draft'),
  authorId: z.string(),
  publishedAt: z.number().nullable().default(null),
});
export type Article = InferDocType<typeof ArticleSchema>;

export const CommentSchema = z.object({
  articleId: z.string(),
  name: z.string().min(1).max(60),
  body: z.string().min(1).max(2000),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});
export type Comment = InferDocType<typeof CommentSchema>;

export const RandomThoughtSchema = z.object({
  body: z.string().min(1).max(4000),
  authorId: z.string(),
});
export type RandomThought = InferDocType<typeof RandomThoughtSchema>;

export const MediaAssetSchema = z.object({
  url: z.string(),
  kind: z.enum(['image', 'audio', 'video']),
  name: z.string(),
  ownerId: z.string(),
});
export type MediaAsset = InferDocType<typeof MediaAssetSchema>;

export const MusicTrackSchema = z.object({
  title: z.string().min(1),
  url: z.string(),
  kind: z.enum(['mp3', 'wav', 'mp4']),
  order: z.number().default(0),
});
export type MusicTrack = InferDocType<typeof MusicTrackSchema>;

export const ButtonImageSchema = z.object({
  key: z.string(), // e.g. corner key or button id
  url: z.string(),
});
export type ButtonImage = InferDocType<typeof ButtonImageSchema>;

// A custom 88×31 button on the "buttons.gif" wall: an uploaded image that links
// out to another site (classic webring/button-wall style). Admin-managed.
export const ButtonLinkSchema = z.object({
  imageUrl: z.string(),
  linkUrl: z.string(),
  title: z.string().default(''),
  order: z.number().default(0),
});
export type ButtonLink = InferDocType<typeof ButtonLinkSchema>;

export const AdminUserSchema = z.object({ email: z.string() });
export type AdminUser = InferDocType<typeof AdminUserSchema>;
