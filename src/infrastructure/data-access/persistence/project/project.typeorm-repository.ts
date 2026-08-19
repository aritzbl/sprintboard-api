import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from '@entities/project/project.entity';
import {
  CreateProjectData,
  IProjectRepository,
  UpdateProjectData,
} from '@entities/project/project.gateway';
import { BaseTypeOrmRepository } from '@data-access/persistence/base-typeorm.repository';
import { ProjectOrmEntity } from '@data-access/persistence/project/project.orm-entity';

@Injectable()
export class ProjectTypeOrmRepository
  extends BaseTypeOrmRepository<ProjectOrmEntity, Project>
  implements IProjectRepository
{
  constructor(
    @InjectRepository(ProjectOrmEntity)
    repository: Repository<ProjectOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: ProjectOrmEntity): Project {
    return Object.assign(new Project(), orm);
  }

  async findAll(): Promise<Project[]> {
    const rows = await this.repository.find({ order: { createdAt: 'DESC' } });
    return rows.map((row) => this.toDomain(row));
  }

  async findByKey(key: string): Promise<Project | null> {
    const found = await this.repository.findOne({ where: { key } });
    return found ? this.toDomain(found) : null;
  }

  async findByIds(ids: string[]): Promise<Project[]> {
    if (ids.length === 0) return [];
    const rows = await this.repository.find({
      where: { id: In(ids) },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(data: CreateProjectData): Promise<Project> {
    const saved = await this.repository.save(this.repository.create(data));
    return this.toDomain(saved);
  }

  async update(id: string, patch: UpdateProjectData): Promise<Project | null> {
    await this.repository.update(id, patch);
    return this.findById(id);
  }

  async nextTicketNumber(projectId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(ProjectOrmEntity)
      .set({ ticketCounter: () => 'ticket_counter + 1' })
      .where('id = :id', { id: projectId })
      .returning('ticket_counter')
      .execute();

    const raw = result.raw as Array<{ ticket_counter: number }>;
    return raw[0].ticket_counter;
  }
}
