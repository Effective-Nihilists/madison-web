import type { ReactElement } from 'react';
import Win9xWindow from '../../components/Win9xWindow';

// ArticleListPage — stub (Task 13 adds list + new/edit/delete).
export default function ArticleListPage(): ReactElement {
  return (
    <Win9xWindow title="articles.exe — Admin" bodyClassName="doc-body">
      <h1>Articles</h1>
      <p className="note">coming soon — article list with new / edit / delete.</p>
    </Win9xWindow>
  );
}
