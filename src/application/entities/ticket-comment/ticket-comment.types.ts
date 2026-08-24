import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const commentContent = z.string().trim().min(1).max(2000);

export class CreateTicketCommentDto extends createZodDto(
  z.object({ content: commentContent }),
) {}

export class UpdateTicketCommentDto extends createZodDto(
  z.object({ content: commentContent }),
) {}
