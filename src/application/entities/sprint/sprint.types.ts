import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SPRINT_STATUSES } from '@entities/sprint/sprint.entity';

const isoDate = z.string().datetime({ offset: true });

export const createSprintSchema = z.object({
  startDate: isoDate,
  endDate: isoDate,
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio.',
  path: ['endDate'],
});
export class CreateSprintDto extends createZodDto(createSprintSchema) {}

export const updateSprintSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  goal: z.string().trim().max(300).nullable().optional(),
  status: z.enum(SPRINT_STATUSES).optional(),
  startDate: isoDate.nullable().optional(),
  endDate: isoDate.nullable().optional(),
});
export class UpdateSprintDto extends createZodDto(updateSprintSchema) {}

export const completeSprintSchema = z.object({
  /** Where the sprint's unfinished tickets go: backlog, a new sprint, or another sprint. */
  moveTo: z
    .union([z.literal('backlog'), z.literal('new_sprint'), z.string().uuid()])
    .default('backlog'),
  newSprint: z
    .object({
      startDate: isoDate,
      endDate: isoDate,
    })
    .optional(),
}).superRefine((data, ctx) => {
  if (data.moveTo === 'new_sprint' && !data.newSprint) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Indicá las fechas del nuevo sprint.',
      path: ['newSprint'],
    });
  }
  if (
    data.newSprint &&
    new Date(data.newSprint.endDate) < new Date(data.newSprint.startDate)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La fecha de fin debe ser posterior a la fecha de inicio.',
      path: ['newSprint', 'endDate'],
    });
  }
});
export class CompleteSprintDto extends createZodDto(completeSprintSchema) {}
