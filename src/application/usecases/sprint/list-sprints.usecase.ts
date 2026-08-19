import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { Sprint } from '@entities/sprint/sprint.entity';
import { ISprintRepository } from '@entities/sprint/sprint.gateway';

@Injectable()
export class ListSprintsUseCase {
  constructor(
    @Inject(RepositoryName.SPRINT)
    private readonly sprints: ISprintRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
  ) {}

  async execute(projectId: string): Promise<Sprint[]> {
    if (!(await this.projects.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
    return this.sprints.findByProject(projectId);
  }
}
