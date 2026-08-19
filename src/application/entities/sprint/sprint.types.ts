import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SPRINT_STATUSES } from '@entities/sprint/sprint.entity';

const isoDate = z.string().datetime({ offset: true });

export const createSprintSchema = z.object({
  name: z.string().trim().min(1).max(80),
  goal: z.string().trim().max(300).nullable().optional(),
  startDate: isoDate.nullable().optional(),
  endDate: isoDate.nullable().optional(),
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
  /** Where the sprint's unfinished tickets go: the backlog or another sprint. */
  moveTo: z
    .union([z.literal('backlog'), z.string().uuid()])
    .default('backlog'),
});
export class CompleteSprintDto extends createZodDto(completeSprintSchema) {}
