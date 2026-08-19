import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role, User } from '@entities/user/user.entity';
import {
  CreateUserData,
  IUserRepository,
  UpdateMyProfileData,
} from '@entities/user/user.gateway';
import { BaseTypeOrmRepository } from '@data-access/persistence/base-typeorm.repository';
import { UserOrmEntity } from '@data-access/persistence/user/user.orm-entity';

@Injectable()
export class UserTypeOrmRepository
  extends BaseTypeOrmRepository<UserOrmEntity, User>
  implements IUserRepository
{
  constructor(
    @InjectRepository(UserOrmEntity)
    repository: Repository<UserOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: UserOrmEntity): User {
    return Object.assign(new User(), orm);
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const found = await this.repository.findOne({ where: { firebaseUid } });
    return found ? this.toDomain(found) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const rows = await this.repository.find({ where: { id: In(ids) } });
    return rows.map((row) => this.toDomain(row));
  }

  async countAll(): Promise<number> {
    return this.repository.count();
  }

  async create(data: CreateUserData): Promise<User> {
    const saved = await this.repository.save(this.repository.create(data));
    return this.toDomain(saved);
  }

  async updateRole(id: string, role: Role): Promise<User | null> {
    await this.repository.update(id, { role });
    return this.findById(id);
  }

  async updateProfile(
    id: string,
    data: UpdateMyProfileData,
  ): Promise<User | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }
}
