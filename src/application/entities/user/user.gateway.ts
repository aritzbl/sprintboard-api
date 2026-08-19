import { IBaseRepository } from '@entities/shared/base-repository.gateway';
import { Role, User } from '@entities/user/user.entity';

export interface CreateUserData {
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL: string | null;
  role: Role;
}

export interface IUserRepository extends IBaseRepository<User> {
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  countAll(): Promise<number>;
  create(data: CreateUserData): Promise<User>;
  updateRole(id: string, role: Role): Promise<User | null>;
}
