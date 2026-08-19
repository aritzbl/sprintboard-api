import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { Project } from '@entities/project/project.entity';
import { IProjectRepository } from '@entities/project/project.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

@Injectable()
export class GetProjectUseCase {
  constructor(
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(id: string, user: User): Promise<Project> {
    const project = await this.projects.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.access.assertAccess(user, id);
    return project;
  }
}
