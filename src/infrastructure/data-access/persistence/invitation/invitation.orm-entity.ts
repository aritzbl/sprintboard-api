import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '@entities/user/user.entity';
import { InvitationStatus } from '@entities/invitation/invitation.entity';

@Entity({ name: 'invitations' })
export class InvitationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  token!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 20 })
  role!: Role;

  // Stored as JSON array of project ids.
  @Column({ type: 'jsonb', default: () => "'[]'" })
  projectIds!: string[];

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: InvitationStatus;

  @Column({ type: 'uuid' })
  createdById!: string;

  @Column({ type: 'uuid', nullable: true })
  acceptedById!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;
}
