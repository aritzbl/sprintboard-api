import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import {
  EmailChangeStatus,
} from '@entities/email-change/email-change-request.entity';
import { IEmailChangeRequestRepository } from '@entities/email-change/email-change-request.gateway';

export interface EmailChangeView {
  email: string;
  status: EmailChangeStatus;
  expired: boolean;
}

@Injectable()
export class GetEmailChangeUseCase {
  constructor(
    @Inject(RepositoryName.EMAIL_CHANGE_REQUEST)
    private readonly requests: IEmailChangeRequestRepository,
  ) {}

  async execute(token: string): Promise<EmailChangeView> {
    const request = await this.requests.findByToken(token);
    if (!request) throw new NotFoundException('No encontramos esta confirmación.');

    const expired = request.status === 'pending' && request.expiresAt.getTime() < Date.now();
    if (expired) await this.requests.update(request.id, { status: 'expired' });
    return {
      email: request.newEmail,
      status: expired ? 'expired' : request.status,
      expired,
    };
  }
}
