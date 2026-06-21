import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { useApp } from 'ugly-app/client';
import Win9xWindow from '../../components/Win9xWindow';
import AdminGate from './AdminGate';
import { Link, useRouter } from '../../router';
import { CORNERS, type Article } from '../../../shared/blog';

function cornerLabel(key: string): string {
  return CORNERS.find((c) => c.key === key)?.label ?? key;
}

function ArticleListInner(): ReactElement {
  const { socket } = useApp();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const res = await socket.request('adminListArticles', {});
    const { articles: all } = res as { articles: Article[] };
    setArticles(all);
    setLoaded(true);
  }, [socket]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm('Delete this article? This cannot be undone.')) return;
    await socket.request('deleteArticle', { id });
    await refresh();
  }

  return (
    <Win9xWindow title="articles.exe — Admin" bodyClassName="doc-body">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="article" style={{ flex: 1, margin: 0 }}>
          Articles
        </h1>
        <Link to="admin" params={{}} className="tbtn">
          ← dashboard
        </Link>
        <button className="tbtn" type="button" onClick={() => router.push('admin/articles/new', {})}>
          + new article
        </button>
      </div>

      {!loaded && <p className="note" style={{ marginTop: 12 }}>loading…</p>}
      {loaded && articles.length === 0 && (
        <p className="note" style={{ marginTop: 12 }}>
          no articles yet — create your first.
        </p>
      )}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {articles.map((a) => (
          <div key={a._id} className="cmt" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="who">
                {cornerLabel(a.corner)} · {a.status}
              </div>
              <div style={{ fontWeight: 700 }}>{a.title}</div>
              <div className="note">/{a.slug}</div>
            </div>
            <button
              className="tbtn"
              type="button"
              onClick={() => router.push('admin/articles/:id', { id: a._id })}
            >
              edit
            </button>
            <button className="tbtn" type="button" onClick={() => void handleDelete(a._id)}>
              delete
            </button>
          </div>
        ))}
      </div>
    </Win9xWindow>
  );
}

// ArticleListPage — admin list with new / edit / delete (Task 13).
export default function ArticleListPage(): ReactElement {
  return (
    <AdminGate>
      <ArticleListInner />
    </AdminGate>
  );
}
