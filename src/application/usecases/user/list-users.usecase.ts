import { Inject, Injectable } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { User } from '@entities/user/user.entity';
import { IUserRepository } from '@entities/user/user.gateway';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
  ) {}

  execute(): Promise<User[]> {
    return this.users.findAll();
  }
}
