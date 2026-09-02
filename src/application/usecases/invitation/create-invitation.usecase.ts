import { randomBytes } from 'node:crypto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { Invitation } from '@entities/invitation/invitation.entity';
import { IInvitationRepository } from '@entities/invitation/invitation.gateway';
import { CreateInvitationDto } from '@entities/invitation/invitation.types';
import { Role } from '@entities/user/user.entity';
import { IUserRepository } from '@entities/user/user.gateway';
import { FirebaseService } from '@services/firebase.service';
import { ConfigService } from '@nestjs/config';
import { EnvVar } from '@config/env-var';

@Injectable()
export class CreateInvitationUseCase {
  constructor(
    @Inject(RepositoryName.INVITATION)
    private readonly invitations: IInvitationRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
    private readonly firebase: FirebaseService,
    private readonly config: ConfigService,
  ) {}

  async execute(
    dto: CreateInvitationDto,
    createdById: string,
  ): Promise<Invitation> {
    const email = dto.email.toLowerCase();
    if (
      (await this.users.findByEmail(email)) ||
      !(await this.firebase.isEmailAvailable(email))
    ) {
      throw new BadRequestException('Ya existe una cuenta con este email.');
    }

    const found = await this.projects.findByIds(dto.projectIds);
    if (found.length !== dto.projectIds.length) {
      throw new BadRequestException('One or more projects do not exist');
    }

    const expirationHours = this.config.getOrThrow<number>(
      EnvVar.LINK_EXPIRATION_HOURS,
    );
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

    await this.firebase.createInvitedUser(email);
    try {
      return await this.invitations.create({
        token: randomBytes(24).toString('base64url'),
        email,
        role: dto.role as Role,
        projectIds: dto.projectIds,
        createdById,
        expiresAt,
      });
    } catch (error) {
      await this.firebase.deleteUserByEmail(email);
      throw error;
    }
  }
}
