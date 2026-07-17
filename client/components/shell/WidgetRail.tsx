import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { apiPost } from '../../api';
import type { ButtonLink } from '../../../shared/blog';
import { useShell } from './shellContext';
import AnimateIn from '../AnimateIn';
import Editable from './Editable';
import EditLink from './EditLink';
import { useSiteConfig, applyOrder } from './siteConfigContext';
import { useDragReorder, type DragItemProps } from './useDragReorder';

// ─── WidgetRail ───────────────────────────────────────────────────────────────
// Dense early-2000s widget column ported from the v3-01 mock: a REAL DB-backed
// visitor counter, status/now-playing box, fake webring, 88x31 button wall, and
// a tagboard teaser. In admin edit mode each widget box becomes drag-to-reorder
// (persisted as widgetOrder) and resizable (persisted as boxSizes).

const VISIT_SESSION_KEY = 'madison-visit-counted';

const WEBRING_SITES = [
  'mossgarden.neocities',
  'tea-and-tarot.xyz',
  'loaf-knight.cat',
  'dusty-rainbow.moe',
  'jasmine.diary',
  'cozy-corners.web',
];

function fmtVisitors(n: number): string {
  return `#${String(n)
    .padStart(6, '0')
    .replace(/(\d{3})(\d{3})/, '$1,$2')}`;
}

