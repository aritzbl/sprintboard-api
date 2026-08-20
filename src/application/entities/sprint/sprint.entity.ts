export const SPRINT_STATUSES = ['planned', 'active', 'completed'] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];

/** A time-boxed iteration inside a project. */
export class Sprint {
  id!: string;
  projectId!: string;
  name!: string;
  goal!: string | null;
  status!: SprintStatus;
  startDate!: Date | null;
  endDate!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;
}
