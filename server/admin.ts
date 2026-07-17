import type { TypedDB } from 'ugly-app/shared';
import { dbDefaults } from 'ugly-app/shared';
import { collections, type AdminUser } from '../shared/collections';

// Admin allowlist — emails that get CMS access on first magic-link login.
// Override via the ADMIN_EMAILS worker var (comma-separated); defaults below.
const ADMIN_EMAILS = // eslint-disable-next-line @typescript-eslint/dot-notation
(
  process.env['ADMIN_EMAILS'] ??
  'justin.mann@gmail.com,madisonsomersmann@gmail.com'
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** True when `email` is on the admin allowlist. */
export function isAdminEmail(email: string | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Seed the `adminUser` allowlist doc on first login when the verified email
 * is on the allowlist. Wired into the configurator's `setOnUserCreate` hook,
 * whose signature is `(userId, info, db)`.
 */
export async function seedAdminOnCreate(
  db: TypedDB,
  userId: string,
  email: string | undefined,
): Promise<void> {
  if (!isAdminEmail(email)) return;
  const doc: AdminUser = { _id: userId, email: email!, ...dbDefaults() };
  await db.setDoc(collections.adminUser, doc);
}

/** True when an `adminUser` doc exists for this userId. */
export async function isAdmin(db: TypedDB, userId: string): Promise<boolean> {
  return !!(await db.getDoc(collections.adminUser, userId));
}
