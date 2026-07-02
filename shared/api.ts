import { authReq, defineMessages, defineRequests, frameworkMessages, frameworkRequests, req, z } from 'ugly-app/shared';
import {
  ArticleSchema,
  CommentSchema,
  MusicTrackSchema,
  ButtonImageSchema,
  ButtonLinkSchema,
  RandomThoughtSchema,
  CORNER_KEYS,
} from './blog';
import { EntrySchema, ENTRY_CORNER_ENUM } from './entries';
import { WheelSchema } from './wheel';
import { SiteConfigSchema } from './site';

// Article fields editable by the admin (everything except server-managed
// authorId / publishedAt). Reused by saveArticle's input.
const ArticleInputSchema = ArticleSchema.pick({
  title: true,
  slug: true,
  corner: true,
  excerpt: true,
  bodyMarkdown: true,
  coverImageUrl: true,
  status: true,
});

// Framework DBObject metadata appended to every stored doc. `created`/`updated`
// are typed as `Date` on `DBObject` but serialize to millisecond numbers over
// the wire, so the output schema accepts either to stay type- and runtime-safe.
const dbFields = {
  _id: z.string(),
  version: z.number(),
  created: z.union([z.number(), z.date()]),
  updated: z.union([z.number(), z.date()]),
};

// DB-doc shapes (schema + framework DBObject fields) for outputs.
const ArticleDoc = ArticleSchema.extend(dbFields);
const CommentDoc = CommentSchema.extend(dbFields);
const RandomThoughtDoc = RandomThoughtSchema.extend(dbFields);
const MusicTrackDoc = MusicTrackSchema.extend(dbFields);
const ButtonImageDoc = ButtonImageSchema.extend(dbFields);
const ButtonLinkDoc = ButtonLinkSchema.extend(dbFields);
const EntryDoc = EntrySchema.extend(dbFields);
const WheelDoc = WheelSchema.extend(dbFields);

// Entry fields editable by the admin (everything except server-managed
// authorId). Reused by saveEntry's input.
const EntryInputSchema = EntrySchema.pick({
  corner: true,
  title: true,
  imageUrl: true,
  body: true,
  tags: true,
  rating: true,
  status: true,
  link: true,
  funFact: true,
  order: true,
}).partial({
  imageUrl: true,
  body: true,
  tags: true,
  rating: true,
  status: true,
  link: true,
  funFact: true,
  order: true,
});

