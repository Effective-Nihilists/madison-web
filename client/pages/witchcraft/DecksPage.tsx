import type { ReactElement } from 'react';
import GalleryPage from '../GalleryPage';
import { CORNER_CONFIG } from '../../../shared/entries';

// DecksPage — the "My Decks" gallery. A thin wrapper that renders the generic
// GalleryPage for the `decks` entry corner with its CORNER_CONFIG.
export default function DecksPage(): ReactElement {
  const config = CORNER_CONFIG.decks;
  if (!config) return <></>;
  return <GalleryPage corner="decks" config={config} />;
}
