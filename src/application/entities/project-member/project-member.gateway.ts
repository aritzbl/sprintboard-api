import { ProjectMember } from '@entities/project-member/project-member.entity';
import { Role } from '@entities/user/user.entity';

export interface IProjectMemberRepository {
  exists(projectId: string, userId: string): Promise<boolean>;
  find(projectId: string, userId: string): Promise<ProjectMember | null>;
  add(projectId: string, userId: string, role?: Role): Promise<ProjectMember>;
  updateRole(projectId: string, userId: string, role: Role): Promise<ProjectMember | null>;
  remove(projectId: string, userId: string): Promise<void>;
  /** Project ids the user is a member of. */
  projectIdsForUser(userId: string): Promise<string[]>;
  /** User ids that are members of a project. */
  userIdsForProject(projectId: string): Promise<string[]>;
  /** A page of member ids, ordered by the time they joined the project. */
  pageUserIdsForProject(
    projectId: string,
    page: number,
    pageSize: number,
  ): Promise<{ members: Pick<ProjectMember, 'userId' | 'role'>[]; total: number }>;
  /** Remove every membership of a project (used when a project is deleted). */
  removeByProject(projectId: string): Promise<void>;
}
