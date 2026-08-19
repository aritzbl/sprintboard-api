import { Module } from '@nestjs/common';
import { TicketsController } from '@interfaces/http/controllers/tickets.controller';
import { ListTicketsUseCase } from '@usecases/ticket/list-tickets.usecase';
import { CreateTicketUseCase } from '@usecases/ticket/create-ticket.usecase';
import { GetTicketUseCase } from '@usecases/ticket/get-ticket.usecase';
import { UpdateTicketUseCase } from '@usecases/ticket/update-ticket.usecase';
import { DeleteTicketUseCase } from '@usecases/ticket/delete-ticket.usecase';
import { AddAttachmentUseCase } from '@usecases/ticket/add-attachment.usecase';
import { RemoveAttachmentUseCase } from '@usecases/ticket/remove-attachment.usecase';

@Module({
  controllers: [TicketsController],
  providers: [
    ListTicketsUseCase,
    CreateTicketUseCase,
    GetTicketUseCase,
    UpdateTicketUseCase,
    DeleteTicketUseCase,
    AddAttachmentUseCase,
    RemoveAttachmentUseCase,
  ],
})
export class TicketModule {}
