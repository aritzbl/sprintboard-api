import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Epic } from '@entities/epic/epic.entity';
import { IEpicRepository, UpdateEpicData } from '@entities/epic/epic.gateway';
import { UpdateEpicDto } from '@entities/epic/epic.types';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { User } from '@entities/user/user.entity';
import { ProjectAccessService } from '@services/project-access.service';

@Injectable()
export class UpdateEpicUseCase {
  constructor(
    @Inject(RepositoryName.EPIC)
    private readonly epics: IEpicRepository,
    private readonly access: ProjectAccessService,
  ) {}

  async execute(id: string, dto: UpdateEpicDto, user: User): Promise<Epic> {
    const existing = await this.epics.findById(id);
    if (!existing) {
      throw new NotFoundException('Epic not found');
    }
    await this.access.assertManager(user, existing.projectId);

    const patch: UpdateEpicData = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined)
      patch.description = dto.description ?? null;
    if (dto.color !== undefined) patch.color = dto.color;
    if (Object.keys(patch).length === 0) return existing;

    return (await this.epics.update(id, patch)) ?? existing;
  }
}
