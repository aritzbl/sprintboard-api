import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IInvitationRepository } from '@entities/invitation/invitation.gateway';

@Injectable()
export class RevokeInvitationUseCase {
  constructor(
    @Inject(RepositoryName.INVITATION)
    private readonly invitations: IInvitationRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const invitation = await this.invitations.findById(id);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    await this.invitations.update(id, { status: 'revoked' });
  }
}
