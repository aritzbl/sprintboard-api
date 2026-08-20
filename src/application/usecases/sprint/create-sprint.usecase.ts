import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { IProjectRepository } from '@entities/project/project.gateway';
import { Sprint } from '@entities/sprint/sprint.entity';
import { ISprintRepository } from '@entities/sprint/sprint.gateway';
import { CreateSprintDto } from '@entities/sprint/sprint.types';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

@Injectable()
export class CreateSprintUseCase {
  constructor(
    @Inject(RepositoryName.SPRINT)
    private readonly sprints: ISprintRepository,
    @Inject(RepositoryName.PROJECT)
    private readonly projects: IProjectRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(projectId: string, dto: CreateSprintDto, user: User): Promise<Sprint> {
    if (!(await this.projects.findById(projectId))) {
      throw new NotFoundException('Project not found');
    }
    await this.access.assertManager(user, projectId);
    if (await this.sprints.findActiveByProject(projectId)) {
      throw new BadRequestException(
        'Completá el sprint activo antes de crear uno nuevo.',
      );
    }

    const existing = await this.sprints.findByProject(projectId);
    const number = existing.reduce((highest, sprint) => {
      const match = /^Sprint\s+(\d+)$/i.exec(sprint.name.trim());
      return Math.max(highest, match ? Number(match[1]) : 0);
    }, 0) + 1;

    return this.sprints.create({
      projectId,
      name: `Sprint ${number}`,
      goal: null,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      status: 'active',
    });
  }
}
