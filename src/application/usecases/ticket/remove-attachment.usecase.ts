import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { Ticket } from '@entities/ticket/ticket.entity';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

@Injectable()
export class RemoveAttachmentUseCase {
  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(
    ticketId: string,
    attachmentId: string,
    user: User,
  ): Promise<Ticket> {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    await this.access.assertAccess(user, ticket.projectId);

    const next = (ticket.attachments ?? []).filter(
      (a) => a.id !== attachmentId,
    );
    const updated = await this.tickets.updateAttachments(ticketId, next);
    return updated ?? ticket;
  }
}
