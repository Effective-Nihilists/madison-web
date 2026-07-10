import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { apiPost } from '../../api';
import Win9xWindow from '../../components/Win9xWindow';
import AdminGate from './AdminGate';
import { Link } from '../../router';
import type { Wheel } from '../../../shared/wheel';

const inputStyle = {
  width: '100%',
  padding: '9px 11px',
  margin: '6px 0',
  border: '2px solid var(--panel-edge)',
  borderRadius: 9,
  background: 'var(--surface-solid)',
  color: 'var(--text)',
  fontFamily: 'inherit',
} as const;

interface FormState {
  id?: string;
  name: string;
  slices: string; // one slice per line
  order: string;
}

function blankForm(): FormState {
  return { name: '', slices: '', order: '0' };
}

function parseSlices(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function WheelManagerInner(): ReactElement {
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<FormState>(() => blankForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { wheels: list } = await apiPost<{ wheels: Wheel[] }>('listWheels', {});
    setWheels(list);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function resetForm(): void {
    setForm(blankForm());
    setError(null);
  }

  function loadIntoForm(w: Wheel): void {
    setForm({ id: w._id, name: w.name, slices: w.slices.join('\n'), order: String(w.order) });
    setError(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSave(): Promise<void> {
    const name = form.name.trim();
    const slices = parseSlices(form.slices);
    if (!name) {
      setError('name is required');
      return;
    }
    if (slices.length < 2) {
      setError('add at least two slices (one per line)');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiPost<{ id: string }>('saveWheel', {
        ...(form.id ? { id: form.id } : {}),
        name,
        slices,
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
    if (!window.confirm('Delete this wheel? This cannot be undone.')) return;
    await apiPost('deleteWheel', { id });
    if (form.id === id) resetForm();
    await refresh();
  }

  return (
    <Win9xWindow title="wheels.exe — Admin" bodyClassName="doc-body">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="article" style={{ flex: 1, margin: 0 }}>
          Wheels of Fortune
        </h1>
        <Link to="admin" params={{}} className="tbtn">
          ← dashboard
        </Link>
      </div>
      <p className="note" style={{ marginTop: 6 }}>
        Custom wheels appear on the public Wheel of Fortune alongside the built-in presets.
        One slice per line (two or more).
      </p>

      {error && (
        <p className="note" style={{ color: 'crimson', marginTop: 8 }}>
          {error}
        </p>
      )}

      {/* Editor */}
      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ margin: '.1em 0 .4em', fontFamily: 'var(--orn-font)' }}>
          {form.id ? 'Edit wheel' : 'New wheel'}
        </h2>
        <label className="note">name</label>
        <input
          style={inputStyle}
          value={form.name}
          placeholder="e.g. What's for dinner?"
          onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); }} data-id="e-g-whats-for"
        />
        <label className="note">slices (one per line)</label>
        <textarea
          style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
          value={form.slices}
          placeholder={'pizza\ntacos\nsushi\npasta'}
          onChange={(e) => { setForm((f) => ({ ...f, slices: e.target.value })); }} data-id="pizza-tacos-sushi-pasta"
        />
        <label className="note">order</label>
        <input
          style={inputStyle}
          type="number"
          value={form.order}
          onChange={(e) => { setForm((f) => ({ ...f, order: e.target.value })); }} data-id="input"
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" className="tbtn" onClick={() => void handleSave()} disabled={saving} data-id="button">
            {saving ? 'saving…' : form.id ? 'save changes' : 'add wheel'}
          </button>
          {form.id && (
            <button type="button" className="tbtn" onClick={resetForm} disabled={saving} data-id="cancel">
              cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <h2 style={{ fontFamily: 'var(--orn-font)', marginTop: 24 }}>Saved wheels</h2>
      {!loaded && <p className="note">loading…</p>}
      {loaded && wheels.length === 0 && (
        <p className="note">no custom wheels yet — add one above.</p>
      )}
      {wheels.length > 0 && (
        <div className="highlight-grid" style={{ gridTemplateColumns: '1fr', gap: 10, marginTop: 8 }}>
          {wheels.map((w) => (
            <div key={w._id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h3 style={{ flex: 1, margin: 0, fontFamily: 'var(--orn-font)' }}>{w.name}</h3>
                <button type="button" className="tbtn" onClick={() => { loadIntoForm(w); }} data-id="edit">
                  edit
                </button>
                <button type="button" className="tbtn" onClick={() => void handleDelete(w._id)} data-id="delete">
                  delete
                </button>
              </div>
              <p className="note" style={{ margin: '.4em 0 0' }}>
                {w.slices.length} slices · {w.slices.join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </Win9xWindow>
  );
}

export default function WheelManager(): ReactElement {
  return (
    <AdminGate>
      <WheelManagerInner />
    </AdminGate>
  );
}
