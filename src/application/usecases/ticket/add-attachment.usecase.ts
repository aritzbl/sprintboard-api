import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import {
  EVIDENCE_CONTENT_TYPES,
  MAX_EVIDENCE_BYTES,
  Ticket,
  TicketAttachment,
} from '@entities/ticket/ticket.entity';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';
import { CreateAttachmentDto } from '@entities/ticket/ticket.types';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';
import { StorageService } from '@services/storage.service';

/**
 * Attaches evidence already uploaded to S3. Type and size come from the bucket,
 * not from the client: whatever does not qualify is deleted and rejected.
 */
@Injectable()
export class AddAttachmentUseCase {
  private readonly logger = new Logger(AddAttachmentUseCase.name);

  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    private readonly access: ProjectAccessService,
    private readonly storage: StorageService,
  ) {}

  async execute(
    ticketId: string,
    dto: CreateAttachmentDto,
    user: User,
  ): Promise<Ticket> {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    await this.access.assertAccess(user, ticket.projectId);

    if (!dto.key.startsWith(this.storage.folderPrefix('evidence', ticketId))) {
      throw new BadRequestException(
        'La evidencia debe provenir del almacenamiento autorizado.',
      );
    }
    const storagePath = `s3:${dto.key}`;
    if (ticket.attachments.some((a) => a.storagePath === storagePath)) {
      return ticket; // the same upload attached twice (e.g. a retried request)
    }

    const stored = await this.storage.stat(dto.key);
    if (!stored) {
      throw new BadRequestException(
        'No encontramos el archivo subido. Volvé a intentarlo.',
      );
    }
    const contentType = EVIDENCE_CONTENT_TYPES.find(
      (type) => type === stored.contentType,
    );
    if (!contentType || stored.size > MAX_EVIDENCE_BYTES) {
      await this.storage.remove(dto.key).catch((error: unknown) =>
        this.logger.warn(`Could not delete rejected upload ${dto.key}: ${error}`),
      );
      throw new BadRequestException(
        'El archivo subido no es una evidencia válida (PNG, JPEG, PDF o video de hasta 50 MB).',
      );
    }

    const attachment: TicketAttachment = {
      id: randomUUID(),
      url: '', // private object: a signed URL is added on every response
      storagePath,
      name: dto.name,
      contentType,
      size: stored.size,
      uploadedById: user.id,
      createdAt: new Date().toISOString(),
    };

    const updated = await this.tickets.appendAttachment(ticketId, attachment);
    return updated ?? ticket;
  }
}
