import { Module } from '@nestjs/common';
import { TicketsController } from '@interfaces/http/controllers/tickets.controller';
import { ListTicketsUseCase } from '@usecases/ticket/list-tickets.usecase';
import { CreateTicketUseCase } from '@usecases/ticket/create-ticket.usecase';
import { GetTicketUseCase } from '@usecases/ticket/get-ticket.usecase';
import { UpdateTicketUseCase } from '@usecases/ticket/update-ticket.usecase';
import { DeleteTicketUseCase } from '@usecases/ticket/delete-ticket.usecase';
import { AddAttachmentUseCase } from '@usecases/ticket/add-attachment.usecase';
import { RemoveAttachmentUseCase } from '@usecases/ticket/remove-attachment.usecase';
import { ListTicketCommentsUseCase } from '@usecases/ticket-comment/list-ticket-comments.usecase';
import { CreateTicketCommentUseCase } from '@usecases/ticket-comment/create-ticket-comment.usecase';
import { UpdateTicketCommentUseCase } from '@usecases/ticket-comment/update-ticket-comment.usecase';
import { DeleteTicketCommentUseCase } from '@usecases/ticket-comment/delete-ticket-comment.usecase';

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
    ListTicketCommentsUseCase,
    CreateTicketCommentUseCase,
    UpdateTicketCommentUseCase,
    DeleteTicketCommentUseCase,
  ],
})
export class TicketModule {}
