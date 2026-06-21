import type { ReactElement } from 'react';
import Win9xWindow from '../components/Win9xWindow';

// HomePage — shell-wrapped placeholder. Task 10 fills this with the Random
// Thoughts feed + recent published articles. The retro shell (top bar, sidebar,
// widgets, FX) is provided by <AppShell> in client/main.tsx, so this only
// renders the content column.
export default function HomePage(): ReactElement {
  return (
    <>
      <div className="announce">
        <span>✦ welcome to 317010.xyz ✦ best viewed in Netscape Navigator @ 1024×768 ✦ now with 100% more chaos ✦ Cosmoo the loaf-knight approves ✦ sign the guestbook ✦ mind the scanlines ✦ tea is brewing ✦</span>
      </div>
      <Win9xWindow title="★ random_thoughts.txt — Notepad" className="featured stagger">
        <span className="stamp">FEATURED · RANDOM THOUGHTS</span>
        <h2>a little corner of the internet</h2>
        <div className="time">coming soon</div>
        <p>
          the home feed (random thoughts + recent articles) lands in the next
          pass. for now, wander the corners in the sidebar, poke the widgets, and
          look for the five hidden secrets. goodnight, internet ghosts.
        </p>
      </Win9xWindow>
    </>
  );
}
