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
import { EpicOrmEntity } from '@data-access/persistence/epic/epic.orm-entity';
import { EpicTypeOrmRepository } from '@data-access/persistence/epic/epic.typeorm-repository';
import { TicketCommentOrmEntity } from '@data-access/persistence/ticket-comment/ticket-comment.orm-entity';
import { TicketCommentTypeOrmRepository } from '@data-access/persistence/ticket-comment/ticket-comment.typeorm-repository';
import { EmailChangeRequestOrmEntity } from '@data-access/persistence/email-change/email-change-request.orm-entity';
import { EmailChangeRequestTypeOrmRepository } from '@data-access/persistence/email-change/email-change-request.typeorm-repository';

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
      EpicOrmEntity,
      TicketCommentOrmEntity,
      EmailChangeRequestOrmEntity,
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
    {
      provide: RepositoryName.INVITATION,
      useClass: InvitationTypeOrmRepository,
    },
    { provide: RepositoryName.EPIC, useClass: EpicTypeOrmRepository },
    {
      provide: RepositoryName.TICKET_COMMENT,
      useClass: TicketCommentTypeOrmRepository,
    },
    {
      provide: RepositoryName.EMAIL_CHANGE_REQUEST,
      useClass: EmailChangeRequestTypeOrmRepository,
    },
  ],
  exports: [
    RepositoryName.USER,
    RepositoryName.PROJECT,
    RepositoryName.SPRINT,
    RepositoryName.TICKET,
    RepositoryName.PROJECT_MEMBER,
    RepositoryName.INVITATION,
    RepositoryName.EPIC,
    RepositoryName.TICKET_COMMENT,
    RepositoryName.EMAIL_CHANGE_REQUEST,
  ],
})
export class PersistenceModule {}
