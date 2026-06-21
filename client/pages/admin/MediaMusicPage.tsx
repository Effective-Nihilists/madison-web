import type { ReactElement } from 'react';
import Win9xWindow from '../../components/Win9xWindow';

// MediaMusicPage — stub (Task 14 adds music upload + button-image managers).
export default function MediaMusicPage(): ReactElement {
  return (
    <Win9xWindow title="media.exe — Music & Buttons" bodyClassName="doc-body">
      <h1>Media &amp; Music</h1>
      <p className="note">coming soon — upload .wav / .mp4 tracks and corner button images.</p>
    </Win9xWindow>
  );
}
