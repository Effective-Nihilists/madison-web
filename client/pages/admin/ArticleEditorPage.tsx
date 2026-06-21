import type { ReactElement } from 'react';
import Win9xWindow from '../../components/Win9xWindow';

// ArticleEditorPage — stub (Task 13 adds the markdown + image-upload editor).
// Used for both `admin/articles/new` and `admin/articles/:id`; `id` is optional.
export default function ArticleEditorPage({ id }: { id?: string }): ReactElement {
  return (
    <Win9xWindow title={`editor.exe — ${id ?? 'new article'}`} bodyClassName="doc-body">
      <h1>{id ? `Edit article ${id}` : 'New article'}</h1>
      <p className="note">coming soon — markdown editor with live preview + image upload.</p>
    </Win9xWindow>
  );
}
