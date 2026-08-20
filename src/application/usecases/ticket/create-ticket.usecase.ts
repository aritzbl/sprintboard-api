import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { ISprintRepository } from '@entities/sprint/sprint.gateway';
import { Ticket } from '@entities/ticket/ticket.entity';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';
import { CreateTicketDto } from '@entities/ticket/ticket.types';
import { IUserRepository } from '@entities/user/user.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { IEpicRepository } from '@entities/epic/epic.gateway';

@Injectable()
export class CreateTicketUseCase {
  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
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

  async execute(
    projectId: string,
    dto: CreateTicketDto,
    user: User,
  ): Promise<Ticket> {
    const project = await this.projects.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.access.assertAccess(user, projectId);

    await this.assertSprintBelongsToProject(dto.sprintId ?? null, projectId);
    await this.assertEpicBelongsToProject(dto.epicId ?? null, projectId);
    await this.assertAssigneeBelongsToProject(
      dto.assigneeId ?? null,
      projectId,
    );

    const number = await this.projects.nextTicketNumber(projectId);

    return this.tickets.create({
      projectId,
      key: `${project.key}-${number}`,
      title: dto.title,
      description: dto.description ?? null,
      type: dto.type,
      priority: dto.priority,
      storyPoints: dto.storyPoints ?? null,
      status: dto.status,
      reporterId: user.id,
      assigneeId: dto.assigneeId ?? null,
      sprintId: dto.sprintId ?? null,
      epicId: dto.epicId ?? null,
      labels: dto.labels ?? [],
      attachments: [],
      order: number,
    });
  }

  private async assertSprintBelongsToProject(
    sprintId: string | null,
    projectId: string,
  ): Promise<void> {
    if (!sprintId) return;
    const sprint = await this.sprints.findById(sprintId);
    if (!sprint || sprint.projectId !== projectId) {
      throw new BadRequestException('Sprint does not belong to this project');
    }
    if (sprint.status === 'completed') {
      throw new BadRequestException(
        'Cannot assign a ticket to a completed sprint',
      );
    }
  }

  private async assertAssigneeBelongsToProject(
    assigneeId: string | null,
    projectId: string,
  ): Promise<void> {
    if (!assigneeId) return;
    if (!(await this.users.findById(assigneeId))) {
      throw new BadRequestException('Assignee not found');
    }
    if (!(await this.members.exists(projectId, assigneeId))) {
      throw new BadRequestException('Assignee is not a member of this project');
    }
  }

  private async assertEpicBelongsToProject(
    epicId: string | null,
    projectId: string,
  ): Promise<void> {
    if (!epicId) return;
    const epic = await this.epics.findById(epicId);
    if (!epic || epic.projectId !== projectId) {
      throw new BadRequestException('Epic does not belong to this project');
    }
  }
}
