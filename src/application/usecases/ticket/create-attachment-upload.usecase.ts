import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { EVIDENCE_EXTENSIONS } from '@entities/ticket/ticket.entity';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';
import { CreateAttachmentUploadDto } from '@entities/ticket/ticket.types';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';
import { StorageService } from '@services/storage.service';

export interface AttachmentUpload {
  key: string;
  uploadUrl: string;
}

/** Presigned URL for the browser to PUT one piece of evidence of a ticket. */
@Injectable()
export class CreateAttachmentUploadUseCase {
  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    private readonly access: ProjectAccessService,
    private readonly storage: StorageService,
  ) {}

  async execute(
    ticketId: string,
    dto: CreateAttachmentUploadDto,
    user: User,
  ): Promise<AttachmentUpload> {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    await this.access.assertAccess(user, ticket.projectId);

    const key = this.storage.newKey(
      'evidence',
      ticketId,
      EVIDENCE_EXTENSIONS[dto.contentType],
    );
    const uploadUrl = await this.storage.uploadUrl(
      key,
      dto.contentType,
      dto.size,
    );
    return { key, uploadUrl };
  }
}
