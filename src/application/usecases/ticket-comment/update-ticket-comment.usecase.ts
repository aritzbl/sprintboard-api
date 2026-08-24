import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { TicketComment } from '@entities/ticket-comment/ticket-comment.entity';
import { ITicketCommentRepository } from '@entities/ticket-comment/ticket-comment.gateway';
import { UpdateTicketCommentDto } from '@entities/ticket-comment/ticket-comment.types';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

@Injectable()
export class UpdateTicketCommentUseCase {
  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    @Inject(RepositoryName.TICKET_COMMENT)
    private readonly comments: ITicketCommentRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(
    ticketId: string,
    commentId: string,
    dto: UpdateTicketCommentDto,
    user: User,
  ): Promise<TicketComment> {
    const comment = await this.comments.findById(commentId);
    if (!comment || comment.ticketId !== ticketId) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== user.id) {
      throw new ForbiddenException('Solo el autor puede editar este comentario.');
    }
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');
    await this.access.assertAccess(user, ticket.projectId);
    return (await this.comments.update(commentId, dto.content.trim()))!;
  }
}
