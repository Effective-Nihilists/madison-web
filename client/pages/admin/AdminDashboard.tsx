import type { ReactElement } from 'react';
import Win9xWindow from '../../components/Win9xWindow';

// AdminDashboard — stub (Task 12 adds the admin gate + real dashboard links).
export default function AdminDashboard(): ReactElement {
  return (
    <Win9xWindow title="admin.exe — Dashboard" bodyClassName="doc-body">
      <h1>Admin</h1>
      <p className="note">coming soon — gate, dashboard, articles, comments, media.</p>
    </Win9xWindow>
  );
}
