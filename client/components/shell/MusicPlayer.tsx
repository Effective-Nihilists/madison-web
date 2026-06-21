import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
} from 'react';
import { apiPost } from '../../api';
import type { MusicTrack } from '../../../shared/blog';
import type { MilkdropHandle } from './MilkdropBackground';
import { useShell } from './shellContext';

// ─── MusicPlayer ──────────────────────────────────────────────────────────────
// Floating bottom-left Win9x player ported from the v3-01 mock. Loads real
// tracks via listMusicTracks() and plays them through a hidden <audio> (.wav)
// or <video> (.mp4) element, piping its MediaElementSource into the Milkdrop
// viz (via the shared MilkdropHandle) so the visualizer reacts to the real
// track. When there are no tracks it falls back to the mock's ambient synth
// (ramping the Milkdrop synth gain). Now-playing is published to the shell
// context so the widget rail's status box can show it.

const SYNTH_LABELS = ['moss & static', 'parchment dreams', 'aubergine night', 'the dreaming mind'];

export default function MusicPlayer({
  milkdrop,
}: {
  milkdrop: RefObject<MilkdropHandle | null>;
}): ReactElement {
  const { setNowPlaying, toast } = useShell();

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [closed, setClosed] = useState(false);
  const [vol, setVol] = useState(45);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load real tracks once.
  useEffect(() => {
    let alive = true;
    void apiPost<{ tracks: MusicTrack[] }>('listMusicTracks', {}).then((res) => {
      if (alive) setTracks(res.tracks.slice().sort((a, b) => a.order - b.order));
    }).catch(() => { /* no tracks / offline — ambient synth fallback */ });
    return () => { alive = false; };
  }, []);

  const current = tracks[idx];
  const hasTracks = tracks.length > 0;
  const trackLabel = current
    ? current.title
    : (SYNTH_LABELS[idx % SYNTH_LABELS.length] ?? 'ambient');

  // Pick the media element for the current track kind.
  function mediaEl(): HTMLMediaElement | null {
    if (!current) return null;
    return current.kind === 'mp4' ? videoRef.current : audioRef.current;
  }

  // Publish now-playing whenever it changes.
  useEffect(() => {
    setNowPlaying({ title: playing ? trackLabel : '— silence —', playing });
  }, [playing, trackLabel, setNowPlaying]);

  function play(): void {
    milkdrop.current?.resume();
    setPlaying(true);
    if (hasTracks) {
      const el = mediaEl();
      if (el) {
        milkdrop.current?.connectTrackAudio(el);
        el.volume = vol / 100;
        void el.play().catch(() => { /* autoplay/gesture guard */ });
      }
    } else {
      // ambient synth: ramp the Milkdrop synth gain up
      const ctx = milkdrop.current?.getAudioContext();
      const gain = milkdrop.current?.getSynthGain();
      if (ctx && gain) gain.gain.setTargetAtTime(vol / 100, ctx.currentTime, 0.2);
    }
  }

  function pause(): void {
    setPlaying(false);
    if (hasTracks) {
      mediaEl()?.pause();
    } else {
      const ctx = milkdrop.current?.getAudioContext();
      const gain = milkdrop.current?.getSynthGain();
      if (ctx && gain) gain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    }
  }

  function step(dir: number): void {
    const count = hasTracks ? tracks.length : SYNTH_LABELS.length;
    const next = ((idx + dir) % count + count) % count;
    // stop current media if switching
    if (hasTracks && playing) mediaEl()?.pause();
    setIdx(next);
    milkdrop.current?.loadRandomPreset();
    toast(`track: ${tracks[next]?.title ?? SYNTH_LABELS[next % SYNTH_LABELS.length] ?? 'ambient'}`);
  }

  function onVol(v: number): void {
    setVol(v);
    if (hasTracks) {
      const el = mediaEl();
      if (el) el.volume = v / 100;
    } else if (playing) {
      const ctx = milkdrop.current?.getAudioContext();
      const gain = milkdrop.current?.getSynthGain();
      if (ctx && gain) gain.gain.setTargetAtTime(v / 100, ctx.currentTime, 0.1);
    }
  }

  // When the audio/video element ends, advance.
  useEffect(() => {
    const el = mediaEl();
    if (!el) return;
    const onEnded = (): void => { step(1); };
    el.addEventListener('ended', onEnded);
    return () => { el.removeEventListener('ended', onEnded); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, tracks]);

  if (closed) {
    return (
      <button
        className="reopen-tab"
        aria-label="reopen player"
        onClick={() => { setClosed(false); }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`player${playing ? '' : ' paused'}`}>
      {/* hidden media elements driving real-track playback + viz */}
      <audio ref={audioRef} src={current?.kind === 'wav' ? current.url : undefined} preload="none" crossOrigin="anonymous" />
      <video ref={videoRef} src={current?.kind === 'mp4' ? current.url : undefined} preload="none" crossOrigin="anonymous" style={{ display: 'none' }} />

      <div className="ptop">
        <span className="ptitle">♪ winamp.exe — now playing</span>
        <button className="win-x" aria-label="close player" onClick={() => { setClosed(true); }}>×</button>
      </div>
      <div className="pbody">
        <div className="now">
          <span className="eq"><i /><i /><i /></span>
          <span>{playing ? trackLabel : `— ${trackLabel} —`}</span>
        </div>
        <div className="transport">
          <button className="icon-btn" aria-label="prev" onClick={() => { step(-1); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14l-11-7z" /></svg>
          </button>
          <button className="icon-btn" aria-label={playing ? 'pause' : 'play'} onClick={() => { if (playing) pause(); else play(); }}>
            {playing
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z" /></svg>}
          </button>
          <button className="icon-btn" aria-label="next" onClick={() => { step(1); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5l11 7-11 7z" /></svg>
          </button>
        </div>
        <div className="vol-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9v6h4l5 4V5L7 9zM16 8a5 5 0 0 1 0 8" /></svg>
          <input type="range" min={0} max={100} value={vol} onChange={(e) => { onVol(Number(e.target.value)); }} aria-label="volume" />
        </div>
        {!hasTracks && (
          <div className="note">no tracks yet — playing the ambient synth. add tracks in the CMS.</div>
        )}
      </div>
    </div>
  );
}
