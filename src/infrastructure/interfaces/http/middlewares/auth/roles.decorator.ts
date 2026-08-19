import { SetMetadata } from '@nestjs/common';
import { Role } from '@entities/user/user.entity';

export const ROLES_KEY = 'roles';
/** Restrict a route to the given roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const ALLOW_UNSYNCED_KEY = 'allowUnsynced';
/**
 * Allow a route to run for an authenticated Firebase user that has not created
 * a local profile yet (used by the profile-sync endpoint).
 */
export const AllowUnsynced = () => SetMetadata(ALLOW_UNSYNCED_KEY, true);

export const PUBLIC_KEY = 'isPublic';
/** Skip authentication entirely for a route (e.g. viewing an invitation). */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
