import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirebaseService } from '@services/firebase.service';
import { User } from '@entities/user/user.entity';
import { UserOrmEntity } from '@data-access/persistence/user/user.orm-entity';
import { AuthenticatedRequest } from '@interfaces/http/middlewares/auth/authenticated-request';
import { PUBLIC_KEY } from '@interfaces/http/middlewares/auth/roles.decorator';

/**
 * Verifies the Firebase ID token from the Authorization header and attaches
 * both the decoded token and the local user (if any) to the request. Routes
 * marked @Public() skip authentication.
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly firebase: FirebaseService,
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const decoded = await this.firebase.verifyIdToken(token);
    request.firebaseToken = decoded;

    const row = await this.users.findOne({
      where: { firebaseUid: decoded.uid },
    });
    request.currentUser = row ? Object.assign(new User(), row) : null;

    return true;
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [type, value] = header.split(' ');
    return type === 'Bearer' && value ? value : null;
  }
}
