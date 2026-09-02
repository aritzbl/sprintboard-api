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
import { IUserRepository } from '@entities/user/user.gateway';
import { FirebaseService } from '@services/firebase.service';
import { EnvVar } from '@config/env-var';
import { Invitation } from '@entities/invitation/invitation.entity';

@Injectable()
export class UpdateInvitationEmailUseCase {
  constructor(
    @Inject(RepositoryName.INVITATION)
    private readonly invitations: IInvitationRepository,
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
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
    const emailChanged = invitation.email?.toLowerCase() !== normalizedEmail;
    if (await this.users.findByEmail(normalizedEmail)) {
      throw new BadRequestException('Ya existe una cuenta con este email.');
    }
    if (emailChanged && !(await this.firebase.isEmailAvailable(normalizedEmail))) {
      throw new BadRequestException('Ya existe una cuenta con este email.');
    }

    const expirationHours = this.config.getOrThrow<number>(
      EnvVar.LINK_EXPIRATION_HOURS,
    );
    if (emailChanged) {
      await this.firebase.createInvitedUser(normalizedEmail);
    } else if (await this.firebase.isEmailAvailable(normalizedEmail)) {
      await this.firebase.createInvitedUser(normalizedEmail);
    }

    let updated: Invitation | null;
    try {
      updated = await this.invitations.update(id, {
        email: normalizedEmail,
        token: randomBytes(24).toString('base64url'),
        expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000),
      });
    } catch (error) {
      if (emailChanged) await this.firebase.deleteUserByEmail(normalizedEmail);
      throw error;
    }
    if (!updated) throw new NotFoundException('No encontramos la invitación.');
    if (emailChanged && invitation.email) {
      await this.firebase.deleteUserByEmail(invitation.email);
    }
    return updated;
  }
}
