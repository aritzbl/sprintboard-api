import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/auth';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { User } from '@entities/user/user.entity';
import { IUserRepository } from '@entities/user/user.gateway';
import { SyncUserDto } from '@entities/user/user.types';
import { IInvitationRepository } from '@entities/invitation/invitation.gateway';

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
    @Inject(RepositoryName.INVITATION)
    private readonly invitations: IInvitationRepository,
  ) {}

  async execute(token: DecodedIdToken, dto: SyncUserDto): Promise<User> {
    const existing = await this.users.findByFirebaseUidIncludingDeleted(token.uid);
    if (existing?.deletedAt) {
      throw new ForbiddenException('Esta cuenta fue eliminada del workspace.');
    }
    if (existing) return existing;

    if (!token.email) {
      throw new BadRequestException('Firebase account has no email address');
    }

    if (!dto.invitationToken) {
      throw new ForbiddenException('An invitation is required to create an account');
    }
    const invitation = await this.invitations.findByToken(dto.invitationToken);
    if (
      !invitation ||
      invitation.status !== 'pending' ||
      (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) ||
      invitation.email?.toLowerCase() !== token.email.toLowerCase()
    ) {
      throw new ForbiddenException('The invitation is not valid for this account');
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
