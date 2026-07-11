import { z } from 'zod';
import type { InferDocType } from 'ugly-app/shared';
import { defineCollections, d1 } from 'ugly-app/shared';
import {
  ArticleSchema,
  CommentSchema,
  RandomThoughtSchema,
  MediaAssetSchema,
  MusicTrackSchema,
  ButtonImageSchema,
  ButtonLinkSchema,
  AdminUserSchema,
} from './blog';
import { EntrySchema } from './entries';
import { WheelSchema } from './wheel';
import { SiteStatSchema, SiteConfigSchema } from './site';

export type {
  Article,
  Comment,
  RandomThought,
  MediaAsset,
  MusicTrack,
  ButtonImage,
  ButtonLink,
  AdminUser,
} from './blog';
export type { Entry } from './entries';

// ─── Schemas & Types ─────────────────────────────────────────────────────────

export const TodoSchema = z.object({
  userId: z.string(),
  text: z.string(),
  done: z.boolean(),
});
export type Todo = InferDocType<typeof TodoSchema>;

export const ConversationSchema = z.object({
  type: z.string().default('ai-chat'),
  title: z.string().default(''),
});
export type Conversation = InferDocType<typeof ConversationSchema>;

export const MessageSchema = z.object({
  conversationId: z.string(),
  userId: z.string(),
  text: z.string(),
});
export type Message = InferDocType<typeof MessageSchema>;

export const CollabDocSchema = z.object({
  yjsState: z.string(),
  serialized: z.string().nullable(),
  lastSyncedAt: z.number(),
});
export type CollabDoc = InferDocType<typeof CollabDocSchema>;

// --- Collections ---
// meta options:
//   cache        – cache docs in memory LRU (good for small, frequently read collections)
//   trackable    – emit change events so clients can subscribe to real-time updates
//   public       – allow unauthenticated reads (use sparingly)
//   cascadeFrom  – name of a parent collection: when that parent is deleted, cascade here
//   trackKeys    – fields whose values are used as NATS routing keys for scoped trackDocs
//                  subscriptions. Example: trackKeys: ['chatId'] enables
//                  socket.trackDocs(collections.message, { keys: { chatId: '...' } }, cb)
//
// After adding a collection, run: npm run db:schema-gen && npm run db:migrate
//
// D1-only backend: every collection carries `db: d1`. D1 THROWS on getDocs
// filters/sorts over unindexed JSONB fields (only _id/created/updated/version
// are exempt, and only for sort). Each queried field below is covered by an
// `indexes` entry. Index lists are widened module consts (`IndexDef[]`) rather
// than inline literals to avoid the defineCollections mapped-type inference
// blowup.
interface IndexDef {
  fields: Record<string, 1 | -1>;
}
const todoIndexes: IndexDef[] = [{ fields: { userId: 1 } }]; // trackKeys ['userId']
const messageIndexes: IndexDef[] = [{ fields: { conversationId: 1 } }]; // trackKeys + cascade + engine query
const articleIndexes: IndexDef[] = [
  { fields: { status: 1 } },
  { fields: { corner: 1 } }, // trackKeys ['corner']
  { fields: { slug: 1 } },
  { fields: { publishedAt: -1 } },
];
const commentIndexes: IndexDef[] = [
  { fields: { articleId: 1 } }, // trackKeys + cascade from article
  { fields: { status: 1 } },
];
const musicTrackIndexes: IndexDef[] = [{ fields: { order: 1 } }];
const buttonLinkIndexes: IndexDef[] = [{ fields: { order: 1 } }];
const entryIndexes: IndexDef[] = [
  { fields: { corner: 1 } }, // trackKeys ['corner']
  { fields: { order: 1 } },
];
const wheelIndexes: IndexDef[] = [{ fields: { order: 1 } }];

export const collections = defineCollections({
  todo: {
    schema: TodoSchema,
    meta: { cache: false, trackable: true, public: false, cascadeFrom: null, trackKeys: ['userId'], db: d1 },
    indexes: todoIndexes,
  },
  conversation: {
    schema: ConversationSchema,
    meta: { cache: false, trackable: false, public: false, cascadeFrom: null, db: d1 },
  },
  message: {
    schema: MessageSchema,
    meta: { cache: false, trackable: false, public: false, cascadeFrom: 'conversation', trackKeys: ['conversationId'], db: d1 },
    indexes: messageIndexes,
  },
  collabDoc: {
    schema: CollabDocSchema,
    meta: { cache: false, trackable: false, public: false, cascadeFrom: null, db: d1 },
  },

  // ── Blog / CMS ─────────────────────────────────────────────────────────────
  article: {
    schema: ArticleSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: null, trackKeys: ['corner'], db: d1 },
    indexes: articleIndexes,
  },
  comment: {
    schema: CommentSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: 'article', trackKeys: ['articleId'], db: d1 },
    indexes: commentIndexes,
  },
  randomThought: {
    schema: RandomThoughtSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: null, db: d1 },
  },
  mediaAsset: {
    schema: MediaAssetSchema,
    meta: { cache: false, trackable: false, public: false, cascadeFrom: null, db: d1 },
  },
  musicTrack: {
    schema: MusicTrackSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: null, db: d1 },
    indexes: musicTrackIndexes,
  },
  buttonImage: {
    schema: ButtonImageSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: null, db: d1 },
  },
  buttonLink: {
    schema: ButtonLinkSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: null, db: d1 },
    indexes: buttonLinkIndexes,
  },
  adminUser: {
    schema: AdminUserSchema,
    meta: { cache: true, trackable: false, public: false, cascadeFrom: null, db: d1 },
  },

  // ── Phase 2: generic entry/gallery system ───────────────────────────────────
  entry: {
    schema: EntrySchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: null, trackKeys: ['corner'], db: d1 },
    indexes: entryIndexes,
  },

  // ── Phase 2 (Batch 3): Wheel of Fortune custom wheels ───────────────────────
  wheel: {
    schema: WheelSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: null, db: d1 },
    indexes: wheelIndexes,
  },

  // ── Site: real visitor counter + global customization (admin-only writes) ────
  siteStat: {
    schema: SiteStatSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: null, db: d1 },
  },
  siteConfig: {
    schema: SiteConfigSchema,
    meta: { cache: true, trackable: true, public: true, cascadeFrom: null, db: d1 },
  },
});

export type AppCollections = typeof collections;