// A draggable + resizable widget shell. Accepts `style` so AnimateIn can inject
// its entrance animation via cloneElement.
function WidgetBox({
  id,
  className,
  editMode,
  dragProps,
  height,
  onResize,
  children,
  style,
}: {
  id: string;
  className?: string;
  editMode: boolean;
  dragProps?: DragItemProps;
  height: number | null;
  onResize: (h: number) => void;
  children: ReactNode;
  style?: CSSProperties;
}): ReactElement {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const start = useRef<{ y: number; h: number } | null>(null);
  const [liveH, setLiveH] = useState<number | null>(height);

  useEffect(() => {
    setLiveH(height);
  }, [height]);

  function onPointerMove(e: PointerEvent): void {
    if (!start.current) return;
    setLiveH(Math.max(80, start.current.h + (e.clientY - start.current.y)));
  }
  function onPointerUp(): void {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    if (liveH !== null) onResize(Math.round(liveH));
    start.current = null;
  }
  function onHandleDown(e: React.PointerEvent): void {
    e.preventDefault();
    e.stopPropagation();
    const h = boxRef.current?.getBoundingClientRect().height ?? 120;
    start.current = { y: e.clientY, h };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  const sized: CSSProperties =
    liveH !== null ? { height: liveH, overflow: 'auto' } : {};

  return (
    <div
      ref={boxRef}
      className={`widget win${className ? ` ${className}` : ''}${editMode ? ' editing' : ''}`}
      draggable={editMode}
      data-widget-id={id}
      {...(editMode ? dragProps : {})}
      style={{ ...style, ...sized, position: 'relative' }}
    >
      {children}
      {editMode && (
        <div
          className="widget-resize"
          title="drag to resize"
          onPointerDown={onHandleDown}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default function WidgetRail({
  onCounterClick,
}: {
  onCounterClick?: () => void;
} = {}): ReactElement {
  const { nowPlaying, toast } = useShell();
  const { config, editMode, save } = useSiteConfig();
  const [visitors, setVisitors] = useState<number | null>(null);
  const [wrIdx, setWrIdx] = useState(14);
  const [buttons, setButtons] = useState<ButtonLink[]>([]);

  // Load the admin-managed 88×31 button wall once.
  useEffect(() => {
    let alive = true;
    void apiPost<{ buttons: ButtonLink[] }>('listButtonLinks', {})
      .then((res) => {
        if (alive)
          setButtons(res.buttons.slice().sort((a, b) => a.order - b.order));
      })
      .catch(() => {
        /* offline / none */
      });
    return () => {
      alive = false;
    };
  }, []);

  // Real DB-backed visitor counter: count this browser session once, then show
  // the live total.
  useEffect(() => {
    let alive = true;
    const apply = (count: number): void => {
      if (alive) setVisitors(count);
    };
    const already = sessionStorage.getItem(VISIT_SESSION_KEY);
    // Count this session once; otherwise just read the live total. Offline →
    // leave the counter blank rather than show a fake number.
    if (already) {
      void apiPost<{ count: number }>('getVisitCount', {})
        .then((r) => {
          apply(r.count);
        })
        .catch(() => {
          /* offline */
        });
    } else {
      sessionStorage.setItem(VISIT_SESSION_KEY, '1');
      void apiPost<{ count: number }>('recordVisit', {})
        .then((r) => {
          apply(r.count);
        })
        .catch(() => {
          /* offline */
        });
    }
    return () => {
      alive = false;
    };
  }, []);

  function goRing(d: number): void {
    const next = (((wrIdx + d) % 88) + 88) % 88;
    setWrIdx(next);
    const site = WEBRING_SITES[next % WEBRING_SITES.length];
    toast(`webring → ${site ?? '...'}`);
  }

  // Clicking the counter is just flavor now — it no longer inflates the real total.
  function bumpCounter(): void {
    if (onCounterClick) onCounterClick();
    else toast('✦ a passing cat');
  }

  const widgets: { id: string; className?: string; render: () => ReactNode }[] =
    [
      {
        id: 'counter',
        render: () => (
          <>
            <div className="win-title">
              <span className="wt-label">counter.cgi</span>
              <span className="win-btns">
                <b>×</b>
              </span>
            </div>
            <div className="win-body" style={{ textAlign: 'center' }}>
              <Editable as="div" id="widget.counter.label" className="wlabel">
                VISITORS
              </Editable>
              <Editable as="div" id="widget.counter.sub" className="counter">
                since 2003
              </Editable>
              <span
                className="num"
                title="...try clicking me"
                onClick={bumpCounter}
                role="button"
                data-id="bump-counter"
              >
                {visitors === null ? '#······' : fmtVisitors(visitors)}
              </span>
            </div>
          </>
        ),
      },
      {
        id: 'status',
        render: () => (
          <>
            <div className="win-title">
              <span className="wt-label">status.now</span>
              <span className="win-btns">
                <b>×</b>
              </span>
            </div>
            <div
              className={`win-body statusbox${nowPlaying.playing ? '' : ' idle'}`}
            >
              <div className="row">
                <span className="k">mood:</span>
                <span className="v">
                  {nowPlaying.playing
                    ? 'cosmic ✦ wired'
                    : 'sleepy ✦ tea-brained'}
                </span>
              </div>
              <div className="row">
                <span className="k">♪:</span>
                <span className="v">
                  <span className="mood-eq">
                    <i />
                    <i />
                    <i />
                  </span>{' '}
                  <span>{nowPlaying.title}</span>
                </span>
              </div>
              <div className="row">
                <span className="k">cat:</span>
                <span className="v">Cosmoo, loafing</span>
              </div>
              <div className="row">
                <span className="k">tea:</span>
                <span className="v">jasmine #4</span>
              </div>
            </div>
          </>
        ),
      },
      {
        id: 'webring',
        className: 'webringbox',
        render: () => (
          <>
            <div className="win-title">
              <span className="wt-label">webring.htm</span>
              <span className="win-btns">
                <b>×</b>
              </span>
            </div>
            <div className="win-body">
              <div className="wr-row">
                <span
                  className="wr-nav"
                  role="button"
                  onClick={() => {
                    goRing(-1);
                  }}
                  data-id="span"
                >
                  ◄
                </span>
                <Editable
                  as="span"
                  id="widget.webring.title"
                  className="wr-name mr-cycle"
                >
                  ~ cozy corners webring ~
                </Editable>
                <span
                  className="wr-nav"
                  role="button"
                  onClick={() => {
                    goRing(1);
                  }}
                  data-id="span-2"
                >
                  ►
                </span>
              </div>
              <div className="wr-row" style={{ justifyContent: 'center' }}>
                <span
                  className="wr-nav"
                  role="button"
                  onClick={() => {
                    toast(
                      `★ random hop → ${WEBRING_SITES[Math.floor(Math.random() * WEBRING_SITES.length)] ?? ''}`,
                    );
                  }}
                  data-id="random-site"
                >
                  ★ random site ★
                </span>
              </div>
              <div className="wr-row">
                <span className="wr-name" style={{ color: 'var(--text-soft)' }}>
                  member #{String(wrIdx).padStart(3, '0')} of 88
                </span>
              </div>
            </div>
          </>
        ),
      },
      {
        id: 'buttons',
        render: () => (
          <>
            <div className="win-title">
              <span className="wt-label">buttons.gif</span>
              <span className="win-btns">
                <b>×</b>
              </span>
            </div>
            <div className="win-body">
              {buttons.length > 0 ? (
                <div className="btn-wall">
                  {buttons.map((b) => (
                    <a
                      key={b._id}
                      className="b8831-link"
                      href={b.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={b.title || b.linkUrl}
                      data-id="a"
                    >
                      <img
                        className="b8831-img"
                        src={b.imageUrl}
                        alt={b.title || 'button'}
                        width={88}
                        height={31}
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="note">no buttons yet.</div>
              )}
              <div style={{ marginTop: 8 }}>
                <EditLink to="admin/media" params={{}} label="manage buttons" />
              </div>
            </div>
          </>
        ),
      },
      {
        id: 'tagboard',
        className: 'tagboard',
        render: () => (
          <>
            <div className="win-title">
              <span className="wt-label">tagboard.exe</span>
              <span className="win-btns">
                <b>×</b>
              </span>
            </div>
            <div className="win-body">
              <div className="tb-msg">
                <span className="tb-who">griff»</span>love the new chaos!!
              </div>
              <div className="tb-msg">
                <span className="tb-who">nyx»</span>the scanlines are perfect
              </div>
              <div className="tb-msg">
                <span className="tb-who">mod»</span>pet the loaf knight for me
              </div>
              <button
                className="wr-nav"
                style={{ marginTop: 7, width: '100%' }}
                onClick={() => {
                  toast('tagboard is read-only in this demo ✦');
                }}
                data-id="leave-a-tag"
              >
                + leave a tag
              </button>
            </div>
          </>
        ),
      },
    ];

  const ordered = applyOrder(widgets, config.widgetOrder, (w) => w.id);
  const { itemProps } = useDragReorder(
    ordered.map((w) => w.id),
    (next) => {
      save({ widgetOrder: next });
    },
  );

  return (
    <aside className="widget-rail">
      {ordered.map((w) => (
        <AnimateIn key={w.id}>
          <WidgetBox
            id={w.id}
            className={w.className ?? ''}
            editMode={editMode}
            dragProps={itemProps(w.id)}
            height={config.boxSizes[w.id]?.h ?? null}
            onResize={(h) => {
              save({
                boxSizes: { ...config.boxSizes, [w.id]: { w: null, h } },
              });
            }}
          >
            {w.render()}
          </WidgetBox>
        </AnimateIn>
      ))}
    </aside>
  );
}
