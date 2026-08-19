export const ROLES = ['superadmin', 'pm', 'dev', 'qa'] as const;
export type Role = (typeof ROLES)[number];

/** Roles allowed to manage projects and sprints. */
export const PROJECT_MANAGER_ROLES: readonly Role[] = [
  'superadmin',
  'pm',
] as const;

/** Domain representation of an authenticated member of the workspace. */
export class User {
  id!: string;
  firebaseUid!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  displayName!: string;
  photoURL!: string | null;
  role!: Role;
  createdAt!: Date;
}
