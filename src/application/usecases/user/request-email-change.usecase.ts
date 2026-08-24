import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IUserRepository } from '@entities/user/user.gateway';
import { User } from '@entities/user/user.entity';
import { IEmailChangeRequestRepository } from '@entities/email-change/email-change-request.gateway';
import { FirebaseService } from '@services/firebase.service';
import { MailService } from '@services/mail.service';
import { EnvVar } from '@config/env-var';

@Injectable()
export class RequestEmailChangeUseCase {
  constructor(
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
    @Inject(RepositoryName.EMAIL_CHANGE_REQUEST)
    private readonly requests: IEmailChangeRequestRepository,
    private readonly firebase: FirebaseService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async execute(user: User, rawEmail: string): Promise<void> {
    const email = rawEmail.toLowerCase();
    if (email === user.email.toLowerCase()) {
      throw new BadRequestException('Ese ya es el email de tu cuenta.');
    }
    if (await this.users.findByEmail(email)) {
      throw new BadRequestException('Ese email ya está en uso.');
    }
    if (!(await this.firebase.isEmailAvailable(email))) {
      throw new BadRequestException('Ese email ya está en uso.');
    }

    await this.requests.expirePendingForUser(user.id);
    const expirationHours = this.config.getOrThrow<number>(
      EnvVar.LINK_EXPIRATION_HOURS,
    );
    const request = await this.requests.create({
      userId: user.id,
      newEmail: email,
      token: randomBytes(24).toString('base64url'),
      expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000),
    });
    const url = `${this.config.getOrThrow<string>(EnvVar.WEB_URL)}/change-email/${request.token}`;
    await this.mail.sendEmailChange(email, url);
  }
}
