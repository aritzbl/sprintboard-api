import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/auth';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { User } from '@entities/user/user.entity';
import { IUserRepository } from '@entities/user/user.gateway';
import { SyncUserDto } from '@entities/user/user.types';

/**
 * Creates the local profile for a freshly authenticated Firebase user. The
 * very first user to sync becomes the superadmin; everyone else starts as dev.
 * Idempotent: returns the existing profile if already created.
 */
@Injectable()
export class SyncUserUseCase {
  constructor(
    @Inject(RepositoryName.USER)
    private readonly users: IUserRepository,
  ) {}

  async execute(token: DecodedIdToken, dto: SyncUserDto): Promise<User> {
    const existing = await this.users.findByFirebaseUid(token.uid);
    if (existing) return existing;

    if (!token.email) {
      throw new BadRequestException('Firebase account has no email address');
    }

    const isFirstUser = (await this.users.countAll()) === 0;
    const displayName =
      dto.displayName?.trim() || `${dto.firstName} ${dto.lastName}`;

    return this.users.create({
      firebaseUid: token.uid,
      email: token.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName,
      photoURL: dto.photoURL ?? token.picture ?? null,
      role: isFirstUser ? 'superadmin' : 'dev',
    });
  }
}
