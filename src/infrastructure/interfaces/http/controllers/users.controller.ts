import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DecodedIdToken } from 'firebase-admin/auth';
import {
  AllowUnsynced,
  Roles,
} from '@interfaces/http/middlewares/auth/roles.decorator';
import {
  CurrentFirebaseToken,
  CurrentUser,
} from '@interfaces/http/middlewares/auth/current-user.decorator';
import { User } from '@entities/user/user.entity';
import {
  SyncUserDto,
  UpdateMyProfileDto,
  UpdateUserRoleDto,
} from '@entities/user/user.types';
import { SyncUserUseCase } from '@usecases/user/sync-user.usecase';
import { ListUsersUseCase } from '@usecases/user/list-users.usecase';
import { UpdateUserRoleUseCase } from '@usecases/user/update-user-role.usecase';
import { UpdateMyProfileUseCase } from '@usecases/user/update-my-profile.usecase';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(
    private readonly syncUser: SyncUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly updateUserRole: UpdateUserRoleUseCase,
    private readonly updateMyProfile: UpdateMyProfileUseCase,
  ) {}

  @Post('me')
  @AllowUnsynced()
  @ApiOperation({
    summary:
      'Create or refresh the caller local profile. The first user to sync becomes superadmin.',
  })
  @ApiResponse({ status: 201, description: 'Profile synced' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  sync(
    @CurrentFirebaseToken() token: DecodedIdToken,
    @Body() dto: SyncUserDto,
  ): Promise<User> {
    return this.syncUser.execute(token, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the caller profile' })
  @ApiResponse({ status: 200, description: 'Current user' })
  @ApiResponse({ status: 401, description: 'Profile not initialized' })
  me(@CurrentUser() user: User): User {
    return user;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the caller profile' })
  updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateMyProfileDto,
  ): Promise<User> {
    return this.updateMyProfile.execute(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all workspace members' })
  list(
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ): Promise<User[]> {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.listUsers.execute(query, parsedLimit);
  }

  @Patch(':id/role')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Change a member role (superadmin only)' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  changeRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<User> {
    return this.updateUserRole.execute(id, dto.role);
  }
}
