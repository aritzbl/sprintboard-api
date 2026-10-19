export const ROLES = ['superadmin', 'pm', 'dev', 'qa'] as const;
export type Role = (typeof ROLES)[number];

/** Roles allowed to manage projects and sprints. */
export const PROJECT_MANAGER_ROLES: readonly Role[] = [
  'superadmin',
  'pm',
] as const;

/** Profile photo types accepted for upload, with the extension of their S3 key. */
export const PROFILE_PHOTO_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
} as const;
export type ProfilePhotoContentType = keyof typeof PROFILE_PHOTO_EXTENSIONS;
export const PROFILE_PHOTO_CONTENT_TYPES = Object.keys(
  PROFILE_PHOTO_EXTENSIONS,
) as [ProfilePhotoContentType, ...ProfilePhotoContentType[]];
export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

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
  deletedAt!: Date | null;
}
