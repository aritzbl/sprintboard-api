import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint } from '@entities/sprint/sprint.entity';
import {
  CreateSprintData,
  ISprintRepository,
  UpdateSprintData,
} from '@entities/sprint/sprint.gateway';
import { BaseTypeOrmRepository } from '@data-access/persistence/base-typeorm.repository';
import { SprintOrmEntity } from '@data-access/persistence/sprint/sprint.orm-entity';

@Injectable()
export class SprintTypeOrmRepository
  extends BaseTypeOrmRepository<SprintOrmEntity, Sprint>
  implements ISprintRepository
{
  constructor(
    @InjectRepository(SprintOrmEntity)
    repository: Repository<SprintOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: SprintOrmEntity): Sprint {
    return Object.assign(new Sprint(), orm);
  }

  async findByProject(projectId: string): Promise<Sprint[]> {
    const rows = await this.repository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findActiveByProject(projectId: string): Promise<Sprint | null> {
    const found = await this.repository.findOne({
      where: { projectId, status: 'active' },
    });
    return found ? this.toDomain(found) : null;
  }

  async create(data: CreateSprintData): Promise<Sprint> {
    const saved = await this.repository.save(
      this.repository.create({ ...data, status: 'planned' }),
    );
    return this.toDomain(saved);
  }

  async update(id: string, patch: UpdateSprintData): Promise<Sprint | null> {
    await this.repository.update(id, patch);
    return this.findById(id);
  }

  async deleteByProject(projectId: string): Promise<void> {
    await this.repository.delete({ projectId });
  }
}
