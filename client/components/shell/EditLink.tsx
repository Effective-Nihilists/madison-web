import { type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { Link } from '../../router';
import { useSiteConfig } from './siteConfigContext';

// ─── EditLink ───────────────────────────────────────────────────────────────
// A compact, admin-only "edit this thing" affordance shown on live pages while
// in edit mode. It deep-links a live surface to its CMS manager (e.g. an article
// page → its editor, the music player → the tracks manager). Renders nothing for
// non-admins or outside edit mode, so it can be dropped straight into public
// page markup. Props are the typed Link props plus a `label`.

type EditLinkProps = Omit<ComponentProps<typeof Link>, 'children'> & {
  label: string;
  children?: ReactNode;
};

export default function EditLink({ label, className, children, ...linkProps }: EditLinkProps): ReactElement | null {
  const { admin, editMode } = useSiteConfig();
  if (!admin || !editMode) return null;
  return (
    <Link {...linkProps} className={`edit-link${className ? ` ${className}` : ''}`}>
      ✎ {label}{children}
    </Link>
  );
}
