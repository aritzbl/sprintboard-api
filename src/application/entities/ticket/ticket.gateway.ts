import { IBaseRepository } from '@entities/shared/base-repository.gateway';
import {
  Priority,
  Ticket,
  TicketAttachment,
  TicketStatus,
  TicketType,
} from '@entities/ticket/ticket.entity';

export interface CreateTicketData {
  projectId: string;
  key: string;
  title: string;
  description: string | null;
  type: TicketType;
  priority: Priority;
  storyPoints: number | null;
  status: TicketStatus;
  reporterId: string;
  assigneeId: string | null;
  sprintId: string | null;
  epicId: string | null;
  labels: string[];
  attachments: TicketAttachment[];
  order: number;
}

export interface UpdateTicketData {
  title?: string;
  description?: string | null;
  type?: TicketType;
  priority?: Priority;
  storyPoints?: number | null;
  status?: TicketStatus;
  assigneeId?: string | null;
  sprintId?: string | null;
  epicId?: string | null;
  labels?: string[];
  order?: number;
}

export interface TicketFilters {
  sprintId?: string | null;
  status?: TicketStatus;
  assigneeId?: string;
  epicId?: string | null;
}

export interface ITicketRepository extends IBaseRepository<Ticket> {
  findByProject(projectId: string, filters?: TicketFilters): Promise<Ticket[]>;
  countByEpic(epicId: string): Promise<number>;
  create(data: CreateTicketData): Promise<Ticket>;
  update(id: string, patch: UpdateTicketData): Promise<Ticket | null>;
  updateAttachments(
    id: string,
    attachments: TicketAttachment[],
  ): Promise<Ticket | null>;
  appendAttachment(
    id: string,
    attachment: TicketAttachment,
  ): Promise<Ticket | null>;
  archiveAttachment(
    id: string,
    attachmentId: string,
  ): Promise<Ticket | null>;
  deleteByProject(projectId: string): Promise<void>;
  /** Moves every ticket of a sprint back to the backlog (sprintId = null). */
  moveSprintTicketsToBacklog(sprintId: string): Promise<void>;
  /** Unlinks tickets from a deleted epic without deleting the tickets. */
  clearEpicFromTickets(epicId: string): Promise<void>;
}
