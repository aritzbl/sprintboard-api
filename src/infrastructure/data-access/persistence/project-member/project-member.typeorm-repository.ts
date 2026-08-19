import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from '@entities/project-member/project-member.entity';
import { IProjectMemberRepository } from '@entities/project-member/project-member.gateway';
import { ProjectMemberOrmEntity } from '@data-access/persistence/project-member/project-member.orm-entity';

@Injectable()
export class ProjectMemberTypeOrmRepository implements IProjectMemberRepository {
  constructor(
    @InjectRepository(ProjectMemberOrmEntity)
    private readonly repository: Repository<ProjectMemberOrmEntity>,
  ) {}

  private toDomain(orm: ProjectMemberOrmEntity): ProjectMember {
    return Object.assign(new ProjectMember(), orm);
  }

  async exists(projectId: string, userId: string): Promise<boolean> {
    return (await this.repository.count({ where: { projectId, userId } })) > 0;
  }

  async add(projectId: string, userId: string): Promise<ProjectMember> {
    const existing = await this.repository.findOne({
      where: { projectId, userId },
    });
    if (existing) return this.toDomain(existing);
    const saved = await this.repository.save(
      this.repository.create({ projectId, userId }),
    );
    return this.toDomain(saved);
  }

  async remove(projectId: string, userId: string): Promise<void> {
    await this.repository.delete({ projectId, userId });
  }

  async projectIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.repository.find({
      where: { userId },
      select: ['projectId'],
    });
    return rows.map((r) => r.projectId);
  }

  async userIdsForProject(projectId: string): Promise<string[]> {
    const rows = await this.repository.find({
      where: { projectId },
      select: ['userId'],
    });
    return rows.map((r) => r.userId);
  }

  async removeByProject(projectId: string): Promise<void> {
    await this.repository.delete({ projectId });
  }
}