export const requests = defineRequests({
  // Todo demo — CRUD requests
  createTodo: authReq({
    input: z.object({ text: z.string().min(1).max(500) }),
    output: z.object({ id: z.string() }),
  }),

  toggleTodo: authReq({
    input: z.object({ todoId: z.string() }),
    output: z.object({ done: z.boolean() }),
  }),

  deleteTodo: authReq({
    input: z.object({ todoId: z.string() }),
    output: z.object({ ok: z.boolean() }),
  }),

  // Push notification test — send a push via ugly.bot
  sendPush: authReq({
    input: z.object({
      targetUserId: z.string(),
      title: z.string().min(1).max(200),
      body: z.string().max(500),
      page: z.string(),
      query: z.record(z.string(), z.string()).optional(),
      imageUrl: z.string().optional(),
    }),
    output: z.object({ sent: z.boolean() }),
    rateLimit: { max: 10, window: 60 },
  }),

  // Email test — send an email via the app's email sender
  sendTestEmail: authReq({
    input: z.object({
      userId: z.string().min(1),
      subject: z.string().min(1).max(200),
      html: z.string().min(1),
      id: z.string().max(100).optional(),
    }),
    output: z.object({ ok: z.boolean() }),
    rateLimit: { max: 5, window: 60 },
  }),

  // Error test — intentionally throws to test error capture
  triggerTestError: authReq({
    input: z.object({ message: z.string().optional() }),
    output: z.object({ ok: z.boolean() }),
  }),

  // Worker task tests — verify exception, DB mutation, and console.error
  testWorkerThrow: authReq({
    input: z.object({ message: z.string().optional() }),
    output: z.object({ ok: z.boolean() }),
  }),

  testWorkerDbMutation: authReq({
    input: z.object({ text: z.string().min(1).max(500) }),
    output: z.object({ id: z.string(), verified: z.boolean() }),
  }),

  testWorkerConsoleError: authReq({
    input: z.object({ message: z.string().optional() }),
    output: z.object({ logged: z.boolean() }),
  }),

  // Perf test — records a perf entry through the framework's perf API
  triggerTestPerf: authReq({
    input: z.object({
      operation: z.string().min(1).max(200),
      durationMs: z.number().int().min(0).max(60_000),
    }),
    output: z.object({ ok: z.boolean() }),
  }),

  // Feedback test — records a feedback entry through the data-proxy capture
  // path so devTunnelId is stamped from the project's JWT (matches what
  // `ugly-app feedback:dev` filters on).
  triggerTestFeedback: authReq({
    input: z.object({
      type: z.enum(['bug', 'design', 'feature']),
      description: z.string().min(1).max(2000),
    }),
    output: z.object({ ok: z.boolean() }),
  }),

  // ── Blog — public reads ────────────────────────────────────────────────────
  listArticles: req({
    input: z.object({ corner: z.string().optional() }),
    output: z.object({ articles: z.array(ArticleDoc) }),
  }),
  getArticle: req({
    input: z.object({ slug: z.string().min(1) }),
    output: z.object({ article: ArticleDoc.nullable() }),
  }),
  listRandomThoughts: req({
    input: z.object({ limit: z.number().int().min(1).max(100).optional() }),
    output: z.object({ thoughts: z.array(RandomThoughtDoc) }),
  }),
  listApprovedComments: req({
    input: z.object({ articleId: z.string().min(1) }),
    output: z.object({ comments: z.array(CommentDoc) }),
  }),
  submitComment: req({
    input: z.object({
      articleId: z.string().min(1),
      name: z.string().min(1).max(60),
      body: z.string().min(1).max(2000),
    }),
    output: z.object({ ok: z.boolean() }),
    rateLimit: { max: 5, window: 60 },
  }),
  listMusicTracks: req({
    input: z.object({}),
    output: z.object({ tracks: z.array(MusicTrackDoc) }),
  }),
  listButtonImages: req({
    input: z.object({}),
    output: z.object({ images: z.array(ButtonImageDoc) }),
  }),
  listButtonLinks: req({
    input: z.object({}),
    output: z.object({ buttons: z.array(ButtonLinkDoc) }),
  }),

  // ── Blog / CMS — admin (authenticated + admin-gated) ───────────────────────
  whoAmI: authReq({
    input: z.object({}),
    output: z.object({ admin: z.boolean() }),
  }),
  adminListArticles: authReq({
    input: z.object({}),
    output: z.object({ articles: z.array(ArticleDoc) }),
  }),
  // Load a single article by _id for the admin editor (drafts included). There
  // is no public getDoc HTTP route, so the editor fetches via this admin
  // endpoint over same-origin HTTP (auth cookie) instead of socket.getDoc.
  adminGetArticle: authReq({
    input: z.object({ id: z.string().min(1) }),
    output: z.object({ article: ArticleDoc.nullable() }),
  }),
  saveArticle: authReq({
    input: ArticleInputSchema.extend({ id: z.string().optional() }),
    output: z.object({ id: z.string() }),
  }),
  deleteArticle: authReq({
    input: z.object({ id: z.string().min(1) }),
    output: z.object({ ok: z.boolean() }),
  }),
  createRandomThought: authReq({
    input: z.object({ body: z.string().min(1).max(4000) }),
    output: z.object({ id: z.string() }),
  }),
  deleteRandomThought: authReq({
    input: z.object({ id: z.string().min(1) }),
    output: z.object({ ok: z.boolean() }),
  }),
  adminListComments: authReq({
    input: z.object({ status: z.enum(['pending', 'approved', 'rejected']).optional() }),
    output: z.object({ comments: z.array(CommentDoc) }),
  }),
  moderateComment: authReq({
    input: z.object({ id: z.string().min(1), action: z.enum(['approve', 'reject']) }),
    output: z.object({ ok: z.boolean() }),
  }),
  uploadMedia: authReq({
    input: z.object({
      kind: z.enum(['image', 'audio', 'video']),
      name: z.string().min(1).max(200),
      dataBase64: z.string().min(1),
    }),
    output: z.object({ url: z.string() }),
    rateLimit: { max: 30, window: 60 },
  }),
  addMusicTrack: authReq({
    input: z.object({
      title: z.string().min(1),
      url: z.string().min(1),
      kind: z.enum(['mp3', 'wav', 'mp4']),
    }),
    output: z.object({ id: z.string() }),
  }),
  deleteMusicTrack: authReq({
    input: z.object({ id: z.string().min(1) }),
    output: z.object({ ok: z.boolean() }),
  }),
  setButtonImage: authReq({
    input: z.object({ key: z.string().min(1), url: z.string().min(1) }),
    output: z.object({ ok: z.boolean() }),
  }),
  addButtonLink: authReq({
    input: z.object({
      imageUrl: z.string().min(1),
      linkUrl: z.string().min(1),
      title: z.string().max(200).optional(),
    }),
    output: z.object({ id: z.string() }),
  }),
  updateButtonLink: authReq({
    input: z.object({
      id: z.string().min(1),
      linkUrl: z.string().min(1).optional(),
      title: z.string().max(200).optional(),
    }),
    output: z.object({ ok: z.boolean() }),
  }),
  deleteButtonLink: authReq({
    input: z.object({ id: z.string().min(1) }),
    output: z.object({ ok: z.boolean() }),
  }),

  // ── Phase 2: generic entry/gallery system ───────────────────────────────────
  // Public read — list entries for one corner, optional text query.
  listEntries: req({
    input: z.object({ corner: z.enum(ENTRY_CORNER_ENUM), q: z.string().optional() }),
    output: z.object({ entries: z.array(EntryDoc) }),
  }),
  // Admin write — upsert (nanoid when new), delete, and admin list (all corners
  // unfiltered status, used by the EntryManager).
  saveEntry: authReq({
    input: EntryInputSchema.extend({ id: z.string().optional() }),
    output: z.object({ id: z.string() }),
  }),
  deleteEntry: authReq({
    input: z.object({ id: z.string().min(1) }),
    output: z.object({ ok: z.boolean() }),
  }),
  adminListEntries: authReq({
    input: z.object({ corner: z.enum(ENTRY_CORNER_ENUM) }),
    output: z.object({ entries: z.array(EntryDoc) }),
  }),

  // ── Phase 2 (Batch 3): Wheel of Fortune ────────────────────────────────────
  // Public read — list all custom wheels (built-in presets ship client-side).
  listWheels: req({
    input: z.object({}),
    output: z.object({ wheels: z.array(WheelDoc) }),
  }),
  // Admin write — upsert (nanoid when new) and delete.
  saveWheel: authReq({
    input: z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      slices: z.array(z.string().min(1)).min(2),
      order: z.number().optional(),
    }),
    output: z.object({ id: z.string() }),
  }),
  deleteWheel: authReq({
    input: z.object({ id: z.string().min(1) }),
    output: z.object({ ok: z.boolean() }),
  }),

  // ── Visitor counter (public, real DB-backed) ───────────────────────────────
  getVisitCount: req({
    input: z.object({}),
    output: z.object({ count: z.number() }),
  }),
  recordVisit: req({
    input: z.object({}),
    output: z.object({ count: z.number() }),
    rateLimit: { max: 30, window: 60 },
  }),

  // ── Site customization (public read; admin-gated write) ────────────────────
  getSiteConfig: req({
    input: z.object({}),
    output: z.object({ config: SiteConfigSchema }),
  }),
  saveSiteConfig: authReq({
    input: z.object({ patch: SiteConfigSchema.partial() }),
    output: z.object({ ok: z.boolean() }),
  }),

  // Example: public request — userId is string | null
  // getPublicData: req({
  //   input: z.object({ id: z.string() }),
  //   output: z.object({ data: z.string() }),
  // }),
});

export const messages = defineMessages({
  // Example fire-and-forget (with Zod):
  // userTyping: msg(z.object({ channelId: z.string() })),
  //
  // Example RPC (with Zod):
  // getOnlineUsers: rpcMsg({
  //   data: z.object({ channelId: z.string() }),
  //   response: z.object({ userIds: z.array(z.string()) }),
  // }),
});

export type { authReq };

export interface AppRegistry {
  requests: typeof frameworkRequests & typeof requests;
  messages: typeof frameworkMessages & typeof messages;
}
