import { useEffect, useState, type ReactElement } from 'react';
import { useShell } from './shellContext';

// ─── WidgetRail ───────────────────────────────────────────────────────────────
// Dense early-2000s widget column ported from the v3-01 mock: visitor counter,
// status/now-playing box (driven by the shell's nowPlaying), fake webring,
// 88x31 button wall (pure CSS gradient badges), and a tagboard teaser. The
// announcements marquee lives in the home content per the mock; here we keep
// the right-rail widgets.

interface Badge { t: string; a: string; b: string; }

const BADGES: Badge[] = [
  { t: '317010·xyz', a: '--mr-indigo', b: '--mr-purple' },
  { t: 'COSMOO\nFANCLUB', a: '--mr-orange', b: '--mr-red' },
  { t: 'TEA\nDRINKER', a: '--mr-green', b: '--mr-teal' },
  { t: 'NETSCAPE\nNOW', a: '--mr-blue', b: '--mr-cyan' },
  { t: 'NO AI ✦', a: '--mr-magenta', b: '--mr-pink' },
  { t: 'MADE BY\nHAND', a: '--mr-lime', b: '--mr-green' },
  { t: 'BEST IN\n1024×768', a: '--mr-teal', b: '--mr-blue' },
  { t: 'STAR\nGAZER', a: '--mr-purple', b: '--mr-indigo' },
  { t: 'WITCH\nCORNER', a: '--mr-purple', b: '--mr-magenta' },
  { t: '★ LINK\nME ★', a: '--mr-yellow', b: '--mr-orange' },
  { t: 'POWERED\nBY MOSS', a: '--mr-lime', b: '--mr-teal' },
  { t: 'CRT\nFOREVER', a: '--mr-cyan', b: '--mr-lilac' },
];

const WEBRING_SITES = [
  'mossgarden.neocities', 'tea-and-tarot.xyz', 'loaf-knight.cat',
  'dusty-rainbow.moe', 'jasmine.diary', 'cozy-corners.web',
];

function fmtVisitors(n: number): string {
  return `#${String(n).padStart(6, '0').replace(/(\d{3})(\d{3})/, '$1,$2')}`;
}

export default function WidgetRail({
  onCounterClick,
}: {
  onCounterClick?: () => void;
} = {}): ReactElement {
  const { nowPlaying, toast } = useShell();
  const [visitors, setVisitors] = useState(17010);
  const [wrIdx, setWrIdx] = useState(14);

  // slow visitor tick (web 1.0 charm)
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.3) setVisitors((v) => v + 1);
    }, 4000);
    return () => { clearInterval(id); };
  }, []);

  function goRing(d: number): void {
    const next = ((wrIdx + d) % 88 + 88) % 88;
    setWrIdx(next);
    const site = WEBRING_SITES[next % WEBRING_SITES.length];
    toast(`webring → ${site ?? '...'}`);
  }

  function bumpCounter(): void {
    setVisitors((v) => v + 1);
    if (onCounterClick) onCounterClick();
    else toast('✦ a passing cat');
  }

  return (
    <aside className="widget-rail">
      {/* visitor counter */}
      <div className="widget win">
        <div className="win-title"><span className="wt-label">counter.cgi</span><span className="win-btns"><b>×</b></span></div>
        <div className="win-body" style={{ textAlign: 'center' }}>
          <div className="wlabel">VISITORS</div>
          <div className="counter" style={{ margin: '6px 0 2px' }}>since 2003</div>
          <span className="num" title="...try clicking me" onClick={bumpCounter} role="button">{fmtVisitors(visitors)}</span>
        </div>
      </div>

      {/* status / now-playing */}
      <div className="widget win">
        <div className="win-title"><span className="wt-label">status.now</span><span className="win-btns"><b>×</b></span></div>
        <div className={`win-body statusbox${nowPlaying.playing ? '' : ' idle'}`}>
          <div className="row"><span className="k">mood:</span><span className="v">{nowPlaying.playing ? 'cosmic ✦ wired' : 'sleepy ✦ tea-brained'}</span></div>
          <div className="row"><span className="k">♪:</span><span className="v"><span className="mood-eq"><i /><i /><i /></span> <span>{nowPlaying.title}</span></span></div>
          <div className="row"><span className="k">cat:</span><span className="v">Cosmoo, loafing</span></div>
          <div className="row"><span className="k">tea:</span><span className="v">jasmine #4</span></div>
        </div>
      </div>

      {/* webring */}
      <div className="widget win webringbox">
        <div className="win-title"><span className="wt-label">webring.htm</span><span className="win-btns"><b>×</b></span></div>
        <div className="win-body">
          <div className="wr-row">
            <span className="wr-nav" role="button" onClick={() => { goRing(-1); }}>◄</span>
            <span className="wr-name mr-cycle">~ cozy corners webring ~</span>
            <span className="wr-nav" role="button" onClick={() => { goRing(1); }}>►</span>
          </div>
          <div className="wr-row" style={{ justifyContent: 'center' }}>
            <span className="wr-nav" role="button" onClick={() => { toast(`★ random hop → ${WEBRING_SITES[Math.floor(Math.random() * WEBRING_SITES.length)] ?? ''}`); }}>★ random site ★</span>
          </div>
          <div className="wr-row"><span className="wr-name" style={{ color: 'var(--text-soft)' }}>member #{String(wrIdx).padStart(3, '0')} of 88</span></div>
        </div>
      </div>

      {/* 88x31 button wall */}
      <div className="widget win">
        <div className="win-title"><span className="wt-label">buttons.gif</span><span className="win-btns"><b>×</b></span></div>
        <div className="win-body">
          <div className="btn-wall">
            {BADGES.map((bd, i) => (
              <div
                key={i}
                className="b8831"
                title="88×31 button"
                role="button"
                onClick={() => { toast(`☆ ${bd.t.replace(/\n/g, ' ')}`); }}
                style={{ background: `linear-gradient(135deg, var(${bd.a}) 0 48%, var(${bd.b}) 52% 100%)` }}
              >
                {bd.t.split('\n').map((line, j, arr) => (
                  <span key={j}>{line}{j < arr.length - 1 ? <br /> : null}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* tagboard teaser */}
      <div className="widget win tagboard">
        <div className="win-title"><span className="wt-label">tagboard.exe</span><span className="win-btns"><b>×</b></span></div>
        <div className="win-body">
          <div className="tb-msg"><span className="tb-who">griff»</span>love the new chaos!!</div>
          <div className="tb-msg"><span className="tb-who">nyx»</span>the scanlines are perfect</div>
          <div className="tb-msg"><span className="tb-who">mod»</span>pet the loaf knight for me</div>
          <button className="wr-nav" style={{ marginTop: 7, width: '100%' }} onClick={() => { toast('tagboard is read-only in this demo ✦'); }}>+ leave a tag</button>
        </div>
      </div>
    </aside>
  );
}
