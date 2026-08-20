import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IEpicRepository } from '@entities/epic/epic.gateway';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

@Injectable()
export class DeleteEpicUseCase {
  constructor(
    @Inject(RepositoryName.EPIC)
    private readonly epics: IEpicRepository,
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(id: string, user: User): Promise<void> {
    const epic = await this.epics.findById(id);
    if (!epic) {
      throw new NotFoundException('Epic not found');
    }
    await this.access.assertManager(user, epic.projectId);
    await this.tickets.clearEpicFromTickets(id);
    await this.epics.delete(id);
  }
}
