import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IInvitationRepository } from '@entities/invitation/invitation.gateway';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { IUserRepository } from '@entities/user/user.gateway';
import { User } from '@entities/user/user.entity';

@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    @Inject(RepositoryName.INVITATION)
    private readonly invitations: IInvitationRepository,
    @Inject(RepositoryName.PROJECT_MEMBER)
    private readonly members: IProjectMemberRepository,
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
  ) {}

  async execute(token: string, user: User): Promise<{ projectIds: string[] }> {
    const invitation = await this.invitations.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== 'pending') {
      throw new BadRequestException('This invitation is no longer valid');
    }
    if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This invitation has expired');
    }

    // Grant the role, but never downgrade a superadmin.
    if (user.role !== 'superadmin' && user.role !== invitation.role) {
      await this.users.updateRole(user.id, invitation.role);
    }

    for (const projectId of invitation.projectIds) {
      await this.members.add(projectId, user.id);
    }

    await this.invitations.update(invitation.id, {
      status: 'accepted',
      acceptedById: user.id,
    });

    return { projectIds: invitation.projectIds };
  }
}
