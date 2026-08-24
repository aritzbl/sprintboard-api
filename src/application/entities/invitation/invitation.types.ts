import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Roles grantable via an invitation (never superadmin).
export const createInvitationSchema = z.object({
  role: z.enum(['superadmin', 'pm', 'dev', 'qa']),
  projectIds: z.array(z.string().uuid()),
  email: z.string().trim().email(),
}).superRefine((input, context) => {
  if (input.role === 'superadmin' && input.projectIds.length > 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['projectIds'],
      message: 'A superadmin invitation cannot include projects',
    });
  }
  if (input.role !== 'superadmin' && input.projectIds.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['projectIds'],
      message: 'A project invitation must include at least one project',
    });
  }
});
export class CreateInvitationDto extends createZodDto(createInvitationSchema) {}

export const updateInvitationEmailSchema = z.object({
  email: z.string().trim().email(),
});
export class UpdateInvitationEmailDto extends createZodDto(
  updateInvitationEmailSchema,
) {}
