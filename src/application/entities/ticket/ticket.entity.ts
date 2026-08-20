/** story = Historia de Usuario (HU). */
export const TICKET_TYPES = ['bug', 'task', 'story'] as const;
export type TicketType = (typeof TICKET_TYPES)[number];

export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Priority = (typeof PRIORITIES)[number];

// qa is shown as "To Test" in the UI.
export const TICKET_STATUSES = [
  'todo',
  'in_progress',
  'qa',
  'done',
  'rejected',
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

/**
 * Allowed status transitions (workflow state machine). Every ticket starts in
 * `todo`; staying in the same status is always allowed.
 *   todo → in_progress → qa → done | rejected
 *   done / rejected → qa | in_progress   (send it back to be reworked/retested)
 */
export const TICKET_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> =
  {
    todo: ['in_progress'],
    in_progress: ['qa'],
    qa: ['done', 'rejected'],
    done: ['qa', 'in_progress'],
    rejected: ['qa', 'in_progress'],
  };

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return from === to || TICKET_TRANSITIONS[from].includes(to);
}

/** Fibonacci scale offered for story points. */
export const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;

/** A piece of evidence attached to a ticket (stored in Firebase Storage). */
export interface TicketAttachment {
  id: string;
  url: string;
  storagePath: string;
  name: string;
  contentType: string;
  size: number;
  uploadedById: string;
  createdAt: string;
  /** Logical deletion timestamp. Archived evidence is never returned to the UI. */
  deletedAt?: string | null;
}

/** A unit of work: bug, task or user story. */
export class Ticket {
  id!: string;
  projectId!: string;
  /** Human-readable identifier, e.g. PROJ-12. */
  key!: string;
  title!: string;
  description!: string | null;
  type!: TicketType;
  priority!: Priority;
  storyPoints!: number | null;
  status!: TicketStatus;
  reporterId!: string;
  assigneeId!: string | null;
  /** null means the ticket sits in the backlog. */
  sprintId!: string | null;
  /** null means the ticket is not part of an epic. */
  epicId!: string | null;
  labels!: string[];
  attachments!: TicketAttachment[];
  /** Ordering within its board column. */
  order!: number;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;
}
