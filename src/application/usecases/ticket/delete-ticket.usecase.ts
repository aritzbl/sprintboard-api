import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';

@Injectable()
export class DeleteTicketUseCase {
  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.tickets.delete(id);
    if (!deleted) {
      throw new NotFoundException('Ticket not found');
    }
  }
}
