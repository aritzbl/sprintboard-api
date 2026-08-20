import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Epic } from '@entities/epic/epic.entity';
import { IEpicRepository } from '@entities/epic/epic.gateway';
import { CreateEpicDto } from '@entities/epic/epic.types';
import { IProjectRepository } from '@entities/project/project.gateway';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

@Injectable()
export class CreateEpicUseCase {
  constructor(
    @Inject(RepositoryName.EPIC)
    private readonly epics: IEpicRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(
    projectId: string,
    dto: CreateEpicDto,
    user: User,
  ): Promise<Epic> {
    if (!(await this.projects.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
    await this.access.assertManager(user, projectId);
    return this.epics.create({
      projectId,
      name: dto.name,
      description: dto.description ?? null,
      color: dto.color ?? 'violet',
    });
  }
}
