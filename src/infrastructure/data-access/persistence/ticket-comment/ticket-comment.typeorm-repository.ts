import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketComment } from '@entities/ticket-comment/ticket-comment.entity';
import { ITicketCommentRepository } from '@entities/ticket-comment/ticket-comment.gateway';
import { TicketCommentOrmEntity } from '@data-access/persistence/ticket-comment/ticket-comment.orm-entity';

@Injectable()
export class TicketCommentTypeOrmRepository implements ITicketCommentRepository {
  constructor(
    @InjectRepository(TicketCommentOrmEntity)
    private readonly repository: Repository<TicketCommentOrmEntity>,
  ) {}

  private toDomain(row: TicketCommentOrmEntity): TicketComment {
    return Object.assign(new TicketComment(), row);
  }

  async findById(id: string): Promise<TicketComment | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByTicket(ticketId: string): Promise<TicketComment[]> {
    const rows = await this.repository.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(
    data: Pick<TicketComment, 'ticketId' | 'authorId' | 'content'>,
  ): Promise<TicketComment> {
    const saved = await this.repository.save(this.repository.create(data));
    return this.toDomain(saved);
  }

  async update(id: string, content: string): Promise<TicketComment | null> {
    await this.repository.update(id, { content });
    return this.findById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDeleteByTicket(ticketId: string): Promise<void> {
    await this.repository.softDelete({ ticketId });
  }
}
