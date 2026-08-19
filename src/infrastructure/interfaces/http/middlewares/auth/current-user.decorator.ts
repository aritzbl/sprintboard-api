import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '@interfaces/http/middlewares/auth/authenticated-request';

/** Injects the synced domain user; throws if the profile is missing. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.currentUser) {
      throw new UnauthorizedException('User profile not initialized');
    }
    return request.currentUser;
  },
);

/** Injects the raw decoded Firebase token. */
export const CurrentFirebaseToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.firebaseToken) {
      throw new UnauthorizedException('Missing authentication');
    }
    return request.firebaseToken;
  },
);
