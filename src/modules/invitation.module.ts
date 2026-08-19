import { Module } from '@nestjs/common';
import { InvitationsController } from '@interfaces/http/controllers/invitations.controller';
import { CreateInvitationUseCase } from '@usecases/invitation/create-invitation.usecase';
import { ListInvitationsUseCase } from '@usecases/invitation/list-invitations.usecase';
import { RevokeInvitationUseCase } from '@usecases/invitation/revoke-invitation.usecase';
import { GetInvitationUseCase } from '@usecases/invitation/get-invitation.usecase';
import { AcceptInvitationUseCase } from '@usecases/invitation/accept-invitation.usecase';

@Module({
  controllers: [InvitationsController],
  providers: [
    CreateInvitationUseCase,
    ListInvitationsUseCase,
    RevokeInvitationUseCase,
    GetInvitationUseCase,
    AcceptInvitationUseCase,
  ],
})
export class InvitationModule {}
