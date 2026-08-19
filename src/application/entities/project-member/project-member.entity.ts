/** Membership linking a user to a project they can access. */
export class ProjectMember {
  id!: string;
  projectId!: string;
  userId!: string;
  createdAt!: Date;
}
