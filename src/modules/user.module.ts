import { Module } from '@nestjs/common';
import { UsersController } from '@interfaces/http/controllers/users.controller';
import { SyncUserUseCase } from '@usecases/user/sync-user.usecase';
import { ListUsersUseCase } from '@usecases/user/list-users.usecase';
import { ListUserDirectoryUseCase } from '@usecases/user/list-user-directory.usecase';
import { UpdateUserRoleUseCase } from '@usecases/user/update-user-role.usecase';
import { UpdateMyProfileUseCase } from '@usecases/user/update-my-profile.usecase';
import { DeleteUserUseCase } from '@usecases/user/delete-user.usecase';
import { SendPasswordResetUseCase } from '@usecases/user/send-password-reset.usecase';
import { RequestEmailChangeUseCase } from '@usecases/user/request-email-change.usecase';
import { GetEmailChangeUseCase } from '@usecases/user/get-email-change.usecase';
import { ConfirmEmailChangeUseCase } from '@usecases/user/confirm-email-change.usecase';

@Module({
  controllers: [UsersController],
  providers: [
    SyncUserUseCase,
    ListUsersUseCase,
    ListUserDirectoryUseCase,
    UpdateUserRoleUseCase,
    UpdateMyProfileUseCase,
    DeleteUserUseCase,
    SendPasswordResetUseCase,
    RequestEmailChangeUseCase,
    GetEmailChangeUseCase,
    ConfirmEmailChangeUseCase,
  ],
})
export class UserModule {}
