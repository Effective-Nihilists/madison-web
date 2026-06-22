import type { ReactElement } from 'react';
import GalleryPage from '../GalleryPage';
import { CORNER_CONFIG, type CornerConfig } from '../../../shared/entries';

// Fallback mirrors the 'medplants' CORNER_CONFIG entry; satisfies the
// noUncheckedIndexedAccess lookup without an `any`/non-null assertion.
const MEDPLANTS_CONFIG: CornerConfig = CORNER_CONFIG.medplants ?? {
  layout: 'cards',
  search: true,
  fields: ['title', 'image', 'body', 'tags'],
  addLabel: 'add plant',
  emptyText: 'no plants in the guide yet.',
};

// MedPlantsPage — the public Med Plants guide for `health/plants`. Thin wrapper
// that drives the generic GalleryPage with the 'medplants' entry corner so it
// reuses the existing entry system (no new collection, no server changes).
export default function MedPlantsPage(): ReactElement {
  return <GalleryPage corner="medplants" config={MEDPLANTS_CONFIG} />;
}
