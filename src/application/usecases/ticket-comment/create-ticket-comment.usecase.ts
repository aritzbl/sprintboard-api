import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { TicketComment } from '@entities/ticket-comment/ticket-comment.entity';
import { ITicketCommentRepository } from '@entities/ticket-comment/ticket-comment.gateway';
import { CreateTicketCommentDto } from '@entities/ticket-comment/ticket-comment.types';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

@Injectable()
export class CreateTicketCommentUseCase {
  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    @Inject(RepositoryName.TICKET_COMMENT)
    private readonly comments: ITicketCommentRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(
    ticketId: string,
    dto: CreateTicketCommentDto,
    user: User,
  ): Promise<TicketComment> {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');
    await this.access.assertAccess(user, ticket.projectId);
    return this.comments.create({
      ticketId,
      authorId: user.id,
      content: dto.content.trim(),
    });
  }
}
