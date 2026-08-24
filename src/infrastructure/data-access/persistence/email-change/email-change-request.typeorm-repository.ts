import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateEmailChangeRequestData,
  IEmailChangeRequestRepository,
} from '@entities/email-change/email-change-request.gateway';
import {
  EmailChangeRequest,
  EmailChangeStatus,
} from '@entities/email-change/email-change-request.entity';
import { EmailChangeRequestOrmEntity } from '@data-access/persistence/email-change/email-change-request.orm-entity';

@Injectable()
export class EmailChangeRequestTypeOrmRepository
  implements IEmailChangeRequestRepository
{
  constructor(
    @InjectRepository(EmailChangeRequestOrmEntity)
    private readonly repository: Repository<EmailChangeRequestOrmEntity>,
  ) {}

  private toDomain(orm: EmailChangeRequestOrmEntity): EmailChangeRequest {
    return Object.assign(new EmailChangeRequest(), orm);
  }

  async findByToken(token: string): Promise<EmailChangeRequest | null> {
    const found = await this.repository.findOne({ where: { token } });
    return found ? this.toDomain(found) : null;
  }

  async create(
    data: CreateEmailChangeRequestData,
  ): Promise<EmailChangeRequest> {
    const saved = await this.repository.save(this.repository.create(data));
    return this.toDomain(saved);
  }

  async expirePendingForUser(userId: string): Promise<void> {
    await this.repository.update(
      { userId, status: 'pending' },
      { status: 'expired' },
    );
  }

  async update(
    id: string,
    patch: { status?: EmailChangeStatus; confirmedAt?: Date | null },
  ): Promise<EmailChangeRequest | null> {
    await this.repository.update(id, patch);
    const found = await this.repository.findOne({ where: { id } });
    return found ? this.toDomain(found) : null;
  }
}
