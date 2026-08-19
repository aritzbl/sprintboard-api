import { randomBytes } from 'node:crypto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { Invitation } from '@entities/invitation/invitation.entity';
import { IInvitationRepository } from '@entities/invitation/invitation.gateway';
import { CreateInvitationDto } from '@entities/invitation/invitation.types';
import { Role } from '@entities/user/user.entity';

@Injectable()
export class CreateInvitationUseCase {
  constructor(
    @Inject(RepositoryName.INVITATION)
    private readonly invitations: IInvitationRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
  ) {}

  async execute(
    dto: CreateInvitationDto,
    createdById: string,
  ): Promise<Invitation> {
    const found = await this.projects.findByIds(dto.projectIds);
    if (found.length !== dto.projectIds.length) {
      throw new BadRequestException('One or more projects do not exist');
    }

    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    return this.invitations.create({
      token: randomBytes(24).toString('base64url'),
      email: dto.email ?? null,
      role: dto.role as Role,
      projectIds: dto.projectIds,
      createdById,
      expiresAt,
    });
  }
}
