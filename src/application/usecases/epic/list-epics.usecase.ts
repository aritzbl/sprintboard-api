import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Epic } from '@entities/epic/epic.entity';
import { IEpicRepository } from '@entities/epic/epic.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

@Injectable()
export class ListEpicsUseCase {
  constructor(
    @Inject(RepositoryName.EPIC)
    private readonly epics: IEpicRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(projectId: string, user: User): Promise<Epic[]> {
    if (!(await this.projects.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
    await this.access.assertAccess(user, projectId);
    return this.epics.findByProject(projectId);
  }
}
