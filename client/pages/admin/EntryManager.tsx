import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type ReactElement,
} from 'react';
import { apiPost } from '../../api';
import Win9xWindow from '../../components/Win9xWindow';
import AdminGate from './AdminGate';
import { Link } from '../../router';
import { CORNERS } from '../../../shared/blog';
import {
  CORNER_CONFIG,
  ENTRY_CORNER_LABELS,
  STATUS_OPTIONS,
  type Entry,
} from '../../../shared/entries';
import { uploadMedia } from '../../admin/upload';

function cornerLabel(key: string): string {
  return (
    CORNERS.find((c) => c.key === key)?.label ?? ENTRY_CORNER_LABELS[key] ?? key
  );
}

const selectStyle = {
  width: '100%',
  padding: '9px 11px',
  margin: '6px 0',
  border: '2px solid var(--panel-edge)',
  borderRadius: 9,
  background: 'var(--surface-solid)',
  color: 'var(--text)',
} as const;

interface FormState {
  id?: string;
  title: string;
  imageUrl: string | null;
  body: string;
  tags: string;
  rating: string;
  status: string;
  link: string;
  funFact: string;
  order: string;
}

function blankForm(corner: string): FormState {
  // Default status to the first option when the corner uses a status enum.
  const statusOpts = STATUS_OPTIONS[corner] ?? [];
  return {
    title: '',
    imageUrl: null,
    body: '',
    tags: '',
    rating: '',
    status: statusOpts[0] ?? '',
    link: '',
    funFact: '',
    order: '0',
  };
}

