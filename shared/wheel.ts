import { z } from 'zod';
import type { InferDocType } from 'ugly-app/shared';
import { TAROT } from './tarot';

// ─── Wheel schema ───────────────────────────────────────────────────────────
// A "Wheel of Fortune": a named list of 2..N slices that the public WheelPage
// renders as a spinnable conic-gradient wheel. Built-in wheels live in
// WHEEL_PRESETS below (no DB); admins can also save custom wheels to the
// `wheel` collection.
export const WheelSchema = z.object({
  name: z.string().min(1),
  slices: z.array(z.string().min(1)).min(2),
  ownerId: z.string(),
  order: z.number().default(0),
});
export type Wheel = InferDocType<typeof WheelSchema>;

// ─── Built-in presets ─────────────────────────────────────────────────────────
// Static, ship-in-the-bundle wheels available to every visitor regardless of
// any saved custom wheels. The Tarot preset derives its slices from the shared
// tarot dataset (the 22 Major Arcana names) rather than hardcoding them.
export interface WheelPreset {
  id: string;
  name: string;
  slices: string[];
}

const MAJOR_ARCANA_NAMES = TAROT.filter((c) => c.arcana === 'major').map((c) => c.name);

export const WHEEL_PRESETS: WheelPreset[] = [
  {
    id: 'bored-low',
    name: 'Bored · Low Energy',
    slices: [
      'read a chapter',
      'nap',
      'journal 3 lines',
      'tea + a podcast',
      'gentle stretch',
      'comfort movie',
      'doodle',
      'water your plants',
      'text someone you miss',
    ],
  },
  {
    id: 'bored-medium',
    name: 'Bored · Medium Energy',
    slices: [
      'bake something',
      'tidy one drawer',
      'learn a song',
      'sketch',
      'go for a walk',
      'try a recipe',
      'rearrange a shelf',
      'call a friend',
    ],
  },
  {
    id: 'bored-high',
    name: 'Bored · High Energy',
    slices: [
      'dance workout',
      'deep-clean a room',
      'go for a run',
      'rearrange furniture',
      'cook a big meal',
      'declutter closet',
      'bike ride',
    ],
  },
  {
    id: 'tarot',
    name: 'Tarot',
    slices: MAJOR_ARCANA_NAMES,
  },
];
