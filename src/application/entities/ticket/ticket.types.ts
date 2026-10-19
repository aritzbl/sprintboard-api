import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  EVIDENCE_CONTENT_TYPES,
  MAX_EVIDENCE_BYTES,
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
  epicId: z.string().uuid().nullable().optional(),
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
  epicId: z.string().uuid().nullable().optional(),
  labels: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  order: z.number().int().min(0).optional(),
});
export class UpdateTicketDto extends createZodDto(updateTicketSchema) {}

// Evidence goes straight from the browser to S3: first ask for a presigned
// upload URL, PUT the file there, then attach the returned key.
export const createAttachmentUploadSchema = z.object({
  contentType: z.enum(EVIDENCE_CONTENT_TYPES),
  size: z.number().int().positive().max(MAX_EVIDENCE_BYTES),
});
export class CreateAttachmentUploadDto extends createZodDto(
  createAttachmentUploadSchema,
) {}

// Type and size are not taken from here: the API reads them from S3.
export const createAttachmentSchema = z.object({
  key: z.string().trim().min(1).max(1024),
  name: z.string().trim().min(1).max(255),
});
export class CreateAttachmentDto extends createZodDto(createAttachmentSchema) {}
