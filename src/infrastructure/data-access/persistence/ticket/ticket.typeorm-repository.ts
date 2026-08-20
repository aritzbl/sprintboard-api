import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { Ticket, TicketAttachment } from '@entities/ticket/ticket.entity';
import {
  CreateTicketData,
  ITicketRepository,
  TicketFilters,
  UpdateTicketData,
} from '@entities/ticket/ticket.gateway';
import { BaseTypeOrmRepository } from '@data-access/persistence/base-typeorm.repository';
import { TicketOrmEntity } from '@data-access/persistence/ticket/ticket.orm-entity';

@Injectable()
export class TicketTypeOrmRepository
  extends BaseTypeOrmRepository<TicketOrmEntity, Ticket>
  implements ITicketRepository
{
  constructor(
    @InjectRepository(TicketOrmEntity)
    repository: Repository<TicketOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: TicketOrmEntity): Ticket {
    const ticket = Object.assign(new Ticket(), orm);
    ticket.attachments = (orm.attachments ?? []).filter(
      (attachment) => !attachment.deletedAt,
    );
    return ticket;
  }

  async findByProject(
    projectId: string,
    filters?: TicketFilters,
  ): Promise<Ticket[]> {
    const where: FindOptionsWhere<TicketOrmEntity> = { projectId };

    if (filters?.sprintId === null) {
      where.sprintId = IsNull();
    } else if (filters?.sprintId) {
      where.sprintId = filters.sprintId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }
    if (filters?.epicId === null) {
      where.epicId = IsNull();
    } else if (filters?.epicId) {
      where.epicId = filters.epicId;
    }

    const rows = await this.repository.find({
      where,
      order: { order: 'ASC', createdAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(data: CreateTicketData): Promise<Ticket> {
    const saved = await this.repository.save(this.repository.create(data));
    return this.toDomain(saved);
  }

  async countByEpic(epicId: string): Promise<number> {
    return this.repository.count({ where: { epicId } });
  }

  async update(id: string, patch: UpdateTicketData): Promise<Ticket | null> {
    await this.repository.update(id, patch);
    return this.findById(id);
  }

  async updateAttachments(
    id: string,
    attachments: TicketAttachment[],
  ): Promise<Ticket | null> {
    await this.repository.update(id, { attachments });
    return this.findById(id);
  }

  async appendAttachment(
    id: string,
    attachment: TicketAttachment,
  ): Promise<Ticket | null> {
    const ticket = await this.repository.findOne({ where: { id } });
    if (!ticket) return null;
    ticket.attachments = [...(ticket.attachments ?? []), attachment];
    await this.repository.save(ticket);
    return this.findById(id);
  }

  async archiveAttachment(
    id: string,
    attachmentId: string,
  ): Promise<Ticket | null> {
    const ticket = await this.repository.findOne({ where: { id } });
    if (!ticket) return null;
    ticket.attachments = (ticket.attachments ?? []).map((attachment) =>
      attachment.id === attachmentId && !attachment.deletedAt
        ? { ...attachment, deletedAt: new Date().toISOString() }
        : attachment,
    );
    await this.repository.save(ticket);
    return this.findById(id);
  }

  async deleteByProject(projectId: string): Promise<void> {
    await this.repository.softDelete({ projectId });
  }

  async moveSprintTicketsToBacklog(sprintId: string): Promise<void> {
    await this.repository.update({ sprintId }, { sprintId: null });
  }

  async clearEpicFromTickets(epicId: string): Promise<void> {
    await this.repository.update({ epicId }, { epicId: null });
  }
}
