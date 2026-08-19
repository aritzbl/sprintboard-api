import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '@entities/user/user.entity';

@Entity({ name: 'users' })
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128 })
  firebaseUid!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 60 })
  firstName!: string;

  @Column({ type: 'varchar', length: 60 })
  lastName!: string;

  @Column({ type: 'varchar', length: 120 })
  displayName!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  photoURL!: string | null;

  @Column({ type: 'varchar', length: 20 })
  role!: Role;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
