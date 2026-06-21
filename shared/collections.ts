import { z } from 'zod';
import type { InferDocType } from 'ugly-app/shared';
import { defineCollections } from 'ugly-app/shared';
import {
  ArticleSchema,
  CommentSchema,
  RandomThoughtSchema,
  MediaAssetSchema,
  MusicTrackSchema,
  ButtonImageSchema,
  AdminUserSchema,
} from './blog';

export type {
  Article,
  Comment,
  RandomThought,
  MediaAsset,
  MusicTrack,
  ButtonImage,
  AdminUser,
} from './blog';

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
export const collections = defineCollections({
  todo: {
    schema: TodoSchema,
    meta: { cache: false, trackable: true, public: false, cascadeFrom: null, trackKeys: ['userId'] },
  },
  conversation: {
    schema: ConversationSchema,
    meta: { cache: false, trackable: false, public: false, cascadeFrom: null },
  },
  message: {
    schema: MessageSchema,
    meta: { cache: false, trackable: false, public: false, cascadeFrom: 'conversation', trackKeys: ['conversationId'] },
  },
  collabDoc: {
    schema: CollabDocSchema,
    meta: { cache: false, trackable: false, public: false, cascadeFrom: null },
  },

  // ── Blog / CMS ─────────────────────────────────────────────────────────────
  article: {
    schema: ArticleSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: null, trackKeys: ['corner'] },
  },
  comment: {
    schema: CommentSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: 'article', trackKeys: ['articleId'] },
  },
  randomThought: {
    schema: RandomThoughtSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: null },
  },
  mediaAsset: {
    schema: MediaAssetSchema,
    meta: { cache: false, trackable: false, public: false, cascadeFrom: null },
  },
  musicTrack: {
    schema: MusicTrackSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: null },
  },
  buttonImage: {
    schema: ButtonImageSchema,
    meta: { cache: false, trackable: true, public: true, cascadeFrom: null },
  },
  adminUser: {
    schema: AdminUserSchema,
    meta: { cache: true, trackable: false, public: false, cascadeFrom: null },
  },
});

export type AppCollections = typeof collections;
