import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

@Injectable()
export class DeleteTicketUseCase {
  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(id: string, user: User): Promise<void> {
    const existing = await this.tickets.findById(id);
    if (!existing) {
      throw new NotFoundException('Ticket not found');
    }
    await this.access.assertAccess(user, existing.projectId);
    await this.tickets.softDelete(id);
  }
}
