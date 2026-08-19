import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { Ticket } from '@entities/ticket/ticket.entity';
import {
  ITicketRepository,
  TicketFilters,
} from '@entities/ticket/ticket.gateway';

@Injectable()
export class ListTicketsUseCase {
  constructor(
    @Inject(RepositoryName.TICKET)
    private readonly tickets: ITicketRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
  ) {}

  async execute(
    projectId: string,
    filters?: TicketFilters,
  ): Promise<Ticket[]> {
    if (!(await this.projects.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
    return this.tickets.findByProject(projectId, filters);
  }
}
