import { useEffect, type ReactElement } from 'react';
import Win9xWindow from '../../components/Win9xWindow';
import { useRouter } from '../../router';

// AdminRedirect — the old `/admin` dashboard overview was removed when the CMS
// merged into the unified edit-mode bar. This keeps the `admin` route alive
// (old bookmarks/links) by redirecting to the Articles manager.
export default function AdminRedirect(): ReactElement {
  const router = useRouter();
  useEffect(() => {
    router.push('admin/articles', {});
  }, [router]);

  return (
    <Win9xWindow title="admin.exe — redirecting…" bodyClassName="doc-body">
      <p className="note">opening the editor…</p>
    </Win9xWindow>
  );
}
