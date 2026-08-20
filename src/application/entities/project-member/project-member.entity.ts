/** Membership linking a user to a project they can access. */
export class ProjectMember {
  id!: string;
  projectId!: string;
  userId!: string;
  role!: Role | null;
  createdAt!: Date;
}
import { Role } from '@entities/user/user.entity';
