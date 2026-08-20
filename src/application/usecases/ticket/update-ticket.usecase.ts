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
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { IEpicRepository } from '@entities/epic/epic.gateway';

@Injectable()
export class UpdateTicketUseCase {
  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    @Inject(RepositoryName.SPRINT)
    private readonly sprints: ISprintRepository,
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
    @Inject(RepositoryName.PROJECT_MEMBER)
    private readonly members: IProjectMemberRepository,
    @Inject(RepositoryName.EPIC)
    private readonly epics: IEpicRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(id: string, dto: UpdateTicketDto, user: User): Promise<Ticket> {
    const existing = await this.tickets.findById(id);
    if (!existing) {
      throw new NotFoundException('Ticket not found');
    }
    await this.access.assertAccess(user, existing.projectId);

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
      if (sprint.status === 'completed') {
        throw new BadRequestException(
          'Cannot assign a ticket to a completed sprint',
        );
      }
    }
    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      await this.assertAssigneeBelongsToProject(
        dto.assigneeId,
        existing.projectId,
      );
    }
    if (dto.epicId !== undefined && dto.epicId !== null) {
      await this.assertEpicBelongsToProject(dto.epicId, existing.projectId);
    }

    const patch: UpdateTicketData = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined)
      patch.description = dto.description ?? null;
    if (dto.type !== undefined) patch.type = dto.type;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.storyPoints !== undefined)
      patch.storyPoints = dto.storyPoints ?? null;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.assigneeId !== undefined) patch.assigneeId = dto.assigneeId ?? null;
    if (dto.sprintId !== undefined) patch.sprintId = dto.sprintId ?? null;
    if (dto.epicId !== undefined) patch.epicId = dto.epicId ?? null;
    if (dto.labels !== undefined) patch.labels = dto.labels;
    if (dto.order !== undefined) patch.order = dto.order;

    if (Object.keys(patch).length === 0) return existing;

    const updated = await this.tickets.update(id, patch);
    return updated ?? existing;
  }

  private async assertAssigneeBelongsToProject(
    assigneeId: string,
    projectId: string,
  ): Promise<void> {
    if (!(await this.users.findById(assigneeId))) {
      throw new BadRequestException('Assignee not found');
    }
    if (!(await this.members.exists(projectId, assigneeId))) {
      throw new BadRequestException('Assignee is not a member of this project');
    }
  }

  private async assertEpicBelongsToProject(
    epicId: string,
    projectId: string,
  ): Promise<void> {
    const epic = await this.epics.findById(epicId);
    if (!epic || epic.projectId !== projectId) {
      throw new BadRequestException('Epic does not belong to this project');
    }
  }
}
