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

  execute(query?: string, limit?: number): Promise<User[]> {
    if (query !== undefined) {
      return this.users.search(query, Math.min(Math.max(limit ?? 10, 1), 20));
    }
    return this.users.findAll();
  }
}
