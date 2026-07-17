import { useRef, type DragEvent } from 'react';

// ─── useDragReorder ───────────────────────────────────────────────────────────
// Minimal HTML5 drag-and-drop list reordering (no dependency). `ids` is the
// CURRENT rendered order; `onReorder` receives the full new order to persist.
// Returns per-item props to spread onto each draggable row.

export interface DragItemProps {
  draggable: true;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragEnd: () => void;
}

export function useDragReorder(
  ids: string[],
  onReorder: (next: string[]) => void,
): { itemProps: (id: string) => DragItemProps } {
  const dragId = useRef<string | null>(null);

  function itemProps(id: string): DragItemProps {
    return {
      draggable: true,
      onDragStart: (e: DragEvent) => {
        dragId.current = id;
        e.dataTransfer.effectAllowed = 'move';
        // Firefox requires data to be set for drag to start.
        try {
          e.dataTransfer.setData('text/plain', id);
        } catch {
          /* ignore */
        }
      },
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        const from = dragId.current;
        dragId.current = null;
        if (!from || from === id) return;
        const next = ids.slice();
        const fi = next.indexOf(from);
        const ti = next.indexOf(id);
        if (fi < 0 || ti < 0) return;
        next.splice(fi, 1);
        next.splice(ti, 0, from);
        onReorder(next);
      },
      onDragEnd: () => {
        dragId.current = null;
      },
    };
  }

  return { itemProps };
}
