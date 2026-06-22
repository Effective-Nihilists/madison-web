import type { ReactElement } from 'react';
import GalleryPage from '../GalleryPage';
import { CORNER_CONFIG } from '../../../shared/entries';

// HerbsPage — the "Herbs Guide" gallery. A thin wrapper that renders the
// generic GalleryPage for the `herbs` entry corner with its CORNER_CONFIG
// (cards layout + search for herb properties/uses).
export default function HerbsPage(): ReactElement {
  const config = CORNER_CONFIG.herbs;
  if (!config) return <></>;
  return <GalleryPage corner="herbs" config={config} />;
}
