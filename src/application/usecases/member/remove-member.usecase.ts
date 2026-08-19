import { Inject, Injectable } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';

/** Superadmin revokes a user's access to a project. */
@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(RepositoryName.PROJECT_MEMBER)
    private readonly members: IProjectMemberRepository,
  ) {}

  async execute(projectId: string, userId: string): Promise<void> {
    await this.members.remove(projectId, userId);
  }
}
