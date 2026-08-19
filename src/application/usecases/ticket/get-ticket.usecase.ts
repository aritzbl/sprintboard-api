import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { Ticket } from '@entities/ticket/ticket.entity';
import { ITicketRepository } from '@entities/ticket/ticket.gateway';

@Injectable()
export class GetTicketUseCase {
  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
  ) {}

  async execute(id: string): Promise<Ticket> {
    const ticket = await this.tickets.findById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }
}
