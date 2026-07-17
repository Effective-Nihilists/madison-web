import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
} from 'react';
import { apiPost } from '../../api';
import type { MusicTrack } from '../../../shared/blog';
import type { FractalHandle } from './FractalBackground';
import { useShell } from './shellContext';
import EditLink from './EditLink';

// ─── MusicPlayer ──────────────────────────────────────────────────────────────
// Floating bottom-left Win9x player. Loads real tracks via listMusicTracks() and
// plays them through a hidden <audio> (.mp3/.wav) or <video> (.mp4) element. When
// there are no tracks it shows an empty state (no fake/placeholder songs).
// Now-playing is published to the shell context so the widget rail's status box
// can show it. The optional `milkdrop` handle (if a reactive visualizer is
// mounted) is pinged on play so the viz reacts to the real track; it is a no-op
// when the background is the standalone fractal renderer.

export default function MusicPlayer({
  milkdrop,
}: {
  milkdrop?: RefObject<FractalHandle | null>;
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
    void apiPost<{ tracks: MusicTrack[] }>('listMusicTracks', {})
      .then((res) => {
        if (alive)
          setTracks(res.tracks.slice().sort((a, b) => a.order - b.order));
      })
      .catch(() => {
        /* no tracks / offline */
      });
    return () => {
      alive = false;
    };
  }, []);

  const current = tracks[idx];
  const hasTracks = tracks.length > 0;
  const trackLabel = current?.title ?? '— no tracks —';

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
    if (!hasTracks) return;
    milkdrop?.current?.resume();
    setPlaying(true);
    const el = mediaEl();
    if (el) {
      milkdrop?.current?.connectTrackAudio(el);
      el.volume = vol / 100;
      void el.play().catch(() => {
        /* autoplay/gesture guard */
      });
    }
  }

  function pause(): void {
    setPlaying(false);
    mediaEl()?.pause();
  }

  function step(dir: number): void {
    if (!hasTracks) return;
    const count = tracks.length;
    const next = (((idx + dir) % count) + count) % count;
    if (playing) mediaEl()?.pause();
    setIdx(next);
    toast(`track: ${tracks[next]?.title ?? 'unknown'}`);
  }

  function onVol(v: number): void {
    setVol(v);
    const el = mediaEl();
    if (el) el.volume = v / 100;
  }

  // When the audio/video element ends, advance.
  useEffect(() => {
    const el = mediaEl();
    if (!el) return;
    const onEnded = (): void => {
      step(1);
    };
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('ended', onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, tracks]);

  if (closed) {
    return (
      <button
        className="reopen-tab"
        aria-label="reopen player"
        onClick={() => {
          setClosed(false);
        }}
        data-id="reopen-player"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`player${playing ? '' : ' paused'}`}>
      {/* hidden media elements driving real-track playback */}
      <audio
        ref={audioRef}
        src={current && current.kind !== 'mp4' ? current.url : undefined}
        preload="none"
        crossOrigin="anonymous"
      />
      <video
        ref={videoRef}
        src={current?.kind === 'mp4' ? current.url : undefined}
        preload="none"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />

      <div className="ptop">
        <span className="ptitle">♪ winamp.exe — now playing</span>
        <button
          className="win-x"
          aria-label="close player"
          onClick={() => {
            setClosed(true);
          }}
          data-id="close-player"
        >
          ×
        </button>
      </div>
      <div className="pbody">
        <div className="now">
          <span className="eq">
            <i />
            <i />
            <i />
          </span>
          <span>{playing ? trackLabel : `— ${trackLabel} —`}</span>
        </div>
        <div className="transport">
          <button
            className="icon-btn"
            aria-label="prev"
            onClick={() => {
              step(-1);
            }}
            disabled={!hasTracks}
            data-id="prev"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h2v14H6zM20 5v14l-11-7z" />
            </svg>
          </button>
          <button
            className="icon-btn"
            aria-label={playing ? 'pause' : 'play'}
            onClick={() => {
              if (playing) pause();
              else play();
            }}
            disabled={!hasTracks}
            data-id="button"
          >
            {playing ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 5v14l12-7z" />
              </svg>
            )}
          </button>
          <button
            className="icon-btn"
            aria-label="next"
            onClick={() => {
              step(1);
            }}
            disabled={!hasTracks}
            data-id="next"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 5h2v14h-2zM4 5l11 7-11 7z" />
            </svg>
          </button>
        </div>
        <div className="vol-row">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 9v6h4l5 4V5L7 9zM16 8a5 5 0 0 1 0 8" />
          </svg>
          <input
            type="range"
            min={0}
            max={100}
            value={vol}
            onChange={(e) => {
              onVol(Number(e.target.value));
            }}
            aria-label="volume"
            data-id="volume"
          />
        </div>
        {!hasTracks && (
          <div className="note">no tracks yet — add some in the CMS.</div>
        )}
        <div style={{ marginTop: 6 }}>
          <EditLink to="admin/media" params={{}} label="manage tracks" />
        </div>
      </div>
    </div>
  );
}
