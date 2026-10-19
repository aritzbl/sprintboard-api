import { Injectable, Logger } from '@nestjs/common';
import { Ticket, TicketAttachment } from '@entities/ticket/ticket.entity';
import { StorageService } from '@services/storage.service';

const S3_PREFIX = 's3:';

/**
 * Shapes tickets for the HTTP response: evidence stored in the private S3
 * bucket gets a short-lived signed URL. Legacy Cloudinary files keep theirs.
 */
@Injectable()
export class TicketPresenter {
  private readonly logger = new Logger(TicketPresenter.name);

  constructor(private readonly storage: StorageService) {}

  many(tickets: Ticket[]): Promise<Ticket[]> {
    return Promise.all(tickets.map((ticket) => this.one(ticket)));
  }

  async one(ticket: Ticket): Promise<Ticket> {
    if (!ticket.attachments?.some((a) => a.storagePath.startsWith(S3_PREFIX))) {
      return ticket;
    }
    const attachments = await Promise.all(
      ticket.attachments.map((attachment) => this.sign(attachment)),
    );
    return { ...ticket, attachments };
  }

  private async sign(attachment: TicketAttachment): Promise<TicketAttachment> {
    if (!attachment.storagePath.startsWith(S3_PREFIX)) return attachment;
    try {
      const key = attachment.storagePath.slice(S3_PREFIX.length);
      return { ...attachment, url: await this.storage.readUrl(key) };
    } catch (error) {
      // Better a ticket without a preview than a board that does not load.
      this.logger.warn(`Could not sign ${attachment.storagePath}: ${error}`);
      return attachment;
    }
  }
}
