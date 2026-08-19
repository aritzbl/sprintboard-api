import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { Sprint } from '@entities/sprint/sprint.entity';
import { ISprintRepository } from '@entities/sprint/sprint.gateway';
import { CreateSprintDto } from '@entities/sprint/sprint.types';

@Injectable()
export class CreateSprintUseCase {
  constructor(
    @Inject(RepositoryName.SPRINT)
    private readonly sprints: ISprintRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
  ) {}

  async execute(projectId: string, dto: CreateSprintDto): Promise<Sprint> {
    if (!(await this.projects.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }

    return this.sprints.create({
      projectId,
      name: dto.name,
      goal: dto.goal ?? null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    });
  }
}
