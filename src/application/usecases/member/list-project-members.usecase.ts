import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { IUserRepository } from '@entities/user/user.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

/** Lists the users that are members of a project (visible to members + superadmin). */
@Injectable()
export class ListProjectMembersUseCase {
  constructor(
    @Inject(RepositoryName.PROJECT_MEMBER)
    private readonly members: IProjectMemberRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(projectId: string, user: User): Promise<User[]> {
    if (!(await this.projects.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
    await this.access.assertAccess(user, projectId);

    const memberIds = new Set(await this.members.userIdsForProject(projectId));
    const all = await this.users.findAll();
    return all.filter((u) => memberIds.has(u.id));
  }
}
