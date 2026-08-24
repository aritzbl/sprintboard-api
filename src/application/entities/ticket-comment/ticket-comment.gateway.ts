import { TicketComment } from '@entities/ticket-comment/ticket-comment.entity';

export interface ITicketCommentRepository {
  findById(id: string): Promise<TicketComment | null>;
  findByTicket(ticketId: string): Promise<TicketComment[]>;
  create(data: Pick<TicketComment, 'ticketId' | 'authorId' | 'content'>): Promise<TicketComment>;
  update(id: string, content: string): Promise<TicketComment | null>;
  softDelete(id: string): Promise<boolean>;
  softDeleteByTicket(ticketId: string): Promise<void>;
}
