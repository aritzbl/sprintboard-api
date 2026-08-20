/** Membership linking a user to a project they can access. */
export class ProjectMember {
  id!: string;
  projectId!: string;
  userId!: string;
  role!: Role | null;
  createdAt!: Date;
  deletedAt!: Date | null;
}
import { Role } from '@entities/user/user.entity';
