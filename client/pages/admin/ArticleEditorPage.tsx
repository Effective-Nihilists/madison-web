import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from 'react';
import { MarkdownEditor } from 'ugly-app/markdown/client';
import { apiPost } from '../../api';
import Win9xWindow from '../../components/Win9xWindow';
import AdminGate from './AdminGate';
import { Link, useRouter } from '../../router';
import { useTheme } from '../../theme';
import { CORNERS, CORNER_KEYS, type Article } from '../../../shared/blog';
import { uploadMedia } from '../../admin/upload';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Natural aspect ratio of an image file (width / height), for the WYSIWYG
// editor's image node. Falls back to 1 if it can't be read.
function imageAspectRatio(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve(img.naturalWidth / img.naturalHeight || 1); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve(1); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

type Status = 'draft' | 'published';

function EditorInner({ id }: { id?: string }): ReactElement {
  const router = useRouter();
  const { theme } = useTheme();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [corner, setCorner] = useState<string>(CORNER_KEYS[0]);
  const [excerpt, setExcerpt] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('draft');

  const [loaded, setLoaded] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The WYSIWYG editor needs a numeric width; measure its container.
  const bodyWrapRef = useRef<HTMLDivElement>(null);
  const [editorWidth, setEditorWidth] = useState(680);
  useEffect(() => {
    const el = bodyWrapRef.current;
    if (!el) return;
    const measure = (): void => { const w = el.clientWidth; if (w > 0) setEditorWidth(w); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { ro.disconnect(); };
  }, [loaded]);

  // Upload an image dropped/pasted/picked inside the editor and return the node
  // descriptor the editor expects.
  async function onImageUpload(file: File): Promise<{ src: string; widthPercent: number; aspectRatio: number } | null> {
    try {
      const [src, aspectRatio] = await Promise.all([uploadMedia('image', file), imageAspectRatio(file)]);
      return { src, widthPercent: 100, aspectRatio };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'image upload failed');
      return null;
    }
  }

  useEffect(() => {
    if (!id) return;
    let active = true;
    const run = async () => {
      const { article: doc } = await apiPost<{ article: Article | null }>('adminGetArticle', { id });
      if (!active || !doc) {
        if (active) setLoaded(true);
        return;
      }
      setTitle(doc.title);
      setSlug(doc.slug);
      setSlugTouched(true);
      setCorner(doc.corner);
      setExcerpt(doc.excerpt);
      setBodyMarkdown(doc.bodyMarkdown);
      setCoverImageUrl(doc.coverImageUrl);
      setStatus(doc.status);
      setLoaded(true);
    };
    void run();
    return () => {
      active = false;
    };
  }, [id]);

  function handleTitleChange(value: string): void {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleCover(e: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const url = await uploadMedia('image', file);
      setCoverImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'cover upload failed');
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSave(): Promise<void> {
    if (!title.trim() || !slug.trim()) {
      setError('title and slug are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { id: savedId } = await apiPost<{ id: string }>('saveArticle', {
        ...(id ? { id } : {}),
        title: title.trim(),
        slug: slug.trim(),
        corner,
        excerpt,
        bodyMarkdown,
        coverImageUrl,
        status,
      });
      if (!id) router.replace('admin/articles/:id', { id: savedId });
      else router.push('admin/articles', {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <Win9xWindow title="editor.exe — loading" bodyClassName="doc-body">
        <p className="note">loading article…</p>
      </Win9xWindow>
    );
  }

  return (
    <Win9xWindow
      title={`editor.exe — ${id ? slug || 'article' : 'new article'}`}
      bodyClassName="doc-body"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="article" style={{ flex: 1, margin: 0 }}>
          {id ? 'Edit article' : 'New article'}
        </h1>
        <Link to="admin/articles" params={{}} className="tbtn">
          ← all articles
        </Link>
      </div>

      {error && (
        <p className="note" style={{ color: 'crimson', marginTop: 8 }}>
          {error}
        </p>
      )}

      <div className="cform" style={{ marginTop: 16 }}>
        <label className="note">title</label>
        <input type="text" value={title} onChange={(e) => { handleTitleChange(e.target.value); }} placeholder="article title" />

        <label className="note">slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          placeholder="article-slug"
        />

        <label className="note">corner</label>
        <select
          value={corner}
          onChange={(e) => { setCorner(e.target.value); }}
          style={{
            width: '100%',
            padding: '9px 11px',
            margin: '6px 0',
            border: '2px solid var(--panel-edge)',
            borderRadius: 9,
            background: 'var(--surface-solid)',
            color: 'var(--text)',
          }}
        >
          {CORNERS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>

        <label className="note">excerpt</label>
        <textarea value={excerpt} rows={2} onChange={(e) => { setExcerpt(e.target.value); }} placeholder="short summary shown on cards" />

        <label className="note">cover image</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '6px 0' }}>
          <input type="file" accept="image/*" onChange={(e) => void handleCover(e)} disabled={uploadingCover} />
          {uploadingCover && <span className="note">uploading…</span>}
          {coverImageUrl && (
            <>
              <img src={coverImageUrl} alt="cover" style={{ maxWidth: 120, borderRadius: 8, border: '2px solid var(--panel-edge)' }} />
              <button className="tbtn" type="button" onClick={() => { setCoverImageUrl(null); }}>
                remove
              </button>
            </>
          )}
        </div>

        <label className="note">body</label>
        <div
          ref={bodyWrapRef}
          className="wysiwyg-body"
          style={{
            margin: '6px 0',
            border: '2px solid var(--panel-edge)',
            borderRadius: 9,
            background: 'var(--surface-solid)',
            minHeight: 280,
            overflow: 'hidden',
          }}
        >
          <MarkdownEditor
            value={bodyMarkdown}
            onValueChanged={setBodyMarkdown}
            width={editorWidth}
            fileId={null}
            menuAbove={false}
            limitedToolbar={false}
            showToolbar
            isLoggedIn
            isDark={theme === 'dark'}
            placeholder="Write your article — format with the toolbar, drag or paste images…"
            onImageUpload={onImageUpload}
          />
        </div>

        <fieldset style={{ border: '2px solid var(--panel-edge)', borderRadius: 9, padding: '8px 12px', margin: '6px 0' }}>
          <legend className="note">status</legend>
          <label style={{ marginRight: 16 }}>
            <input type="radio" name="status" checked={status === 'draft'} onChange={() => { setStatus('draft'); }} /> draft
          </label>
          <label>
            <input type="radio" name="status" checked={status === 'published'} onChange={() => { setStatus('published'); }} /> published
          </label>
        </fieldset>

        <button className="tbtn" type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'saving…' : 'save article'}
        </button>
      </div>
    </Win9xWindow>
  );
}

// ArticleEditorPage — markdown + image-upload editor for both
// `admin/articles/new` and `admin/articles/:id` (Task 13). Keyed on `id` so the
// component remounts (and reloads) when navigating new → edit.
export default function ArticleEditorPage({ id }: { id?: string }): ReactElement {
  return (
    <AdminGate>
      <EditorInner key={id ?? 'new'} {...(id ? { id } : {})} />
    </AdminGate>
  );
}
