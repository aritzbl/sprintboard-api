import { Inject, Injectable } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { Project } from '@entities/project/project.entity';
import { IProjectRepository } from '@entities/project/project.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

@Injectable()
export class ListProjectsUseCase {
  constructor(
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(user: User): Promise<Project[]> {
    const visible = await this.access.visibleProjectIds(user);
    if (visible === 'all') return this.projects.findAll();
    return this.projects.findByIds(visible);
  }
}
