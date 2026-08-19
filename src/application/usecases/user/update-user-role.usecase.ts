import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { Role, User } from '@entities/user/user.entity';
import { IUserRepository } from '@entities/user/user.gateway';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
  ) {}

  async execute(id: string, role: Role): Promise<User> {
    const updated = await this.users.updateRole(id, role);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }
}
