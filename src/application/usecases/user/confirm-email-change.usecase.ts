import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IEmailChangeRequestRepository } from '@entities/email-change/email-change-request.gateway';
import { IUserRepository } from '@entities/user/user.gateway';
import { FirebaseService } from '@services/firebase.service';

@Injectable()
export class ConfirmEmailChangeUseCase {
  constructor(
    @Inject(RepositoryName.EMAIL_CHANGE_REQUEST)
    private readonly requests: IEmailChangeRequestRepository,
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
    private readonly firebase: FirebaseService,
  ) {}

  async execute(token: string): Promise<void> {
    const request = await this.requests.findByToken(token);
    if (!request) throw new NotFoundException('No encontramos esta confirmación.');
    if (request.status !== 'pending') {
      throw new BadRequestException('Este enlace ya no está disponible.');
    }
    if (request.expiresAt.getTime() < Date.now()) {
      await this.requests.update(request.id, { status: 'expired' });
      throw new BadRequestException('Este enlace venció. Pedí un nuevo cambio de email.');
    }
    if (await this.users.findByEmail(request.newEmail)) {
      throw new BadRequestException('Ese email ya está en uso.');
    }
    if (!(await this.firebase.isEmailAvailable(request.newEmail))) {
      throw new BadRequestException('Ese email ya está en uso.');
    }

    const user = await this.users.findById(request.userId);
    if (!user) throw new NotFoundException('No encontramos la cuenta asociada.');
    await this.firebase.updateUserEmail(user.firebaseUid, request.newEmail);
    await this.users.updateEmail(user.id, request.newEmail);
    await this.requests.update(request.id, {
      status: 'confirmed',
      confirmedAt: new Date(),
    });
  }
}
