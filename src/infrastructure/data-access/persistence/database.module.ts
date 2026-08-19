import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvVar } from '@config/env-var';
import { ProjectOrmEntity } from '@data-access/persistence/project/project.orm-entity';
import { SprintOrmEntity } from '@data-access/persistence/sprint/sprint.orm-entity';
import { TicketOrmEntity } from '@data-access/persistence/ticket/ticket.orm-entity';
import { UserOrmEntity } from '@data-access/persistence/user/user.orm-entity';
import { ProjectMemberOrmEntity } from '@data-access/persistence/project-member/project-member.orm-entity';
import { InvitationOrmEntity } from '@data-access/persistence/invitation/invitation.orm-entity';

const entities = [
  UserOrmEntity,
  ProjectOrmEntity,
  SprintOrmEntity,
  TicketOrmEntity,
  ProjectMemberOrmEntity,
  InvitationOrmEntity,
];

/** Wires TypeORM to PostgreSQL using validated configuration. */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>(EnvVar.DATABASE_URL);
        const synchronize = config.get<boolean>(EnvVar.DB_SYNCHRONIZE);
        const common = {
          type: 'postgres' as const,
          entities,
          synchronize,
          autoLoadEntities: false,
        };

        if (url) {
          return {
            ...common,
            url,
            ssl: { rejectUnauthorized: false },
          };
        }

        return {
          ...common,
          host: config.getOrThrow<string>(EnvVar.DB_HOST),
          port: config.getOrThrow<number>(EnvVar.DB_PORT),
          username: config.getOrThrow<string>(EnvVar.DB_USERNAME),
          password: config.getOrThrow<string>(EnvVar.DB_PASSWORD),
          database: config.getOrThrow<string>(EnvVar.DB_NAME),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
