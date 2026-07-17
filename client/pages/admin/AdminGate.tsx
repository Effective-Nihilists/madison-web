import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { apiPost } from '../../api';
import Win9xWindow from '../../components/Win9xWindow';
import { Link } from '../../router';

// AdminGate — wraps every admin page. All admin routes are declared `auth: true`
// in shared/pages.ts, so the framework's per-route auth guard already surfaces
// the system login (the self-hosted <MagicLinkForm> in Mode B) for logged-out
// visitors before this component ever mounts. By the time AdminGate renders, the
// user is authenticated — we only need to check that they are the allow-listed
// admin (whoAmI().admin) and otherwise show a "not authorized" notice.
export default function AdminGate({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [admin, setAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const { admin: isAdmin } = await apiPost<{ admin: boolean }>(
          'whoAmI',
          {},
        );
        if (!active) return;
        setAdmin(isAdmin);
      } catch {
        if (active) setAdmin(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  if (admin === null) {
    return (
      <Win9xWindow title="admin.exe — checking…" bodyClassName="doc-body">
        <p className="note">verifying access…</p>
      </Win9xWindow>
    );
  }

  if (!admin) {
    return (
      <Win9xWindow title="admin.exe — Access Denied" bodyClassName="doc-body">
        <h1 className="article">Not authorized</h1>
        <p className="note">
          You are signed in, but this account is not on the admin allow-list.
          Only the site owner can access the CMS.
        </p>
        <Link to="" params={{}} className="tbtn" style={{ marginTop: 12 }}>
          ← back home
        </Link>
      </Win9xWindow>
    );
  }

  return <>{children}</>;
}
