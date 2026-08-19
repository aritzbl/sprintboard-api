import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Roles grantable via an invitation (never superadmin).
export const createInvitationSchema = z.object({
  role: z.enum(['pm', 'dev', 'qa']),
  projectIds: z.array(z.string().uuid()).min(1),
  email: z.string().email().nullable().optional(),
  expiresInDays: z.number().int().min(1).max(90).optional(),
});
export class CreateInvitationDto extends createZodDto(createInvitationSchema) {}
