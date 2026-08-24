import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import {
  InvitationStatus,
} from '@entities/invitation/invitation.entity';
import { IInvitationRepository } from '@entities/invitation/invitation.gateway';
import { Role } from '@entities/user/user.entity';
import { IUserRepository } from '@entities/user/user.gateway';

/** Public-ish view of an invitation, shown before the invitee accepts it. */
export interface InvitationView {
  token: string;
  role: Role;
  status: InvitationStatus;
  email: string | null;
  expired: boolean;
  accountDeleted: boolean;
  projects: { id: string; name: string; key: string }[];
}

@Injectable()
export class GetInvitationUseCase {
  constructor(
    @Inject(RepositoryName.INVITATION)
    private readonly invitations: IInvitationRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
  ) {}

  async execute(token: string): Promise<InvitationView> {
    const invitation = await this.invitations.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const [projects, acceptedUser] = await Promise.all([
      this.projects.findByIds(invitation.projectIds),
      invitation.acceptedById
        ? this.users.findByIdIncludingDeleted(invitation.acceptedById)
        : null,
    ]);
    return {
      token: invitation.token,
      role: invitation.role,
      status: invitation.status,
      email: invitation.email,
      expired:
        !!invitation.expiresAt &&
        invitation.expiresAt.getTime() < Date.now(),
      accountDeleted: !!acceptedUser?.deletedAt,
      projects: projects.map((p) => ({ id: p.id, name: p.name, key: p.key })),
    };
  }
}
