import { Epic } from '@entities/epic/epic.entity';
import { IBaseRepository } from '@entities/shared/base-repository.gateway';

export interface CreateEpicData {
  projectId: string;
  name: string;
  description: string | null;
  color: string;
}

export interface UpdateEpicData {
  name?: string;
  description?: string | null;
  color?: string;
}

export interface IEpicRepository extends IBaseRepository<Epic> {
  findByProject(projectId: string): Promise<Epic[]>;
  create(data: CreateEpicData): Promise<Epic>;
  update(id: string, patch: UpdateEpicData): Promise<Epic | null>;
  deleteByProject(projectId: string): Promise<void>;
}
