import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { IUserRepository } from '@entities/user/user.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

/** Lists the users that are members of a project (visible to members + superadmin). */
export interface PaginatedProjectMembers {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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

  async execute(
    projectId: string,
    user: User,
    page: number,
    pageSize: number,
  ): Promise<PaginatedProjectMembers> {
    if (!(await this.projects.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
    await this.access.assertAccess(user, projectId);

    const result = await this.members.pageUserIdsForProject(
      projectId,
      page,
      pageSize,
    );
    const users = await this.users.findByIds(
      result.members.map((member) => member.userId),
    );
    const usersById = new Map(users.map((member) => [member.id, member]));
    const items = result.members.flatMap((membership) => {
      const member = usersById.get(membership.userId);
      if (!member) return [];
      return [
        Object.assign(member, {
          role:
            member.role === 'superadmin'
              ? 'superadmin'
              : membership.role ?? 'dev',
        }),
      ];
    });

    return {
      items,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
    };
  }
}
