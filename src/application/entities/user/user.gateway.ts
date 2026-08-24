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

export interface UserDirectoryResult {
  items: User[];
  total: number;
}

export interface IUserRepository extends IBaseRepository<User> {
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByIdIncludingDeleted(id: string): Promise<User | null>;
  /** Used while syncing to reject an account that was logically deleted. */
  findByFirebaseUidIncludingDeleted(firebaseUid: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  search(query: string, limit: number): Promise<User[]>;
  findDirectory(options: {
    query?: string;
    isAdmin?: boolean;
    page: number;
    pageSize: number;
  }): Promise<UserDirectoryResult>;
  countAll(): Promise<number>;
  countByRole(role: Role): Promise<number>;
  create(data: CreateUserData): Promise<User>;
  updateProfile(id: string, data: UpdateMyProfileData): Promise<User | null>;
  updateRole(id: string, role: Role): Promise<User | null>;
  updateEmail(id: string, email: string): Promise<User | null>;
}
