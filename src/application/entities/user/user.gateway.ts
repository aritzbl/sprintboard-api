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

export interface UpdateMyProfileData {
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string | null;
}

export interface IUserRepository extends IBaseRepository<User> {
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  countAll(): Promise<number>;
  create(data: CreateUserData): Promise<User>;
  updateProfile(id: string, data: UpdateMyProfileData): Promise<User | null>;
  updateRole(id: string, role: Role): Promise<User | null>;
}
