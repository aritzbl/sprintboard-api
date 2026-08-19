import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  Priority,
  TicketAttachment,
  TicketStatus,
  TicketType,
} from '@entities/ticket/ticket.entity';

@Entity({ name: 'tickets' })
@Index(['projectId', 'key'], { unique: true })
export class TicketOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ type: 'varchar', length: 20 })
  key!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20 })
  type!: TicketType;

  @Column({ type: 'varchar', length: 20 })
  priority!: Priority;

  @Column({ name: 'story_points', type: 'int', nullable: true })
  storyPoints!: number | null;

  @Column({ type: 'varchar', length: 20 })
  status!: TicketStatus;

  @Column({ name: 'reporter_id', type: 'uuid' })
  reporterId!: string;

  @Index()
  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId!: string | null;

  @Index()
  @Column({ name: 'sprint_id', type: 'uuid', nullable: true })
  sprintId!: string | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  labels!: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  attachments!: TicketAttachment[];

  @Column({ name: 'board_order', type: 'int', default: 0 })
  order!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
