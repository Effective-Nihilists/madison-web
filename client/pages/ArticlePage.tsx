import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { useApp } from 'ugly-app/client';
import Win9xWindow from '../components/Win9xWindow';
import Markdown from '../components/Markdown';
import { Link } from '../router';
import { CORNERS, type Article, type Comment } from '../../shared/blog';

function cornerLabel(key: string): string {
  return CORNERS.find((c) => c.key === key)?.label ?? key;
}

function toMs(d: number | Date): number {
  return d instanceof Date ? d.getTime() : d;
}

// ArticlePage — reader: cover, title/byline, markdown body in a readable
// document window, approved comments, and a moderated comment form (Task 11).
export default function ArticlePage({ slug }: { slug: string }): ReactElement {
  const { socket } = useApp();
  const [article, setArticle] = useState<Article | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setArticle(null);
    setComments([]);
    setSubmitted(false);
    void (async () => {
      try {
        const res = await socket.request('getArticle', { slug });
        if (!active) return;
        const { article: a } = res as { article: Article | null };
        setArticle(a);
        if (a) {
          const cRes = await socket.request('listApprovedComments', { articleId: a._id });
          if (!active) return;
          const { comments: cs } = cRes as { comments: Comment[] };
          setComments(cs);
        }
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [socket, slug]);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!article) return;
    const trimmedName = name.trim();
    const trimmedBody = body.trim();
    if (!trimmedName || !trimmedBody) return;
    setSubmitting(true);
    setError(null);
    try {
      await socket.request('submitComment', {
        articleId: article._id,
        name: trimmedName,
        body: trimmedBody,
      });
      setSubmitted(true);
      setName('');
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  }

  if (loaded && !article) {
    return (
      <Win9xWindow title={`${slug}.html — Reader`} className="article-win" bodyClassName="doc-body">
        <div className="breadcrumb">
          <b>Article</b> › {slug}
        </div>
        <h1 className="article">Not found</h1>
        <p className="note">no article exists at this address.</p>
        <Link to="" params={{}} className="tbtn" style={{ marginTop: 12 }}>
          ← back home
        </Link>
      </Win9xWindow>
    );
  }

  return (
    <Win9xWindow
      title={`${slug}.html — Reader`}
      className="article-win"
      bodyClassName="article doc-body"
    >
      {!article ? (
        <p className="note">loading…</p>
      ) : (
        <>
          <div className="breadcrumb">
            <b>
              <Link to="corner/:corner" params={{ corner: article.corner }} style={{ color: 'inherit' }}>
                {cornerLabel(article.corner)}
              </Link>
            </b>{' '}
            › {article.title}
          </div>

          {article.coverImageUrl && (
            <figure>
              <img src={article.coverImageUrl} alt={article.title} />
            </figure>
          )}

          <h1>{article.title}</h1>
          <div className="byline">
            in {cornerLabel(article.corner)}
            {article.publishedAt ? ` · ${new Date(article.publishedAt).toLocaleDateString()}` : ''}
          </div>

          <Markdown source={article.bodyMarkdown} />

          <hr style={{ margin: '24px 0', border: 0, borderTop: '3px double var(--panel-edge)' }} />

          <section className="comments">
            <h2 style={{ fontFamily: 'var(--orn-font)' }}>Comments</h2>
            {comments.length === 0 && <p className="note">no comments yet — be the first.</p>}
            {comments.map((c) => (
              <div key={c._id} className="cmt">
                <div className="who">
                  {c.name} · {new Date(toMs(c.created)).toLocaleDateString()}
                </div>
                <div>{c.body}</div>
              </div>
            ))}

            <form className="cform" onSubmit={(e) => void handleSubmit(e)} style={{ marginTop: 16 }}>
              <p className="note">Comments are reviewed before they appear.</p>
              {submitted && (
                <p className="note" style={{ color: 'var(--accent)' }}>
                  Thanks — your comment was submitted and will appear once reviewed.
                </p>
              )}
              {error && (
                <p className="note" style={{ color: 'crimson' }}>
                  {error}
                </p>
              )}
              <input
                type="text"
                placeholder="your name"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
              />
              <textarea
                placeholder="leave a comment…"
                value={body}
                rows={4}
                maxLength={2000}
                onChange={(e) => setBody(e.target.value)}
              />
              <button className="tbtn" type="submit" disabled={submitting}>
                {submitting ? 'submitting…' : 'submit comment'}
              </button>
            </form>
          </section>
        </>
      )}
    </Win9xWindow>
  );
}
