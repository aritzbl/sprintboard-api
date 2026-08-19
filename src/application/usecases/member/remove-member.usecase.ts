import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { IUserRepository } from '@entities/user/user.gateway';

/** Superadmin revokes a user's access to a project. */
@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(RepositoryName.PROJECT_MEMBER)
    private readonly members: IProjectMemberRepository,
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
  ) {}

  async execute(projectId: string, userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user?.role === 'superadmin') {
      throw new ForbiddenException(
        'No se puede quitar a un superadmin de un proyecto.',
      );
    }
    await this.members.remove(projectId, userId);
  }
}
