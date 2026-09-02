import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IInvitationRepository } from '@entities/invitation/invitation.gateway';
import { IUserRepository } from '@entities/user/user.gateway';
import { FirebaseService } from '@services/firebase.service';

@Injectable()
export class RevokeInvitationUseCase {
  constructor(
    @Inject(RepositoryName.INVITATION)
    private readonly invitations: IInvitationRepository,
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
    private readonly firebase: FirebaseService,
  ) {}

  async execute(id: string): Promise<void> {
    const invitation = await this.invitations.findById(id);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    await this.invitations.update(id, { status: 'revoked' });
    if (invitation.email && !(await this.users.findByEmail(invitation.email))) {
      await this.firebase.deleteUserByEmail(invitation.email);
    }
  }
}
