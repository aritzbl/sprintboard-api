import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { ISprintRepository } from '@entities/sprint/sprint.gateway';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';

/** Deletes a project along with all of its sprints, tickets and memberships. */
@Injectable()
export class DeleteProjectUseCase {
  constructor(
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
    @Inject(RepositoryName.SPRINT)
    private readonly sprints: ISprintRepository,
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    @Inject(RepositoryName.PROJECT_MEMBER)
    private readonly members: IProjectMemberRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.projects.findById(id);
    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    await this.tickets.deleteByProject(id);
    await this.sprints.deleteByProject(id);
    await this.members.removeByProject(id);
    await this.projects.delete(id);
  }
}
