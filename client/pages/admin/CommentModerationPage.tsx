import type { ReactElement } from 'react';
import Win9xWindow from '../../components/Win9xWindow';

// CommentModerationPage — stub (Task 14 adds pending-comment approve/reject).
export default function CommentModerationPage(): ReactElement {
  return (
    <Win9xWindow title="comments.exe — Moderation" bodyClassName="doc-body">
      <h1>Comments</h1>
      <p className="note">coming soon — approve / reject pending comments.</p>
    </Win9xWindow>
  );
}
