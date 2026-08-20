import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const current = await this.users.findById(id);
    if (!current) {
      throw new NotFoundException('User not found');
    }
    if (
      current.role === 'superadmin' &&
      role !== 'superadmin' &&
      (await this.users.countByRole('superadmin')) <= 1
    ) {
      throw new BadRequestException(
        'Debe quedar al menos un superadmin en el espacio.',
      );
    }
    const updated = await this.users.updateRole(id, role);
    return updated!;
  }
}
