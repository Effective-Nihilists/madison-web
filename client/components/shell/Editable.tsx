import { useRef, type ReactElement } from 'react';
import { useSiteConfig } from './siteConfigContext';

// ─── Editable ─────────────────────────────────────────────────────────────────
// Inline-editable text. Shows the saved override (or the fallback children) for
// everyone; when an admin is in edit mode it becomes contentEditable and saves
// the new text (keyed by a stable `id`) to the global site config on blur.
//
// `as` picks the rendered tag so it can wrap headings/spans without changing
// layout. Editing UI is admin+editMode only — visitors just see the text.

export default function Editable({
  id,
  children,
  as = 'span',
  className,
}: {
  id: string;
  /** Fallback text when there's no override. */
  children: string;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
}): ReactElement {
  const { admin, editMode, text, setText } = useSiteConfig();
  const ref = useRef<HTMLElement | null>(null);
  const value = text(id, children);
  const Tag = as;

  if (!(admin && editMode)) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      ref={ref as never}
      className={className}
      contentEditable
      suppressContentEditableWarning
      data-editable-id={id}
      style={{
        outline: '1px dashed var(--accent)',
        outlineOffset: 2,
        cursor: 'text',
        borderRadius: 3,
      }}
      onBlur={(e) => {
        setText(id, e.currentTarget.textContent, children);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}