function EntryManagerInner({ corner }: { corner: string }): ReactElement {
  const config = CORNER_CONFIG[corner];
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<FormState>(() => blankForm(corner));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOpts = STATUS_OPTIONS[corner] ?? [];

  const refresh = useCallback(async () => {
    const { entries: list } = await apiPost<{ entries: Entry[] }>(
      'adminListEntries',
      { corner },
    );
    setEntries(list);
    setLoaded(true);
  }, [corner]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function has(field: string): boolean {
    return config?.fields.includes(field) ?? false;
  }

  function resetForm(): void {
    setForm(blankForm(corner));
    setError(null);
  }

  function loadIntoForm(e: Entry): void {
    setForm({
      id: e._id,
      title: e.title,
      imageUrl: e.imageUrl,
      body: e.body,
      tags: e.tags.join(', '),
      rating: e.rating === null ? '' : String(e.rating),
      status: e.status,
      link: e.link,
      funFact: e.funFact,
      order: String(e.order),
    });
    setError(null);
    if (typeof window !== 'undefined')
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleImage(ev: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadMedia('image', file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'image upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(): Promise<void> {
    if (!form.title.trim()) {
      setError('title is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const ratingNum = form.rating.trim() === '' ? null : Number(form.rating);
      await apiPost<{ id: string }>('saveEntry', {
        ...(form.id ? { id: form.id } : {}),
        corner,
        title: form.title.trim(),
        imageUrl: form.imageUrl,
        body: form.body,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        rating:
          ratingNum !== null && Number.isFinite(ratingNum) ? ratingNum : null,
        status: form.status,
        link: form.link.trim(),
        funFact: form.funFact,
        order: Number(form.order) || 0,
      });
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return;
    await apiPost('deleteEntry', { id });
    if (form.id === id) resetForm();
    await refresh();
  }

  if (!config) {
    return (
      <Win9xWindow title="entries.exe — Admin" bodyClassName="doc-body">
        <h1 className="article">Unknown corner</h1>
        <p className="note">“{corner}” is not a managed entry corner.</p>
        <Link to="admin" params={{}} className="tbtn" style={{ marginTop: 12 }}>
          ← dashboard
        </Link>
      </Win9xWindow>
    );
  }

  return (
    <Win9xWindow title={`entries.exe — ${corner}`} bodyClassName="doc-body">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h1 className="article" style={{ flex: 1, margin: 0 }}>
          {cornerLabel(corner)}
        </h1>
        <Link to="admin" params={{}} className="tbtn">
          ← dashboard
        </Link>
      </div>

      {error && (
        <p className="note" style={{ color: 'crimson', marginTop: 8 }}>
          {error}
        </p>
      )}

      {/* ── Add / edit form ─────────────────────────────────────────────────── */}
      <div className="cform" style={{ marginTop: 16 }}>
        <h2 style={{ fontFamily: 'var(--orn-font)' }}>
          {form.id ? 'Edit entry' : config.addLabel}
        </h2>

        <label className="note">title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => {
            setForm((f) => ({ ...f, title: e.target.value }));
          }}
          placeholder="title"
          data-id="title"
        />

        {has('image') && (
          <>
            <label className="note">image</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                margin: '6px 0',
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void handleImage(e)}
                disabled={uploading}
                data-id="input"
              />
              {uploading && <span className="note">uploading…</span>}
              {form.imageUrl && (
                <>
                  <img
                    src={form.imageUrl}
                    alt="entry"
                    style={{
                      maxWidth: 120,
                      borderRadius: 8,
                      border: '2px solid var(--panel-edge)',
                    }}
                  />
                  <button
                    className="tbtn"
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, imageUrl: null }));
                    }}
                    data-id="remove"
                  >
                    remove
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {has('status') && statusOpts.length > 0 && (
          <>
            <label className="note">status</label>
            <select
              value={form.status}
              onChange={(e) => {
                setForm((f) => ({ ...f, status: e.target.value }));
              }}
              style={selectStyle}
              data-id="select"
            >
              {statusOpts.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </>
        )}

        {has('rating') && (
          <>
            <label className="note">rating (0–5, blank for none)</label>
            <input
              type="number"
              min={0}
              max={5}
              step={0.5}
              value={form.rating}
              onChange={(e) => {
                setForm((f) => ({ ...f, rating: e.target.value }));
              }}
              placeholder="e.g. 4.5"
              data-id="e-g-4-5"
            />
          </>
        )}

        {has('tags') && (
          <>
            <label className="note">tags (comma-separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => {
                setForm((f) => ({ ...f, tags: e.target.value }));
              }}
              placeholder="funny, cat, classic"
              data-id="funny-cat-classic"
            />
          </>
        )}

        {has('link') && (
          <>
            <label className="note">link</label>
            <input
              type="url"
              value={form.link}
              onChange={(e) => {
                setForm((f) => ({ ...f, link: e.target.value }));
              }}
              placeholder="https://…"
              data-id="https"
            />
          </>
        )}

        {has('funFact') && (
          <>
            <label className="note">fun fact</label>
            <input
              type="text"
              value={form.funFact}
              onChange={(e) => {
                setForm((f) => ({ ...f, funFact: e.target.value }));
              }}
              placeholder="a fun fact"
              data-id="a-fun-fact"
            />
          </>
        )}

        {has('body') && (
          <>
            <label className="note">body (markdown)</label>
            <textarea
              value={form.body}
              rows={config.layout === 'list' ? 10 : 4}
              onChange={(e) => {
                setForm((f) => ({ ...f, body: e.target.value }));
              }}
              placeholder={
                config.layout === 'list'
                  ? '## Ingredients\n- …\n\n## Steps\n1. …'
                  : 'notes / recommendation…'
              }
              style={{ fontFamily: 'var(--pixel-font, monospace)' }}
              data-id="textarea"
            />
          </>
        )}

        <label className="note">order (lower shows first)</label>
        <input
          type="number"
          value={form.order}
          onChange={(e) => {
            setForm((f) => ({ ...f, order: e.target.value }));
          }}
          data-id="input-2"
        />

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            className="tbtn"
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            data-id="button"
          >
            {saving ? 'saving…' : form.id ? 'save changes' : config.addLabel}
          </button>
          {form.id && (
            <button
              className="tbtn"
              type="button"
              onClick={resetForm}
              data-id="cancel-edit"
            >
              cancel edit
            </button>
          )}
        </div>
      </div>

      <hr
        style={{
          margin: '24px 0',
          border: 0,
          borderTop: '3px double var(--panel-edge)',
        }}
      />

      {/* ── Existing entries ────────────────────────────────────────────────── */}
      <h2 style={{ fontFamily: 'var(--orn-font)' }}>Entries</h2>
      {!loaded && <p className="note">loading…</p>}
      {loaded && entries.length === 0 && (
        <p className="note">{config.emptyText}</p>
      )}
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {entries.map((e) => (
          <div
            key={e._id}
            className="cmt"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {e.imageUrl && (
              <img
                src={e.imageUrl}
                alt={e.title}
                style={{
                  width: 48,
                  height: 48,
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: '2px solid var(--panel-edge)',
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 700 }}>{e.title}</div>
              <div className="note">
                {[
                  e.status,
                  e.rating !== null ? `${e.rating}★` : '',
                  e.tags.join(' '),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
            <button
              className="tbtn"
              type="button"
              onClick={() => {
                loadIntoForm(e);
              }}
              data-id="edit"
            >
              edit
            </button>
            <button
              className="tbtn"
              type="button"
              onClick={() => void handleDelete(e._id)}
              data-id="delete"
            >
              delete
            </button>
          </div>
        ))}
      </div>
    </Win9xWindow>
  );
}

// EntryManager — generic admin CRUD for one entry corner, driven by
// CORNER_CONFIG.fields. Keyed on corner so it remounts (and reloads) on switch.
export default function EntryManager({
  corner,
}: {
  corner: string;
}): ReactElement {
  return (
    <AdminGate>
      <EntryManagerInner key={corner} corner={corner} />
    </AdminGate>
  );
}
