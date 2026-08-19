import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepositoryName } from '@entities/shared/base-repository.gateway';
import { UserOrmEntity } from '@data-access/persistence/user/user.orm-entity';
import { ProjectOrmEntity } from '@data-access/persistence/project/project.orm-entity';
import { SprintOrmEntity } from '@data-access/persistence/sprint/sprint.orm-entity';
import { TicketOrmEntity } from '@data-access/persistence/ticket/ticket.orm-entity';
import { ProjectMemberOrmEntity } from '@data-access/persistence/project-member/project-member.orm-entity';
import { InvitationOrmEntity } from '@data-access/persistence/invitation/invitation.orm-entity';
import { UserTypeOrmRepository } from '@data-access/persistence/user/user.typeorm-repository';
import { ProjectTypeOrmRepository } from '@data-access/persistence/project/project.typeorm-repository';
import { SprintTypeOrmRepository } from '@data-access/persistence/sprint/sprint.typeorm-repository';
import { TicketTypeOrmRepository } from '@data-access/persistence/ticket/ticket.typeorm-repository';
import { ProjectMemberTypeOrmRepository } from '@data-access/persistence/project-member/project-member.typeorm-repository';
import { InvitationTypeOrmRepository } from '@data-access/persistence/invitation/invitation.typeorm-repository';

/**
 * Binds each repository port (RepositoryName.*) to its TypeORM implementation
 * and exposes the tokens app-wide, so use cases can inject the ports without
 * knowing about the persistence layer.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      ProjectOrmEntity,
      SprintOrmEntity,
      TicketOrmEntity,
      ProjectMemberOrmEntity,
      InvitationOrmEntity,
    ]),
  ],
  providers: [
    { provide: RepositoryName.USER, useClass: UserTypeOrmRepository },
    { provide: RepositoryName.PROJECT, useClass: ProjectTypeOrmRepository },
    { provide: RepositoryName.SPRINT, useClass: SprintTypeOrmRepository },
    { provide: RepositoryName.TICKET, useClass: TicketTypeOrmRepository },
    {
      provide: RepositoryName.PROJECT_MEMBER,
      useClass: ProjectMemberTypeOrmRepository,
    },
    { provide: RepositoryName.INVITATION, useClass: InvitationTypeOrmRepository },
  ],
  exports: [
    RepositoryName.USER,
    RepositoryName.PROJECT,
    RepositoryName.SPRINT,
    RepositoryName.TICKET,
    RepositoryName.PROJECT_MEMBER,
    RepositoryName.INVITATION,
  ],
})
export class PersistenceModule {}
