import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@interfaces/http/middlewares/auth/current-user.decorator';
import { User } from '@entities/user/user.entity';
import { Ticket, TicketStatus } from '@entities/ticket/ticket.entity';
import { TicketFilters } from '@entities/ticket/ticket.gateway';
import {
  CreateAttachmentDto,
  CreateTicketDto,
  UpdateTicketDto,
} from '@entities/ticket/ticket.types';
import { ListTicketsUseCase } from '@usecases/ticket/list-tickets.usecase';
import { CreateTicketUseCase } from '@usecases/ticket/create-ticket.usecase';
import { GetTicketUseCase } from '@usecases/ticket/get-ticket.usecase';
import { UpdateTicketUseCase } from '@usecases/ticket/update-ticket.usecase';
import { DeleteTicketUseCase } from '@usecases/ticket/delete-ticket.usecase';
import { AddAttachmentUseCase } from '@usecases/ticket/add-attachment.usecase';
import { RemoveAttachmentUseCase } from '@usecases/ticket/remove-attachment.usecase';

// Collection routes are nested under a project; item routes live under /tickets.
@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller()
export class TicketsController {
  constructor(
    private readonly listTickets: ListTicketsUseCase,
    private readonly createTicket: CreateTicketUseCase,
    private readonly getTicket: GetTicketUseCase,
    private readonly updateTicket: UpdateTicketUseCase,
    private readonly deleteTicket: DeleteTicketUseCase,
    private readonly addAttachment: AddAttachmentUseCase,
    private readonly removeAttachment: RemoveAttachmentUseCase,
  ) {}

  @Get('projects/:projectId/tickets')
  @ApiOperation({ summary: 'List the tickets of a project, optionally filtered' })
  @ApiQuery({
    name: 'sprintId',
    required: false,
    description: 'Sprint id, or "backlog"/"null" for tickets without a sprint',
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  list(
    @Param('projectId') projectId: string,
    @Query('sprintId') sprintId?: string,
    @Query('status') status?: TicketStatus,
    @Query('assigneeId') assigneeId?: string,
  ): Promise<Ticket[]> {
    const filters: TicketFilters = {};
    if (sprintId !== undefined) {
      filters.sprintId =
        sprintId === 'backlog' || sprintId === 'null' ? null : sprintId;
    }
    if (status) filters.status = status;
    if (assigneeId) filters.assigneeId = assigneeId;
    return this.listTickets.execute(projectId, filters);
  }

  @Post('projects/:projectId/tickets')
  @ApiOperation({
    summary: 'Create a ticket (any member); the reporter is the caller',
  })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: User,
  ): Promise<Ticket> {
    return this.createTicket.execute(projectId, dto, user.id);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get a ticket by id' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  getOne(@Param('id') id: string): Promise<Ticket> {
    return this.getTicket.execute(id);
  }

  @Patch('tickets/:id')
  @ApiOperation({
    summary: 'Update a ticket: move status, assign, reorder, edit fields',
  })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ): Promise<Ticket> {
    return this.updateTicket.execute(id, dto);
  }

  @Delete('tickets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a ticket (any member)' })
  @ApiResponse({ status: 204, description: 'Ticket deleted' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.deleteTicket.execute(id);
  }

  @Post('tickets/:id/attachments')
  @ApiOperation({ summary: 'Attach evidence (photo/video metadata) to a ticket' })
  @ApiResponse({ status: 201, description: 'Attachment added' })
  attach(
    @Param('id') id: string,
    @Body() dto: CreateAttachmentDto,
    @CurrentUser() user: User,
  ): Promise<Ticket> {
    return this.addAttachment.execute(id, dto, user);
  }

  @Delete('tickets/:id/attachments/:attachmentId')
  @ApiOperation({ summary: 'Remove an attachment from a ticket' })
  detach(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: User,
  ): Promise<Ticket> {
    return this.removeAttachment.execute(id, attachmentId, user);
  }
}
