import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { Sprint } from '@entities/sprint/sprint.entity';
import { ISprintRepository } from '@entities/sprint/sprint.gateway';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';
import { CompleteSprintDto } from '@entities/sprint/sprint.types';

/**
 * Completes a sprint: only DONE tickets stay archived with it; everything else
 * (todo/in_progress/qa and rejected — which must be reworked) moves to the
 * backlog or to another sprint, according to `moveTo`.
 */
@Injectable()
export class CompleteSprintUseCase {
  constructor(
    @Inject(RepositoryName.SPRINT)
    private readonly sprints: ISprintRepository,
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
  ) {}

  async execute(id: string, dto: CompleteSprintDto): Promise<Sprint> {
    const sprint = await this.sprints.findById(id);
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const targetSprintId = await this.resolveTarget(sprint, dto.moveTo);

    const open = (
      await this.tickets.findByProject(sprint.projectId, { sprintId: id })
    ).filter((t) => t.status !== 'done');

    for (const ticket of open) {
      await this.tickets.update(ticket.id, { sprintId: targetSprintId });
    }

    const updated = await this.sprints.update(id, { status: 'completed' });
    return updated ?? sprint;
  }

  /** null = backlog; otherwise a sibling sprint that can still receive tickets. */
  private async resolveTarget(
    sprint: Sprint,
    moveTo: string,
  ): Promise<string | null> {
    if (moveTo === 'backlog') return null;
    if (moveTo === sprint.id) {
      throw new BadRequestException('Cannot move tickets to the same sprint');
    }

    const target = await this.sprints.findById(moveTo);
    if (!target || target.projectId !== sprint.projectId) {
      throw new BadRequestException('Target sprint not found in this project');
    }
    if (target.status === 'completed') {
      throw new BadRequestException('Cannot move tickets to a completed sprint');
    }
    return target.id;
  }
}
