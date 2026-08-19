import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { Project } from '@entities/project/project.entity';
import {
  IProjectRepository,
  UpdateProjectData,
} from '@entities/project/project.gateway';
import { UpdateProjectDto } from '@entities/project/project.types';

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
  ) {}

  async execute(id: string, dto: UpdateProjectDto): Promise<Project> {
    const existing = await this.projects.findById(id);
    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    const patch: UpdateProjectData = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description ?? null;

    if (Object.keys(patch).length === 0) return existing;

    const updated = await this.projects.update(id, patch);
    return updated ?? existing;
  }
}
