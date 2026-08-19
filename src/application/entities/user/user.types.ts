import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ROLES } from '@entities/user/user.entity';

/**
 * Payload the frontend sends right after Firebase sign-in to create/refresh
 * the local user profile. Identity (uid, email) comes from the verified token,
 * not from the body.
 */
export const syncUserSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  displayName: z.string().trim().min(1).max(120).optional(),
  photoURL: z.string().url().nullable().optional(),
});
export class SyncUserDto extends createZodDto(syncUserSchema) {}

export const updateUserRoleSchema = z.object({
  role: z.enum(ROLES),
});
export class UpdateUserRoleDto extends createZodDto(updateUserRoleSchema) {}
