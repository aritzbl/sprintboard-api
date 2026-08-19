import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '@data-access/persistence/user/user.orm-entity';
import { FirebaseAuthGuard } from '@interfaces/http/middlewares/auth/firebase-auth.guard';
import { RolesGuard } from '@interfaces/http/middlewares/auth/roles.guard';

/**
 * Registers the authentication/authorization guards globally.
 * FirebaseAuthGuard runs first (verifies the Firebase ID token and loads the
 * local user); RolesGuard then enforces @Roles / @AllowUnsynced. Registering
 * them here means they are instantiated in this module's context, where the
 * UserOrmEntity repository is available. Swagger (/docs) is served outside the
 * Nest router, so it stays public.
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  providers: [
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
