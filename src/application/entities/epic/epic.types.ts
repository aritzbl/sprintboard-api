import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const EPIC_COLORS = [
  'violet',
  'blue',
  'cyan',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'burgundy',
  'pink',
] as const;
const epicColorSchema = z.enum(EPIC_COLORS);

export const createEpicSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).nullable().optional(),
  color: epicColorSchema.optional(),
});
export class CreateEpicDto extends createZodDto(createEpicSchema) {}

export const updateEpicSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  color: epicColorSchema.optional(),
});
export class UpdateEpicDto extends createZodDto(updateEpicSchema) {}
