export class TicketComment {
  id!: string;
  ticketId!: string;
  authorId!: string;
  content!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;
}
