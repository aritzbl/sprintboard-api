import { IBaseRepository } from '@entities/shared/base-repository.gateway';
import { Sprint, SprintStatus } from '@entities/sprint/sprint.entity';

export interface CreateSprintData {
  projectId: string;
  name: string;
  goal: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status?: SprintStatus;
}

export interface UpdateSprintData {
  name?: string;
  goal?: string | null;
  status?: SprintStatus;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface ISprintRepository extends IBaseRepository<Sprint> {
  findByProject(projectId: string): Promise<Sprint[]>;
  findActiveByProject(projectId: string): Promise<Sprint | null>;
  create(data: CreateSprintData): Promise<Sprint>;
  update(id: string, patch: UpdateSprintData): Promise<Sprint | null>;
  deleteByProject(projectId: string): Promise<void>;
}
