import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { ProjectMember } from '@entities/project-member/project-member.entity';
import { IUserRepository } from '@entities/user/user.gateway';

/** Superadmin grants a user access to a project. */
@Injectable()
export class AddMemberUseCase {
  constructor(
    @Inject(RepositoryName.PROJECT_MEMBER)
    private readonly members: IProjectMemberRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
  ) {}

  async execute(projectId: string, userId: string): Promise<ProjectMember> {
    if (!(await this.projects.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
    if (!(await this.users.findById(userId))) {
      throw new NotFoundException('User not found');
    }
    return this.members.add(projectId, userId);
  }
}
