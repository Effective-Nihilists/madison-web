import type { ReactElement } from 'react';
import Win9xWindow from '../components/Win9xWindow';

// ArticlePage — stub (Task 11 fills with cover + markdown body + comments).
export default function ArticlePage({ slug }: { slug: string }): ReactElement {
  return (
    <Win9xWindow title={`${slug}.html — Reader`} className="article-win" bodyClassName="article doc-body">
      <div className="breadcrumb"><b>Article</b> › {slug}</div>
      <h1>{slug}</h1>
      <p className="note">coming soon — the article reader is part of the next pass.</p>
    </Win9xWindow>
  );
}
