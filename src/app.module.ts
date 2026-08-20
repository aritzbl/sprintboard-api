import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { validateEnv } from '@config/config';
import { FirebaseModule } from '@services/firebase.module';
import { AccessModule } from '@services/access.module';
import { DatabaseModule } from '@data-access/persistence/database.module';
import { PersistenceModule } from '@data-access/persistence/persistence.module';
import { AuthModule } from '@interfaces/http/middlewares/auth/auth.module';
import { UserModule } from '@/modules/user.module';
import { ProjectModule } from '@/modules/project.module';
import { SprintModule } from '@/modules/sprint.module';
import { TicketModule } from '@/modules/ticket.module';
import { InvitationModule } from '@/modules/invitation.module';
import { EpicModule } from '@/modules/epic.module';
import { HealthController } from '@interfaces/http/controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    FirebaseModule,
    AccessModule,
    DatabaseModule,
    PersistenceModule,
    AuthModule,
    UserModule,
    ProjectModule,
    SprintModule,
    TicketModule,
    InvitationModule,
    EpicModule,
  ],
  controllers: [HealthController],
  providers: [
    // Validate every @Body against its Zod DTO schema.
    { provide: APP_PIPE, useClass: ZodValidationPipe },
  ],
})
export class AppModule {}
