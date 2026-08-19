import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Public,
  Roles,
} from '@interfaces/http/middlewares/auth/roles.decorator';
import { CurrentUser } from '@interfaces/http/middlewares/auth/current-user.decorator';
import { User } from '@entities/user/user.entity';
import { Invitation } from '@entities/invitation/invitation.entity';
import { CreateInvitationDto } from '@entities/invitation/invitation.types';
import { CreateInvitationUseCase } from '@usecases/invitation/create-invitation.usecase';
import { ListInvitationsUseCase } from '@usecases/invitation/list-invitations.usecase';
import { RevokeInvitationUseCase } from '@usecases/invitation/revoke-invitation.usecase';
import {
  GetInvitationUseCase,
  InvitationView,
} from '@usecases/invitation/get-invitation.usecase';
import { AcceptInvitationUseCase } from '@usecases/invitation/accept-invitation.usecase';

@ApiTags('Invitations')
@ApiBearerAuth('JWT-auth')
@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly createInvitation: CreateInvitationUseCase,
    private readonly listInvitations: ListInvitationsUseCase,
    private readonly revokeInvitation: RevokeInvitationUseCase,
    private readonly getInvitation: GetInvitationUseCase,
    private readonly acceptInvitation: AcceptInvitationUseCase,
  ) {}

  @Post()
  @Roles('superadmin')
  @ApiOperation({
    summary: 'Create a shareable invitation (superadmin). Returns its token.',
  })
  create(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: User,
  ): Promise<Invitation> {
    return this.createInvitation.execute(dto, user.id);
  }

  @Get()
  @Roles('superadmin')
  @ApiOperation({ summary: 'List all invitations (superadmin)' })
  list(): Promise<Invitation[]> {
    return this.listInvitations.execute();
  }

  @Get(':token')
  @Public()
  @ApiOperation({
    summary: 'View an invitation by token (public, shown before accepting)',
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  view(@Param('token') token: string): Promise<InvitationView> {
    return this.getInvitation.execute(token);
  }

  @Post(':token/accept')
  @ApiOperation({
    summary: 'Accept an invitation: grants the role and project memberships',
  })
  @ApiResponse({ status: 400, description: 'Invitation invalid or expired' })
  accept(
    @Param('token') token: string,
    @CurrentUser() user: User,
  ): Promise<{ projectIds: string[] }> {
    return this.acceptInvitation.execute(token, user);
  }

  @Delete(':id')
  @Roles('superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an invitation (superadmin)' })
  revoke(@Param('id') id: string): Promise<void> {
    return this.revokeInvitation.execute(id);
  }
}
