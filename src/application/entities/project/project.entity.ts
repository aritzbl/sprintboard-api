/** A workspace project: owns its own backlog, sprints and tickets. */
export class Project {
  id!: string;
  name!: string;
  /** Uppercase prefix used to build ticket keys, e.g. "PROJ" -> PROJ-1. */
  key!: string;
  description!: string | null;
  /** Last used ticket number; incremented atomically per new ticket. */
  ticketCounter!: number;
  createdById!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
