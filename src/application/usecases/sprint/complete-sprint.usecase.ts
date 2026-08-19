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

    const target = await this.resolveTarget(sprint, dto);

    const open = (
      await this.tickets.findByProject(sprint.projectId, { sprintId: id })
    ).filter((t) => t.status !== 'done');

    for (const ticket of open) {
      await this.tickets.update(ticket.id, { sprintId: target?.id ?? null });
    }

    const updated = await this.sprints.update(id, { status: 'completed' });
    if (target) await this.sprints.update(target.id, { status: 'active' });
    return updated ?? sprint;
  }

  /** null = backlog; otherwise a sibling or the automatically-created next sprint. */
  private async resolveTarget(
    sprint: Sprint,
    dto: CompleteSprintDto,
  ): Promise<Sprint | null> {
    const { moveTo } = dto;
    if (moveTo === 'backlog') return null;
    if (moveTo === 'new_sprint') {
      const existing = await this.sprints.findByProject(sprint.projectId);
      const number = existing.reduce((highest, item) => {
        const match = /^Sprint\s+(\d+)$/i.exec(item.name.trim());
        return Math.max(highest, match ? Number(match[1]) : 0);
      }, 0) + 1;
      return this.sprints.create({
        projectId: sprint.projectId,
        name: `Sprint ${number}`,
        goal: null,
        startDate: new Date(dto.newSprint!.startDate),
        endDate: new Date(dto.newSprint!.endDate),
        status: 'planned',
      });
    }
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
    return target;
  }
}
