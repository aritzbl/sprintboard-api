import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import {
  InvitationStatus,
} from '@entities/invitation/invitation.entity';
import { IInvitationRepository } from '@entities/invitation/invitation.gateway';
import { Role } from '@entities/user/user.entity';

/** Public-ish view of an invitation, shown before the invitee accepts it. */
export interface InvitationView {
  token: string;
  role: Role;
  status: InvitationStatus;
  email: string | null;
  expired: boolean;
  projects: { id: string; name: string; key: string }[];
}

@Injectable()
export class GetInvitationUseCase {
  constructor(
    @Inject(RepositoryName.INVITATION)
    private readonly invitations: IInvitationRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
  ) {}

  async execute(token: string): Promise<InvitationView> {
    const invitation = await this.invitations.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const projects = await this.projects.findByIds(invitation.projectIds);
    return {
      token: invitation.token,
      role: invitation.role,
      status: invitation.status,
      email: invitation.email,
      expired:
        !!invitation.expiresAt &&
        invitation.expiresAt.getTime() < Date.now(),
      projects: projects.map((p) => ({ id: p.id, name: p.name, key: p.key })),
    };
  }
}
