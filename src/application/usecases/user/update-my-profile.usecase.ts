import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { User } from '@entities/user/user.entity';
import { IUserRepository } from '@entities/user/user.gateway';
import { UpdateMyProfileDto } from '@entities/user/user.types';

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
  ) {}

  async execute(user: User, dto: UpdateMyProfileDto): Promise<User> {
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const updated = await this.users.updateProfile(user.id, {
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      ...(dto.photoURL !== undefined ? { photoURL: dto.photoURL } : {}),
    });
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }
}
