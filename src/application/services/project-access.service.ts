import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { User } from '@entities/user/user.entity';

/**
 * Central place for "can this user touch this project?". Superadmins can touch
 * everything; everyone else needs an explicit membership.
 */
@Injectable()
export class ProjectAccessService {
  constructor(
    @Inject(RepositoryName.PROJECT_MEMBER)
    private readonly members: IProjectMemberRepository,
  ) {}

  isSuperadmin(user: User): boolean {
    return user.role === 'superadmin';
  }

  async canAccess(user: User, projectId: string): Promise<boolean> {
    if (this.isSuperadmin(user)) return true;
    return this.members.exists(projectId, user.id);
  }

  async assertAccess(user: User, projectId: string): Promise<void> {
    if (!(await this.canAccess(user, projectId))) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  async assertManager(user: User, projectId: string): Promise<void> {
    if (this.isSuperadmin(user)) return;
    const membership = await this.members.find(projectId, user.id);
    if (membership?.role !== 'pm') {
      throw new ForbiddenException('No tenés permisos de PM en este proyecto');
    }
  }

  /** Project ids the user can see, or 'all' for superadmins. */
  async visibleProjectIds(user: User): Promise<string[] | 'all'> {
    if (this.isSuperadmin(user)) return 'all';
    return this.members.projectIdsForUser(user.id);
  }
}
