import { IBaseRepository } from '@entities/shared/base-repository.gateway';
import { Project } from '@entities/project/project.entity';

export interface CreateProjectData {
  name: string;
  key: string;
  description: string | null;
  createdById: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string | null;
}

export interface IProjectRepository extends IBaseRepository<Project> {
  findByKey(key: string): Promise<Project | null>;
  findByIds(ids: string[]): Promise<Project[]>;
  create(data: CreateProjectData): Promise<Project>;
  update(id: string, patch: UpdateProjectData): Promise<Project | null>;
  /** Atomically increments and returns the next ticket number for a project. */
  nextTicketNumber(projectId: string): Promise<number>;
}
