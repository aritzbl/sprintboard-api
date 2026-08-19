import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  PRIORITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
} from '@entities/ticket/ticket.entity';

export const createTicketSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).nullable().optional(),
  type: z.enum(TICKET_TYPES),
  priority: z.enum(PRIORITIES).default('medium'),
  storyPoints: z.number().int().min(0).max(100).nullable().optional(),
  status: z.enum(TICKET_STATUSES).default('todo'),
  assigneeId: z.string().uuid().nullable().optional(),
  sprintId: z.string().uuid().nullable().optional(),
  labels: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});
export class CreateTicketDto extends createZodDto(createTicketSchema) {}

export const updateTicketSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  type: z.enum(TICKET_TYPES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  storyPoints: z.number().int().min(0).max(100).nullable().optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  sprintId: z.string().uuid().nullable().optional(),
  labels: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  order: z.number().int().min(0).optional(),
});
export class UpdateTicketDto extends createZodDto(updateTicketSchema) {}

// Evidence (photo/video) uploaded to Firebase Storage; we store the metadata.
export const createAttachmentSchema = z.object({
  url: z.string().url().max(2048),
  storagePath: z.string().trim().min(1).max(1024),
  name: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(128),
  size: z
    .number()
    .int()
    .nonnegative()
    .max(209715200), // 200 MB
});
export class CreateAttachmentDto extends createZodDto(createAttachmentSchema) {}
