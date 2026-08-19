import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { Project } from '@entities/project/project.entity';
import { IProjectRepository } from '@entities/project/project.gateway';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { CreateProjectDto } from '@entities/project/project.types';

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
    @Inject(RepositoryName.PROJECT_MEMBER)
    private readonly members: IProjectMemberRepository,
  ) {}

  async execute(dto: CreateProjectDto, createdById: string): Promise<Project> {
    const key = dto.key.toUpperCase();
    if (await this.projects.findByKey(key)) {
      throw new ConflictException(`Project key "${key}" is already in use`);
    }

    const project = await this.projects.create({
      name: dto.name,
      key,
      description: dto.description ?? null,
      createdById,
    });

    // The creator is automatically a member of the project.
    await this.members.add(project.id, createdById);

    return project;
  }
}
