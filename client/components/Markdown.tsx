import { useEffect, useRef, useState, type ReactElement } from 'react';
import { MarkdownViewer } from 'ugly-app/markdown/client';

// Markdown — renders article body markdown via the framework's MarkdownViewer
// (mdast-based: GFM tables/lists, headings, blockquotes, images, code, math).
// The viewer parses + renders to React elements (no dangerouslySetInnerHTML of
// raw input), so it's safe for admin-authored content. It requires a numeric
// `width` (used to size images / compute crop), so we measure the container.
// Article body styling (headings, blockquote, images) comes from the `.article`
// / `.doc-body` rules in madison.css; wrap the output in `.article` so those
// apply.
export default function Markdown({ source }: { source: string }): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(680);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = (): void => {
      const w = el.clientWidth;
      if (w > 0) setWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { ro.disconnect(); };
  }, []);

  return (
    <div className="article" ref={ref}>
      <MarkdownViewer markdown={source} width={width} />
    </div>
  );
}
