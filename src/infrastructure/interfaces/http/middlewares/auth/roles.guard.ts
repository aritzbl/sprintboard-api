import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@entities/user/user.entity';
import { AuthenticatedRequest } from '@interfaces/http/middlewares/auth/authenticated-request';
import {
  ALLOW_UNSYNCED_KEY,
  PUBLIC_KEY,
  ROLES_KEY,
} from '@interfaces/http/middlewares/auth/roles.decorator';

/**
 * Ensures the request has a synced user and, when @Roles is present, that the
 * user holds one of the allowed roles. Must run after FirebaseAuthGuard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_KEY,
      targets,
    );
    if (isPublic) {
      return true;
    }

    const allowUnsynced = this.reflector.getAllAndOverride<boolean>(
      ALLOW_UNSYNCED_KEY,
      targets,
    );
    if (allowUnsynced) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.currentUser;
    if (!user) {
      throw new UnauthorizedException('User profile not initialized');
    }

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets);
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }

    return true;
  }
}
