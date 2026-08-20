import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVar } from '@config/env-var';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { Ticket, TicketAttachment } from '@entities/ticket/ticket.entity';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';
import { CreateAttachmentDto } from '@entities/ticket/ticket.types';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

@Injectable()
export class AddAttachmentUseCase {
  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    private readonly access: ProjectAccessService,
    private readonly config: ConfigService,
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

    const cloudName = this.config.getOrThrow<string>(
      EnvVar.CLOUDINARY_CLOUD_NAME,
    );
    const cloudinaryOrigin = `https://res.cloudinary.com/${cloudName}/`;
    if (
      !dto.url.startsWith(cloudinaryOrigin) ||
      !dto.storagePath.startsWith('cloudinary:')
    ) {
      throw new BadRequestException(
        'La evidencia debe provenir del almacenamiento autorizado.',
      );
    }

    const attachment: TicketAttachment = {
      id: randomUUID(),
      url: dto.url,
      storagePath: dto.storagePath,
      name: dto.name,
      contentType: dto.contentType,
      size: dto.size,
      uploadedById: user.id,
      createdAt: new Date().toISOString(),
    };

    const updated = await this.tickets.appendAttachment(ticketId, attachment);
    return updated ?? ticket;
  }
}
