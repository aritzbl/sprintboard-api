import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { ISprintRepository } from '@entities/sprint/sprint.gateway';
import { canTransition, Ticket } from '@entities/ticket/ticket.entity';
import {
  ITicketRepository,
  UpdateTicketData,
} from '@entities/ticket/ticket.gateway';
import { UpdateTicketDto } from '@entities/ticket/ticket.types';
import { IUserRepository } from '@entities/user/user.gateway';

@Injectable()
export class UpdateTicketUseCase {
  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    @Inject(RepositoryName.SPRINT)
    private readonly sprints: ISprintRepository,
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
  ) {}

  async execute(id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const existing = await this.tickets.findById(id);
    if (!existing) {
      throw new NotFoundException('Ticket not found');
    }

    if (
      dto.status !== undefined &&
      !canTransition(existing.status, dto.status)
    ) {
      throw new BadRequestException(
        `Invalid status transition: ${existing.status} → ${dto.status}`,
      );
    }
    if (dto.sprintId !== undefined && dto.sprintId !== null) {
      const sprint = await this.sprints.findById(dto.sprintId);
      if (!sprint || sprint.projectId !== existing.projectId) {
        throw new BadRequestException('Sprint does not belong to this project');
      }
    }
    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      if (!(await this.users.findById(dto.assigneeId))) {
        throw new BadRequestException('Assignee not found');
      }
    }

    const patch: UpdateTicketData = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description ?? null;
    if (dto.type !== undefined) patch.type = dto.type;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.storyPoints !== undefined) patch.storyPoints = dto.storyPoints ?? null;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.assigneeId !== undefined) patch.assigneeId = dto.assigneeId ?? null;
    if (dto.sprintId !== undefined) patch.sprintId = dto.sprintId ?? null;
    if (dto.labels !== undefined) patch.labels = dto.labels;
    if (dto.order !== undefined) patch.order = dto.order;

    if (Object.keys(patch).length === 0) return existing;

    const updated = await this.tickets.update(id, patch);
    return updated ?? existing;
  }
}
