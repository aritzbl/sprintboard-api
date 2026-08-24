import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { User } from '@entities/user/user.entity';
import { IUserRepository } from '@entities/user/user.gateway';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
    @Inject(RepositoryName.PROJECT_MEMBER)
    private readonly members: IProjectMemberRepository,
  ) {}

  async execute(id: string, actor: User): Promise<void> {
    if (id === actor.id) {
      throw new BadRequestException('No podés eliminar tu propia cuenta.');
    }

    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (
      user.role === 'superadmin' &&
      (await this.users.countByRole('superadmin')) <= 1
    ) {
      throw new ConflictException(
        'Debe quedar al menos un superadmin en el espacio.',
      );
    }

    await this.members.removeByUser(id);
    await this.users.softDelete(id);
  }
}
