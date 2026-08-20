import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { ISprintRepository } from '@entities/sprint/sprint.gateway';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

/** Deletes a sprint and moves its tickets back to the backlog. */
@Injectable()
export class DeleteSprintUseCase {
  constructor(
    @Inject(RepositoryName.SPRINT)
    private readonly sprints: ISprintRepository,
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(id: string, user: User): Promise<void> {
    const existing = await this.sprints.findById(id);
    if (!existing) {
      throw new NotFoundException('Sprint not found');
    }
    await this.access.assertManager(user, existing.projectId);

    await this.tickets.moveSprintTicketsToBacklog(id);
    await this.sprints.softDelete(id);
  }
}
