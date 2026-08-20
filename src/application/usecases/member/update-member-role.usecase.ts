import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectMember } from '@entities/project-member/project-member.entity';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { Role } from '@entities/user/user.entity';

/** Changes the role a member has inside one project. */
@Injectable()
export class UpdateMemberRoleUseCase {
  constructor(
    @Inject(RepositoryName.PROJECT_MEMBER)
    private readonly members: IProjectMemberRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
  ) {}

  async execute(
    projectId: string,
    userId: string,
    role: Role,
  ): Promise<ProjectMember> {
    if (!(await this.projects.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }

    const member = await this.members.updateRole(projectId, userId, role);
    if (!member) {
      throw new NotFoundException('Project member not found');
    }
    return member;
  }
}
