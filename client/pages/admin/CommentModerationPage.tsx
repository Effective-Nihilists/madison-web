import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { apiPost } from '../../api';
import Win9xWindow from '../../components/Win9xWindow';
import AdminGate from './AdminGate';
import { Link } from '../../router';
import type { Comment } from '../../../shared/blog';

function toMs(d: number | Date): number {
  return d instanceof Date ? d.getTime() : d;
}

function ModerationInner(): ReactElement {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const { comments: cs } = await apiPost<{ comments: Comment[] }>('adminListComments', { status: 'pending' });
    setComments(cs);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function moderate(id: string, action: 'approve' | 'reject'): Promise<void> {
    await apiPost('moderateComment', { id, action });
    await refresh();
  }

  return (
    <Win9xWindow title="comments.exe — Moderation" bodyClassName="doc-body">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 className="article" style={{ flex: 1, margin: 0 }}>
          Pending comments
        </h1>
        <Link to="admin" params={{}} className="tbtn">
          ← dashboard
        </Link>
      </div>

      {!loaded && <p className="note" style={{ marginTop: 12 }}>loading…</p>}
      {loaded && comments.length === 0 && (
        <p className="note" style={{ marginTop: 12 }}>no pending comments — all caught up.</p>
      )}

      <div className="comments" style={{ marginTop: 16 }}>
        {comments.map((c) => (
          <div key={c._id} className="cmt">
            <div className="who">
              {c.name} · {new Date(toMs(c.created)).toLocaleString()}
            </div>
            <div style={{ margin: '6px 0 10px' }}>{c.body}</div>
            <button className="tbtn" type="button" onClick={() => void moderate(c._id, 'approve')} style={{ marginRight: 8 }}>
              approve
            </button>
            <button className="tbtn" type="button" onClick={() => void moderate(c._id, 'reject')}>
              reject
            </button>
          </div>
        ))}
      </div>
    </Win9xWindow>
  );
}

// CommentModerationPage — pending-comment approve/reject (Task 14).
export default function CommentModerationPage(): ReactElement {
  return (
    <AdminGate>
      <ModerationInner />
    </AdminGate>
  );
}
