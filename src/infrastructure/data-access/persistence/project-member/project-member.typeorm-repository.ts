import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from '@entities/project-member/project-member.entity';
import { Role } from '@entities/user/user.entity';
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

  async find(projectId: string, userId: string): Promise<ProjectMember | null> {
    const member = await this.repository.findOne({ where: { projectId, userId } });
    return member ? this.toDomain(member) : null;
  }

  async add(projectId: string, userId: string, role: Role = 'dev'): Promise<ProjectMember> {
    const existing = await this.repository.findOne({
      where: { projectId, userId },
    });
    if (existing) {
      if (existing.role !== role) {
        existing.role = role;
        return this.toDomain(await this.repository.save(existing));
      }
      return this.toDomain(existing);
    }
    const saved = await this.repository.save(
      this.repository.create({ projectId, userId, role }),
    );
    return this.toDomain(saved);
  }

  async updateRole(projectId: string, userId: string, role: Role): Promise<ProjectMember | null> {
    await this.repository.update({ projectId, userId }, { role });
    const member = await this.repository.findOne({ where: { projectId, userId } });
    return member ? this.toDomain(member) : null;
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

  async pageUserIdsForProject(
    projectId: string,
    page: number,
    pageSize: number,
  ): Promise<{ members: Pick<ProjectMember, 'userId' | 'role'>[]; total: number }> {
    const [rows, total] = await this.repository.findAndCount({
      where: { projectId },
      select: ['userId', 'role'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { members: rows.map((row) => ({ userId: row.userId, role: row.role })), total };
  }

  async removeByProject(projectId: string): Promise<void> {
    await this.repository.delete({ projectId });
  }
}
