import type { TypedDB } from 'ugly-app/shared';
import { dbDefaults } from 'ugly-app/shared';
import { collections, type AdminUser } from '../shared/collections';

// eslint-disable-next-line @typescript-eslint/dot-notation
const ADMIN_EMAIL = (process.env['ADMIN_EMAIL'] ?? 'justin.mann@gmail.com').toLowerCase();

/**
 * Seed the `adminUser` allowlist doc on first login when the verified email
 * matches `ADMIN_EMAIL`. Wired into the configurator's `setOnUserCreate` hook,
 * whose signature is `(userId, info, db)`.
 */
export async function seedAdminOnCreate(
  db: TypedDB,
  userId: string,
  email: string | undefined,
): Promise<void> {
  if ((email ?? '').toLowerCase() !== ADMIN_EMAIL) return;
  const doc: AdminUser = { _id: userId, email: email!, ...dbDefaults() };
  await db.setDoc(collections.adminUser, doc);
}

/** True when an `adminUser` doc exists for this userId. */
export async function isAdmin(db: TypedDB, userId: string): Promise<boolean> {
  return !!(await db.getDoc(collections.adminUser, userId));
}
