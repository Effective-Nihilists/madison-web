import type { ReactElement } from 'react';

// ─── Scanlines ────────────────────────────────────────────────────────────────
// CRT scanline + flicker overlay ported from the v3-01 mock. Fixed, full-bleed,
// pointer-events:none so it never blocks clicks. Renders nothing when disabled.
export default function Scanlines({
  enabled,
}: {
  enabled: boolean;
}): ReactElement | null {
  if (!enabled) return null;
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <div className="crt-flicker" aria-hidden="true" />
    </>
  );
}
