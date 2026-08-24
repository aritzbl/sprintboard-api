import {
  EmailChangeRequest,
  EmailChangeStatus,
} from '@entities/email-change/email-change-request.entity';

export interface CreateEmailChangeRequestData {
  userId: string;
  newEmail: string;
  token: string;
  expiresAt: Date;
}

export interface IEmailChangeRequestRepository {
  findByToken(token: string): Promise<EmailChangeRequest | null>;
  create(data: CreateEmailChangeRequestData): Promise<EmailChangeRequest>;
  expirePendingForUser(userId: string): Promise<void>;
  update(
    id: string,
    patch: { status?: EmailChangeStatus; confirmedAt?: Date | null },
  ): Promise<EmailChangeRequest | null>;
}
