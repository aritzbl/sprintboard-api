import { Module } from '@nestjs/common';
import { UsersController } from '@interfaces/http/controllers/users.controller';
import { SyncUserUseCase } from '@usecases/user/sync-user.usecase';
import { ListUsersUseCase } from '@usecases/user/list-users.usecase';
import { UpdateUserRoleUseCase } from '@usecases/user/update-user-role.usecase';
import { UpdateMyProfileUseCase } from '@usecases/user/update-my-profile.usecase';

@Module({
  controllers: [UsersController],
  providers: [
    SyncUserUseCase,
    ListUsersUseCase,
    UpdateUserRoleUseCase,
    UpdateMyProfileUseCase,
  ],
})
export class UserModule {}
