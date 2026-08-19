import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { Sprint } from '@entities/sprint/sprint.entity';
import {
  ISprintRepository,
  UpdateSprintData,
} from '@entities/sprint/sprint.gateway';
import { UpdateSprintDto } from '@entities/sprint/sprint.types';

@Injectable()
export class UpdateSprintUseCase {
  constructor(
    @Inject(RepositoryName.SPRINT)
    private readonly sprints: ISprintRepository,
  ) {}

  async execute(id: string, dto: UpdateSprintDto): Promise<Sprint> {
    const existing = await this.sprints.findById(id);
    if (!existing) {
      throw new NotFoundException('Sprint not found');
    }

    const patch: UpdateSprintData = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.goal !== undefined) patch.goal = dto.goal ?? null;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.startDate !== undefined) {
      patch.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.endDate !== undefined) {
      patch.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }

    if (Object.keys(patch).length === 0) return existing;

    const updated = await this.sprints.update(id, patch);
    return updated ?? existing;
  }
}
