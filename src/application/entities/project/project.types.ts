import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(50)
    .regex(
      /^[A-Z0-9_-]+$/,
      'Uppercase letters, numbers, hyphen or underscore only (no spaces)',
    ),
  description: z.string().trim().max(500).nullable().optional(),
});
export class CreateProjectDto extends createZodDto(createProjectSchema) {}

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(50)
    .regex(
      /^[A-Z0-9_-]+$/,
      'Uppercase letters, numbers, hyphen or underscore only (no spaces)',
    )
    .optional(),
  description: z.string().trim().max(500).nullable().optional(),
});
export class UpdateProjectDto extends createZodDto(updateProjectSchema) {}

export const addMemberSchema = z.object({ userId: z.string().uuid(), role: z.enum(['pm', 'dev', 'qa']).default('dev') });
export class AddMemberDto extends createZodDto(addMemberSchema) {}
export const updateMemberRoleSchema = z.object({ role: z.enum(['pm', 'dev', 'qa']) });
export class UpdateMemberRoleDto extends createZodDto(updateMemberRoleSchema) {}
