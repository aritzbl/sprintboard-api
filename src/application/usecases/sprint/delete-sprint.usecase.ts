import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { ISprintRepository } from '@entities/sprint/sprint.gateway';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';

/** Deletes a sprint and moves its tickets back to the backlog. */
@Injectable()
export class DeleteSprintUseCase {
  constructor(
    @Inject(RepositoryName.SPRINT)
    private readonly sprints: ISprintRepository,
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.sprints.findById(id);
    if (!existing) {
      throw new NotFoundException('Sprint not found');
    }

    await this.tickets.moveSprintTicketsToBacklog(id);
    await this.sprints.delete(id);
  }
}
