import { useCallback, useEffect, useState, type ChangeEvent, type ReactElement } from 'react';
import { apiPost } from '../../api';
import Win9xWindow from '../../components/Win9xWindow';
import AdminGate from './AdminGate';
import { Link } from '../../router';
import { uploadMedia } from '../../admin/upload';
import { CORNERS, type ButtonImage, type MusicTrack } from '../../../shared/blog';

type TrackKind = 'wav' | 'mp4';

function MusicManager(): ReactElement {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [title, setTitle] = useState('');
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [pendingKind, setPendingKind] = useState<TrackKind>('wav');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { tracks: ts } = await apiPost<{ tracks: MusicTrack[] }>('listMusicTracks', {});
    setTracks(ts);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleFile(e: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isMp4 = /\.mp4$/i.test(file.name) || file.type.includes('mp4') || file.type.startsWith('video/');
    const kind: TrackKind = isMp4 ? 'mp4' : 'wav';
    setUploading(true);
    setError(null);
    try {
      const url = await uploadMedia(isMp4 ? 'video' : 'audio', file);
      setPendingUrl(url);
      setPendingKind(kind);
      if (!title.trim()) setTitle(file.name.replace(/\.(wav|mp4)$/i, ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleAdd(): Promise<void> {
    if (!pendingUrl || !title.trim()) {
      setError('upload a file and enter a title first');
      return;
    }
    await apiPost('addMusicTrack', { title: title.trim(), url: pendingUrl, kind: pendingKind });
    setTitle('');
    setPendingUrl(null);
    await refresh();
  }

  async function handleDelete(id: string): Promise<void> {
    await apiPost('deleteMusicTrack', { id });
    await refresh();
  }

  return (
    <Win9xWindow title="music.exe — Tracks" className="article-win" bodyClassName="doc-body">
      <h2 style={{ fontFamily: 'var(--orn-font)', marginTop: 0 }}>Music tracks</h2>
      {error && (
        <p className="note" style={{ color: 'crimson' }}>
          {error}
        </p>
      )}
      <div className="cform">
        <label className="note">upload .wav / .mp4</label>
        <input type="file" accept=".wav,.mp4,audio/*,video/mp4" onChange={(e) => void handleFile(e)} disabled={uploading} />
        {uploading && <p className="note">uploading…</p>}
        {pendingUrl && <p className="note">uploaded ({pendingKind}) — add a title and save.</p>}
        <input type="text" placeholder="track title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="tbtn" type="button" onClick={() => void handleAdd()} disabled={!pendingUrl}>
          add track
        </button>
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tracks.length === 0 && <p className="note">no tracks yet.</p>}
        {tracks.map((t) => (
          <div key={t._id} className="cmt" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{t.title}</div>
              <div className="note">{t.kind}</div>
            </div>
            <button className="tbtn" type="button" onClick={() => void handleDelete(t._id)}>
              delete
            </button>
          </div>
        ))}
      </div>
    </Win9xWindow>
  );
}

function ButtonImageManager(): ReactElement {
  const [images, setImages] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { images: imgs } = await apiPost<{ images: ButtonImage[] }>('listButtonImages', {});
    const map: Record<string, string> = {};
    for (const img of imgs) map[img.key] = img.url;
    setImages(map);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleFile(key: string, e: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusyKey(key);
    setError(null);
    try {
      const url = await uploadMedia('image', file);
      await apiPost('setButtonImage', { key, url });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <Win9xWindow title="buttons.exe — Corner Images" className="article-win" bodyClassName="doc-body">
      <h2 style={{ fontFamily: 'var(--orn-font)', marginTop: 0 }}>Corner button images</h2>
      {error && (
        <p className="note" style={{ color: 'crimson' }}>
          {error}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {CORNERS.map((c) => (
          <div key={c.key} className="cmt" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {images[c.key] ? (
              <img
                src={images[c.key]}
                alt={c.label}
                style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--panel-edge)' }}
              />
            ) : (
              <div
                style={{ width: 56, height: 42, borderRadius: 6, border: '2px dashed var(--panel-edge)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-soft)' }}
              >
                none
              </div>
            )}
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontWeight: 700 }}>{c.label}</div>
              <div className="note">{c.key}</div>
            </div>
            <input type="file" accept="image/*" onChange={(e) => void handleFile(c.key, e)} disabled={busyKey === c.key} />
            {busyKey === c.key && <span className="note">uploading…</span>}
          </div>
        ))}
      </div>
    </Win9xWindow>
  );
}

// MediaMusicPage — music upload/list/delete + corner button-image manager (Task 14).
export default function MediaMusicPage(): ReactElement {
  return (
    <AdminGate>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h1 className="article" style={{ flex: 1, margin: 0 }}>
          Media &amp; Music
        </h1>
        <Link to="admin" params={{}} className="tbtn">
          ← dashboard
        </Link>
      </div>
      <MusicManager />
      <ButtonImageManager />
    </AdminGate>
  );
}
