import type { ReactElement } from 'react';
import Win9xWindow from '../components/Win9xWindow';
import { CORNERS } from '../../shared/blog';

// CornerPage — stub (lists articles in a corner in a later pass).
export default function CornerPage({ corner }: { corner: string }): ReactElement {
  const label = CORNERS.find((c) => c.key === corner)?.label ?? corner;
  return (
    <Win9xWindow title={`${corner}.dir — Explorer`} className="article-win" bodyClassName="doc-body">
      <h1>{label}</h1>
      <p className="note">coming soon — this corner&apos;s articles will appear here.</p>
    </Win9xWindow>
  );
}
