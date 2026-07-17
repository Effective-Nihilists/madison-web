import type { CSSProperties, ReactNode, ReactElement } from 'react';

// ─── Win9xWindow ──────────────────────────────────────────────────────────────
// Reusable beveled Win9x-style panel: a title bar (label + pixel _ □ × buttons)
// over a body. Ported from the `.win` chrome in the v3-01 mock. The pixel
// buttons are decorative by default (purely cosmetic chrome); pass `onClose`
// to wire the × button.
export default function Win9xWindow({
  title,
  children,
  className,
  style,
  bodyClassName,
  bodyStyle,
  buttons = '_□×',
  onClose,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  bodyClassName?: string;
  bodyStyle?: CSSProperties;
  /** Which pixel buttons to render, in order. Default `_□×`. */
  buttons?: string;
  onClose?: () => void;
}): ReactElement {
  const chars = buttons.split('');
  return (
    <div className={`win${className ? ` ${className}` : ''}`} style={style}>
      <div className="win-title">
        <span className="wt-label">{title}</span>
        <span className="win-btns">
          {chars.map((c, i) => (
            <b
              key={`${c}-${i}`}
              onClick={c === '×' && onClose ? onClose : undefined}
              role={c === '×' && onClose ? 'button' : undefined}
              aria-label={c === '×' && onClose ? 'close' : undefined}
              data-id="b"
            >
              {c}
            </b>
          ))}
        </span>
      </div>
      <div
        className={`win-body${bodyClassName ? ` ${bodyClassName}` : ''}`}
        style={bodyStyle}
      >
        {children}
      </div>
    </div>
  );
}
