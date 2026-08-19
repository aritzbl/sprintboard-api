import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from '@entities/invitation/invitation.entity';
import {
  CreateInvitationData,
  IInvitationRepository,
  UpdateInvitationData,
} from '@entities/invitation/invitation.gateway';
import { InvitationOrmEntity } from '@data-access/persistence/invitation/invitation.orm-entity';

@Injectable()
export class InvitationTypeOrmRepository implements IInvitationRepository {
  constructor(
    @InjectRepository(InvitationOrmEntity)
    private readonly repository: Repository<InvitationOrmEntity>,
  ) {}

  private toDomain(orm: InvitationOrmEntity): Invitation {
    return Object.assign(new Invitation(), orm);
  }

  async findById(id: string): Promise<Invitation | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async findByToken(token: string): Promise<Invitation | null> {
    const found = await this.repository.findOne({ where: { token } });
    return found ? this.toDomain(found) : null;
  }

  async findAll(): Promise<Invitation[]> {
    const rows = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(data: CreateInvitationData): Promise<Invitation> {
    const saved = await this.repository.save(this.repository.create(data));
    return this.toDomain(saved);
  }

  async update(
    id: string,
    patch: UpdateInvitationData,
  ): Promise<Invitation | null> {
    await this.repository.update(id, patch);
    return this.findById(id);
  }
}
