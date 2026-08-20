import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Epic } from '@entities/epic/epic.entity';
import {
  CreateEpicData,
  IEpicRepository,
  UpdateEpicData,
} from '@entities/epic/epic.gateway';
import { BaseTypeOrmRepository } from '@data-access/persistence/base-typeorm.repository';
import { EpicOrmEntity } from '@data-access/persistence/epic/epic.orm-entity';

@Injectable()
export class EpicTypeOrmRepository
  extends BaseTypeOrmRepository<EpicOrmEntity, Epic>
  implements IEpicRepository
{
  constructor(
    @InjectRepository(EpicOrmEntity)
    repository: Repository<EpicOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: EpicOrmEntity): Epic {
    return Object.assign(new Epic(), orm);
  }

  async findByProject(projectId: string): Promise<Epic[]> {
    const rows = await this.repository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(data: CreateEpicData): Promise<Epic> {
    const saved = await this.repository.save(this.repository.create(data));
    return this.toDomain(saved);
  }

  async update(id: string, patch: UpdateEpicData): Promise<Epic | null> {
    await this.repository.update(id, patch);
    return this.findById(id);
  }

  async deleteByProject(projectId: string): Promise<void> {
    await this.repository.softDelete({ projectId });
  }
}
