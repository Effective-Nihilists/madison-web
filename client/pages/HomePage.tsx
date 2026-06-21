import { useEffect, useState, type ReactElement } from 'react';
import { apiPost } from '../api';
import Win9xWindow from '../components/Win9xWindow';
import { Link } from '../router';
import { CORNERS, type Article, type RandomThought } from '../../shared/blog';

// HomePage — featured most-recent Random Thought + a list of recent published
// articles (Task 10). The retro shell (top bar, sidebar, widgets, FX) is
// provided by <AppShell> in client/main.tsx, so this only renders the content
// column.

function cornerLabel(key: string): string {
  return CORNERS.find((c) => c.key === key)?.label ?? key;
}

function toMs(d: number | Date): number {
  return d instanceof Date ? d.getTime() : d;
}

export default function HomePage(): ReactElement {
  const [thought, setThought] = useState<RandomThought | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [tRes, aRes] = await Promise.all([
          apiPost<{ thoughts: RandomThought[] }>('listRandomThoughts', { limit: 1 }),
          apiPost<{ articles: Article[] }>('listArticles', {}),
        ]);
        if (!active) return;
        const { thoughts } = tRes;
        const { articles: all } = aRes;
        setThought(thoughts[0] ?? null);
        const recent = [...all]
          .filter((a) => a.status === 'published')
          .sort((x, y) => toMs(y.created) - toMs(x.created));
        setArticles(recent);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const isEmpty = loaded && !thought && articles.length === 0;

  return (
    <>
      <div className="announce">
        <span>✦ welcome to 317010.xyz ✦ best viewed in Netscape Navigator @ 1024×768 ✦ now with 100% more chaos ✦ Cosmoo the loaf-knight approves ✦ sign the guestbook ✦ mind the scanlines ✦ tea is brewing ✦</span>
      </div>

      {isEmpty && (
        <Win9xWindow title="welcome.txt — Notepad" className="featured stagger" bodyClassName="doc-body">
          <span className="stamp">FRESH INSTALL</span>
          <h2>no posts yet</h2>
          <p className="note">
            this little corner of the internet is still warming up — no random thoughts and no
            published articles just yet. brew some tea and check back soon ✦
          </p>
        </Win9xWindow>
      )}

      <Win9xWindow title="★ random_thoughts.txt — Notepad" className="featured stagger">
        <span className="stamp">FEATURED · RANDOM THOUGHTS</span>
        {thought ? (
          <>
            <h2>a little corner of the internet</h2>
            <div className="time">{new Date(toMs(thought.created)).toLocaleString()}</div>
            <p>{thought.body}</p>
          </>
        ) : (
          <>
            <h2>a little corner of the internet</h2>
            <div className="time">{loaded ? 'no thoughts yet' : 'loading…'}</div>
            <p>
              {loaded
                ? 'no random thoughts have been posted yet — check back soon, internet ghosts.'
                : 'gathering thoughts…'}
            </p>
          </>
        )}
      </Win9xWindow>

      <Win9xWindow title="recent_articles.dir — Explorer" className="article-win" bodyClassName="doc-body">
        <div className="breadcrumb">
          <b>Home</b> › recent articles
        </div>
        <h1 className="article" style={{ margin: '.1em 0 .4em' }}>
          Recent posts
        </h1>
        {!loaded && <p className="note">loading articles…</p>}
        {loaded && articles.length === 0 && (
          <p className="note">no published articles yet — the corners await their first words.</p>
        )}
        {articles.length > 0 && (
          <div className="highlight-grid" style={{ gridTemplateColumns: '1fr', gap: 12 }}>
            {articles.map((a) => (
              <Link
                key={a._id}
                to="article/:slug"
                params={{ slug: a.slug }}
                className="card"
                style={{ display: 'block', marginBottom: 0, textDecoration: 'none' }}
              >
                <span className="stamp" style={{ marginBottom: 8 }}>
                  {cornerLabel(a.corner)}
                </span>
                <h2 style={{ margin: '.1em 0', fontFamily: 'var(--orn-font)' }}>{a.title}</h2>
                {a.excerpt && <p style={{ margin: '.4em 0 0' }}>{a.excerpt}</p>}
                <div className="time" style={{ marginTop: 8 }}>
                  {new Date(toMs(a.created)).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Win9xWindow>
    </>
  );
}
