import { useEffect, useState, type ReactElement } from 'react';
import { apiPost } from '../api';
import Win9xWindow from '../components/Win9xWindow';
import { Link } from '../router';
import { CORNERS, type Article } from '../../shared/blog';
import { CORNER_CONFIG, isEntryCorner } from '../../shared/entries';
import GalleryPage from './GalleryPage';

function toMs(d: number | Date): number {
  return d instanceof Date ? d.getTime() : d;
}

// CornerPage — dispatcher. The 8 entry corners (books/movies/recipes/…)
// render the generic GalleryPage driven by CORNER_CONFIG; every other corner
// keeps the original article-list behaviour (sci/health/art/witchcraft essays).
export default function CornerPage({ corner }: { corner: string }): ReactElement {
  if (isEntryCorner(corner)) {
    const config = CORNER_CONFIG[corner];
    if (config) return <GalleryPage corner={corner} config={config} />;
  }
  return <ArticleCorner corner={corner} />;
}

// ArticleCorner — original article-list behaviour for essay corners.
function ArticleCorner({ corner }: { corner: string }): ReactElement {
  const label = CORNERS.find((c) => c.key === corner)?.label ?? corner;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    void (async () => {
      try {
        const { articles: all } = await apiPost<{ articles: Article[] }>('listArticles', { corner });
        if (!active) return;
        const published = all
          .filter((a) => a.status === 'published')
          .sort((x, y) => toMs(y.created) - toMs(x.created));
        setArticles(published);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [corner]);

  return (
    <Win9xWindow title={`${corner}.dir — Explorer`} className="article-win" bodyClassName="doc-body">
      <div className="breadcrumb">
        <b>
          <Link to="" params={{}} style={{ color: 'inherit' }}>
            Home
          </Link>
        </b>{' '}
        › {label}
      </div>
      <h1 className="article">{label}</h1>

      {!loaded && <p className="note">loading…</p>}
      {loaded && articles.length === 0 && (
        <p className="note">no published articles in this corner yet.</p>
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
  );
}
