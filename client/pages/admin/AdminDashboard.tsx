import type { ReactElement } from 'react';
import Win9xWindow from '../../components/Win9xWindow';
import AdminGate from './AdminGate';
import { Link } from '../../router';
import { CORNERS } from '../../../shared/blog';
import { ENTRY_CORNER_KEYS, ENTRY_CORNER_LABELS } from '../../../shared/entries';

// AdminDashboard — links to the CMS managers (Task 12). Wrapped in AdminGate so
// only the allow-listed admin can see it.
export default function AdminDashboard(): ReactElement {
  return (
    <AdminGate>
      <Win9xWindow title="admin.exe — Dashboard" bodyClassName="doc-body">
        <h1 className="article">Admin</h1>
        <p className="note">manage articles, comments, music and corner buttons.</p>
        <div
          className="highlight-grid"
          style={{ gridTemplateColumns: '1fr', gap: 12, marginTop: 16 }}
        >
          <Link to="admin/articles" params={{}} className="card" style={{ display: 'block', marginBottom: 0, textDecoration: 'none' }}>
            <h2 style={{ margin: '.1em 0', fontFamily: 'var(--orn-font)' }}>Articles</h2>
            <p className="note">write, edit, publish and delete blog posts.</p>
          </Link>
          <Link to="admin/comments" params={{}} className="card" style={{ display: 'block', marginBottom: 0, textDecoration: 'none' }}>
            <h2 style={{ margin: '.1em 0', fontFamily: 'var(--orn-font)' }}>Comments</h2>
            <p className="note">approve or reject pending comments.</p>
          </Link>
          <Link to="admin/media" params={{}} className="card" style={{ display: 'block', marginBottom: 0, textDecoration: 'none' }}>
            <h2 style={{ margin: '.1em 0', fontFamily: 'var(--orn-font)' }}>Media &amp; Music</h2>
            <p className="note">upload tracks and corner button images.</p>
          </Link>
        </div>

        <h2 style={{ fontFamily: 'var(--orn-font)', marginTop: 24 }}>Galleries &amp; collections</h2>
        <p className="note">manage the entry corners (books, movies, recipes, vision board, memes…).</p>
        <div
          className="highlight-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginTop: 12 }}
        >
          {ENTRY_CORNER_KEYS.map((key) => (
            <Link
              key={key}
              to="admin/entries/:corner"
              params={{ corner: key }}
              className="card"
              style={{ display: 'block', marginBottom: 0, textDecoration: 'none' }}
            >
              <h2 style={{ margin: '.1em 0', fontFamily: 'var(--orn-font)' }}>
                {CORNERS.find((c) => c.key === key)?.label ?? ENTRY_CORNER_LABELS[key] ?? key}
              </h2>
            </Link>
          ))}
        </div>
      </Win9xWindow>
    </AdminGate>
  );
}
