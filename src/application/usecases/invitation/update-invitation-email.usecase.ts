import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IInvitationRepository } from '@entities/invitation/invitation.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { IUserRepository } from '@entities/user/user.gateway';
import { MailService } from '@services/mail.service';
import { FirebaseService } from '@services/firebase.service';
import { EnvVar } from '@config/env-var';
import { Invitation } from '@entities/invitation/invitation.entity';

@Injectable()
export class UpdateInvitationEmailUseCase {
  constructor(
    @Inject(RepositoryName.INVITATION)
    private readonly invitations: IInvitationRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
    private readonly mail: MailService,
    private readonly firebase: FirebaseService,
    private readonly config: ConfigService,
  ) {}

  async execute(id: string, email: string): Promise<Invitation> {
    const invitation = await this.invitations.findById(id);
    if (!invitation) throw new NotFoundException('No encontramos la invitación.');
    if (invitation.status !== 'pending' || (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now())) {
      throw new BadRequestException('Solo podés modificar una invitación pendiente y vigente.');
    }
    const normalizedEmail = email.toLowerCase();
    if (
      (await this.users.findByEmail(normalizedEmail)) ||
      !(await this.firebase.isEmailAvailable(normalizedEmail))
    ) {
      throw new BadRequestException('Ya existe una cuenta con este email.');
    }

    const expirationHours = this.config.getOrThrow<number>(
      EnvVar.LINK_EXPIRATION_HOURS,
    );
    const updated = await this.invitations.update(id, {
      email: normalizedEmail,
      token: randomBytes(24).toString('base64url'),
      expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000),
    });
    if (!updated) throw new NotFoundException('No encontramos la invitación.');

    const projects = await this.projects.findByIds(updated.projectIds);
    const url = `${this.config.getOrThrow<string>(EnvVar.WEB_URL)}/invite/${updated.token}`;
    this.mail.sendInvitationInBackground({
      to: updated.email!,
      url,
      role: updated.role,
      projectNames: projects.map((project) => project.name),
    });
    return updated;
  }
}
