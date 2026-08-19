import { Inject, Injectable } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { Invitation } from '@entities/invitation/invitation.entity';
import { IInvitationRepository } from '@entities/invitation/invitation.gateway';

@Injectable()
export class ListInvitationsUseCase {
  constructor(
    @Inject(RepositoryName.INVITATION)
    private readonly invitations: IInvitationRepository,
  ) {}

  execute(): Promise<Invitation[]> {
    return this.invitations.findAll();
  }
}
